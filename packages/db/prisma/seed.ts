import 'dotenv/config';
import {
  PrismaClient,
  IdentityProvider,
  WorkspacePlan,
  WorkspaceRole,
  CreditEntryType,
  PublicationAudience,
  PublicationStatus,
  SecurityFindingSeverity,
  SecurityFindingStatus,
} from '@prisma/client';
import { hashPassword } from '@amable/auth';

const prisma = new PrismaClient();

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.analyticsEvent.deleteMany();
  await prisma.analyticsAggregate.deleteMany();
  await prisma.domainBinding.deleteMany();
  await prisma.publication.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.commentThread.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.runStep.deleteMany();
  await prisma.run.deleteMany();
  await prisma.planDocument.deleteMany();
  await prisma.projectFile.deleteMany();
  await prisma.projectConnector.deleteMany();
  await prisma.connectorAccount.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.folder.deleteMany();
  await prisma.creditLedger.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.workspaceMember.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.identity.deleteMany();
  await prisma.userPreference.deleteMany();
  await prisma.securityFinding.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.user.deleteMany();

  const pass = await hashPassword('Demo12345!');
  const mkUser = async (email: string, name: string, roleHint: string) => {
    return prisma.user.create({
      data: {
        email,
        name,
        passwordHash: pass,
        username: email.split('@')[0],
        bio: `Usuario demo (${roleHint})`,
        location: 'Madrid',
        website: 'https://ejemplo.es',
        profilePublic: true,
        identities: { create: { provider: IdentityProvider.password, providerUserId: email } },
        preferences: { create: {} },
      },
    });
  };

  const owner = await mkUser('owner@demo.amable', 'Propietario', 'owner');
  const admin = await mkUser('admin@demo.amable', 'Admin', 'admin');
  const editor = await mkUser('editor@demo.amable', 'Editor', 'editor');
  const viewer = await mkUser('viewer@demo.amable', 'Visor', 'viewer');

  const wsA = await prisma.workspace.create({
    data: {
      name: 'Equipo Growth',
      plan: WorkspacePlan.business,
      monthlyCredits: 400,
      dailyBonusCredits: 5,
    },
  });
  const wsB = await prisma.workspace.create({
    data: { name: 'Laboratorio', plan: WorkspacePlan.free, monthlyCredits: 30, dailyBonusCredits: 5 },
  });

  for (const [userId, role] of [
    [owner.id, WorkspaceRole.owner],
    [admin.id, WorkspaceRole.admin],
    [editor.id, WorkspaceRole.editor],
    [viewer.id, WorkspaceRole.viewer],
  ] as const) {
    await prisma.workspaceMember.create({ data: { workspaceId: wsA.id, userId, role } });
  }
  await prisma.workspaceMember.create({
    data: { workspaceId: wsB.id, userId: owner.id, role: WorkspaceRole.owner },
  });

  await prisma.creditLedger.createMany({
    data: [
      { workspaceId: wsA.id, type: CreditEntryType.grant_monthly, amount: 400, balanceAfter: 400, reason: 'seed' },
      { workspaceId: wsB.id, type: CreditEntryType.grant_monthly, amount: 30, balanceAfter: 30, reason: 'seed' },
    ],
  });

  const projectsData = [
    ['CRM Ventas', 'crm-ventas'],
    ['Landing SaaS', 'landing-saas'],
    ['Dashboard Analytics', 'dashboard-analytics'],
    ['Portal RRHH', 'portal-rrhh'],
    ['Tienda Digital', 'tienda-digital'],
    ['Diario IA', 'diario-ia'],
  ] as const;

  const projects = [];
  for (const [name, slug] of projectsData) {
    const p = await prisma.project.create({
      data: {
        workspaceId: wsA.id,
        name,
        slug,
        members: { create: [{ userId: owner.id, role: 'admin' }] },
      },
    });
    projects.push(p);
    const appTsx = `export default function App() {\n  return (\n    <main style={{ padding: 24, fontFamily: 'system-ui' }}>\n      <h1>${name}</h1>\n      <p>Proyecto demo Amable Studio.</p>\n    </main>\n  );\n}\n`;
    const pkgJson = JSON.stringify({ name: slug, private: true }, null, 2);
    await prisma.projectFile.createMany({
      data: [
        {
          projectId: p.id,
          path: 'src/App.tsx',
          content: appTsx,
          hash: simpleHash(appTsx),
          size: Buffer.byteLength(appTsx, 'utf8'),
        },
        {
          projectId: p.id,
          path: 'package.json',
          content: pkgJson,
          hash: simpleHash(pkgJson),
          size: Buffer.byteLength(pkgJson, 'utf8'),
        },
      ],
    });
  }

  const p0 = projects[0]!;
  const thread = await prisma.commentThread.create({
    data: { projectId: p0.id, title: 'Revisión cabecera', anchorSelector: 'main h1' },
  });
  await prisma.comment.create({
    data: { threadId: thread.id, userId: editor.id, body: '¿Podemos subir el contraste del título?' },
  });

  await prisma.notification.createMany({
    data: [
      { userId: owner.id, type: 'invite', title: 'Invitación a espacio de trabajo', body: wsB.name },
      { userId: owner.id, type: 'comment', title: 'Nuevo comentario', body: thread.title ?? '' },
    ],
  });

  await prisma.analyticsEvent.createMany({
    data: [
      {
        projectId: p0.id,
        path: '/',
        referrer: 'https://google.com',
        userAgent: 'Mozilla/5.0',
        device: 'desktop',
        country: 'ES',
        sessionId: 'sess_demo_1',
        durationMs: 12000,
      },
      {
        projectId: p0.id,
        path: '/',
        sessionId: 'sess_demo_2',
        device: 'mobile',
        country: 'ES',
        durationMs: 4000,
      },
    ],
  });

  await prisma.securityFinding.createMany({
    data: [
      {
        projectId: p0.id,
        workspaceId: wsA.id,
        scanner: 'dependencies',
        severity: SecurityFindingSeverity.medium,
        status: SecurityFindingStatus.open,
        title: 'Dependencia con versión antigua',
        description: 'Actualizar paquete de ejemplo',
      },
    ],
  });

  const pub = await prisma.publication.create({
    data: {
      projectId: p0.id,
      audience: PublicationAudience.anyone,
      slug: p0.slug,
      status: PublicationStatus.live,
      liveUrl: `http://localhost:3000/sitio/${p0.slug}`,
      publishedAt: new Date(),
      seoTitle: p0.name,
    },
  });
  await prisma.domainBinding.create({
    data: {
      publicationId: pub.id,
      hostname: `${p0.slug}.demo.amable`,
      verified: false,
      sslStatus: 'pending',
      isPrimary: true,
    },
  });

  // eslint-disable-next-line no-console
  console.log('Seed OK. Usuarios: owner@demo.amable / Demo12345! (y admin/editor/viewer mismo password)');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

function simpleHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return `h${(h >>> 0).toString(16)}`;
}
