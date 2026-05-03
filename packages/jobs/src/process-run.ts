import { prisma } from '@amable/db';
import { RunMode, RunStatus, IntegrationType } from '@prisma/client';
import { createRunStream, parsePlanMessageForSpec } from '@amable/ai';
import { consumeCredits } from '@amable/credits';

async function ensureFiles(projectId: string) {
  const count = await prisma.projectFile.count({ where: { projectId } });
  if (count > 0) return;
  const files = [
    {
      path: 'src/App.tsx',
      content: `export default function App() {\n  return (\n    <main style={{ fontFamily: 'system-ui', padding: 24 }}>\n      <h1>Vista previa Amable Studio</h1>\n      <p>Describe cambios en el compositor y usa modo Construir.</p>\n    </main>\n  );\n}\n`,
    },
  ];
  for (const f of files) {
    const hash = simpleHash(f.content);
    await prisma.projectFile.create({
      data: {
        projectId,
        path: f.path,
        content: f.content,
        hash,
        size: Buffer.byteLength(f.content, 'utf8'),
      },
    });
  }
}

function simpleHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return `h${(h >>> 0).toString(16)}`;
}

function mapIntegrationId(s: string): IntegrationType | null {
  const k = s.toLowerCase();
  if (k === 'stripe') return IntegrationType.stripe;
  if (k === 'supabase') return IntegrationType.supabase;
  if (k === 'github') return IntegrationType.github;
  return null;
}

async function syncIntegrationsFromSpec(projectId: string, integrations: string[]) {
  for (const raw of integrations) {
    const t = mapIntegrationId(raw);
    if (!t) continue;
    await prisma.projectIntegration.upsert({
      where: { projectId_type: { projectId, type: t } },
      create: { projectId, type: t, enabled: false },
      update: {},
    });
  }
}

async function seedGeneratedRows(projectId: string, entities: { name: string }[]) {
  for (const e of entities) {
    const count = await prisma.generatedRow.count({ where: { projectId, entity: e.name } });
    if (count > 0) continue;
    await prisma.generatedRow.create({
      data: {
        projectId,
        entity: e.name,
        data: { _demo: true, note: 'Fila de ejemplo generada al construir el plan' },
      },
    });
  }
}

export async function processRun(runId: string) {
  const run = await prisma.run.findUnique({
    where: { id: runId },
    include: { project: { include: { workspace: true } } },
  });
  if (!run) return;
  if (run.status === RunStatus.done || run.status === RunStatus.cancelled) return;

  await prisma.run.update({
    where: { id: runId },
    data: { status: RunStatus.running, startedAt: new Date() },
  });

  const mode = run.mode === RunMode.plan ? 'plan' : 'build';
  let order = 0;
  let creditsUsed = 0;
  let lastAssistant = '';

  const specRow = await prisma.projectProductSpec.findUnique({ where: { projectId: run.projectId } });
  const productSpecSummary = specRow ? JSON.stringify(specRow.specJson) : undefined;

  try {
    for await (const ev of createRunStream({
      mode,
      prompt: run.prompt,
      productSpecSummary: mode === 'build' ? productSpecSummary : undefined,
    })) {
      if (ev.type === 'step') {
        const existing = await prisma.runStep.findFirst({
          where: { runId, name: ev.name },
          orderBy: { order: 'desc' },
        });
        if (existing) {
          await prisma.runStep.update({
            where: { id: existing.id },
            data: { status: ev.status as RunStatus },
          });
        } else {
          await prisma.runStep.create({
            data: {
              runId,
              order: order++,
              name: ev.name,
              status: ev.status as RunStatus,
            },
          });
        }
      } else if (ev.type === 'message') {
        lastAssistant = ev.content;
        await prisma.chatMessage.create({
          data: { runId, role: ev.role, content: ev.content },
        });
      } else if (ev.type === 'diff' && mode === 'build') {
        await ensureFiles(run.projectId);
        const file = await prisma.projectFile.findUnique({
          where: { projectId_path: { projectId: run.projectId, path: ev.path } },
        });
        const newContent = (file?.content ?? '') + '\n' + ev.patch + '\n';
        const hash = simpleHash(newContent);
        if (file) {
          await prisma.projectFile.update({
            where: { id: file.id },
            data: { content: newContent, hash, size: Buffer.byteLength(newContent, 'utf8') },
          });
        } else {
          await prisma.projectFile.create({
            data: {
              projectId: run.projectId,
              path: ev.path,
              content: newContent,
              hash,
              size: Buffer.byteLength(newContent, 'utf8'),
            },
          });
        }
        const step = await prisma.runStep.findFirst({
          where: { runId, name: 'Generando cambios' },
        });
        if (step) {
          await prisma.runStep.update({
            where: { id: step.id },
            data: { diff: ev.patch },
          });
        }
      } else if (ev.type === 'file' && mode === 'build') {
        await ensureFiles(run.projectId);
        const hash = simpleHash(ev.content);
        await prisma.projectFile.upsert({
          where: { projectId_path: { projectId: run.projectId, path: ev.path } },
          create: {
            projectId: run.projectId,
            path: ev.path,
            content: ev.content,
            hash,
            size: Buffer.byteLength(ev.content, 'utf8'),
          },
          update: {
            content: ev.content,
            hash,
            size: Buffer.byteLength(ev.content, 'utf8'),
          },
        });
      } else if (ev.type === 'done') {
        creditsUsed = ev.creditsUsed;
      } else if (ev.type === 'error') {
        throw new Error(ev.message);
      }
    }

    if (mode === 'plan') {
      const parsed = parsePlanMessageForSpec(lastAssistant);
      const planBody =
        parsed.success
          ? JSON.stringify({ assistantMessage: parsed.data.assistantMessage, spec: parsed.data.spec })
          : lastAssistant || `Plan generado para: ${run.prompt.slice(0, 200)}`;

      if (parsed.success) {
        await prisma.projectProductSpec.upsert({
          where: { projectId: run.projectId },
          create: { projectId: run.projectId, specJson: parsed.data.spec as object },
          update: { specJson: parsed.data.spec as object },
        });
        await syncIntegrationsFromSpec(run.projectId, parsed.data.spec.integrations ?? []);
        await seedGeneratedRows(run.projectId, parsed.data.spec.entities ?? []);
      }

      const doc = await prisma.planDocument.create({
        data: { content: planBody },
      });
      await prisma.run.update({
        where: { id: runId },
        data: {
          planDocumentId: doc.id,
          status: RunStatus.done,
          finishedAt: new Date(),
          creditsUsed: creditsUsed || 0,
        },
      });
      const planAmount = Math.max(1, Math.ceil(Number(creditsUsed) || 1));
      await consumeCredits({
        workspaceId: run.project.workspaceId,
        amount: planAmount,
        reason: `run:${runId}`,
        runId,
      });
    } else {
      await prisma.run.update({
        where: { id: runId },
        data: { status: RunStatus.done, finishedAt: new Date(), creditsUsed },
      });
      const amount = Math.max(1, Math.ceil(creditsUsed || 1));
      const res = await consumeCredits({
        workspaceId: run.project.workspaceId,
        amount,
        reason: `run:${runId}`,
        runId,
      });
      if (!res.ok) {
        await prisma.run.update({
          where: { id: runId },
          data: {
            status: RunStatus.failed,
            errorMessage: 'Créditos insuficientes',
            finishedAt: new Date(),
          },
        });
      }
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error desconocido';
    await prisma.run.update({
      where: { id: runId },
      data: { status: RunStatus.failed, finishedAt: new Date(), errorMessage: message },
    });
  }
}
