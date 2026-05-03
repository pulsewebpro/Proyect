'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Button,
  Card,
  CardContent,
  Input,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@amable/ui';
import { GithubImportForm } from './github-import-form';
import { GithubExportForm } from './github-export-form';
import { IntegrationsPanel } from './integrations-panel';

const Editor = dynamic(() => import('./monaco-editor'), { ssr: false });

type Project = { id: string; name: string; slug: string; workspaceId: string };

export default function ProyectoPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const projectId = params.id;
  const [project, setProject] = useState<Project | null>(null);
  const [tab, setTab] = useState('preview');
  const [mode, setMode] = useState<'plan' | 'build'>('build');
  const [prompt, setPrompt] = useState('');
  const [runId, setRunId] = useState<string | null>(null);
  const [runStatus, setRunStatus] = useState<string>('');
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [steps, setSteps] = useState<{ name: string; status: string }[]>([]);
  const [credits, setCredits] = useState<number | null>(null);
  const [files, setFiles] = useState<{ path: string; content: string }[]>([]);
  const [activePath, setActivePath] = useState('src/App.tsx');
  const [bg, setBg] = useState('#0f0f0f');
  const [threads, setThreads] = useState<
    {
      id: string;
      title: string | null;
      resolved: boolean;
      comments: { body: string; user: { email: string } }[];
    }[]
  >([]);
  const [commentBody, setCommentBody] = useState('');
  const [analytics, setAnalytics] = useState<Record<string, unknown> | null>(null);
  const [specJson, setSpecJson] = useState<unknown>(null);
  const [pubOpen, setPubOpen] = useState(false);
  const [pubSlug, setPubSlug] = useState('');
  const [pubAudience, setPubAudience] = useState<'workspace' | 'anyone'>('anyone');
  const [runSecurityCheck, setRunSecurityCheck] = useState(true);
  const esRef = useRef<EventSource | null>(null);

  const activeFile = useMemo(
    () => files.find((f) => f.path === activePath) ?? { path: activePath, content: '' },
    [files, activePath]
  );

  const previewKey = useMemo(() => files.map((f) => `${f.path}:${f.content.length}`).join('|'), [files]);

  const loadProject = useCallback(async () => {
    const res = await fetch(`/api/v1/projects/${projectId}`);
    if (res.status === 401) {
      router.push('/iniciar-sesion');
      return;
    }
    const data = await res.json();
    setProject(data.project);
    setPubSlug(data.project.slug);
    const c = await fetch(`/api/v1/workspaces/${data.project.workspaceId}/credits`);
    const cj = await c.json();
    setCredits(cj.balance ?? null);
  }, [projectId, router]);

  const loadFiles = useCallback(async () => {
    const res = await fetch(`/api/v1/projects/${projectId}/files`);
    const data = await res.json();
    setFiles(data.files ?? []);
  }, [projectId]);

  const loadComments = useCallback(async () => {
    const res = await fetch(`/api/v1/projects/${projectId}/comments`);
    const data = await res.json();
    setThreads(data.threads ?? []);
  }, [projectId]);

  const loadSpec = useCallback(async () => {
    const res = await fetch(`/api/v1/projects/${projectId}/product-spec`);
    const data = await res.json();
    setSpecJson(data.spec ?? null);
  }, [projectId]);

  const loadAnalytics = useCallback(async () => {
    const res = await fetch(`/api/v1/projects/${projectId}/analytics?range=7d`);
    const data = await res.json();
    setAnalytics(data);
  }, [projectId]);

  useEffect(() => {
    void loadProject();
    void loadFiles();
    void loadComments();
    void loadAnalytics();
    void loadSpec();
  }, [loadProject, loadFiles, loadComments, loadAnalytics, loadSpec]);

  useEffect(() => {
    if (tab === 'analytics') void loadAnalytics();
  }, [tab, loadAnalytics]);

  useEffect(() => {
    if (!runId) return;
    esRef.current?.close();
    const es = new EventSource(`/api/v1/projects/${projectId}/runs/${runId}/stream`);
    esRef.current = es;
    es.onmessage = (ev) => {
      const payload = JSON.parse(ev.data);
      if (payload.run) {
        setRunStatus(payload.run.status);
        setMessages(payload.run.messages ?? []);
        setSteps((payload.run.steps ?? []).map((s: { name: string; status: string }) => ({ name: s.name, status: s.status })));
      }
      if (payload.done) {
        es.close();
        void loadFiles();
        void loadProject();
        void loadSpec();
      }
    };
    return () => es.close();
  }, [runId, projectId, loadFiles, loadProject, loadSpec]);

  async function startRun() {
    const res = await fetch(`/api/v1/projects/${projectId}/runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, prompt }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j.error ?? 'Error');
      return;
    }
    const data = await res.json();
    setRunId(data.runId);
  }

  async function approvePlan() {
    if (!runId) return;
    const res = await fetch(`/api/v1/projects/${projectId}/runs/${runId}/approve-plan`, { method: 'POST' });
    const data = await res.json();
    setRunId(data.runId);
  }

  async function saveFile(content: string) {
    await fetch(`/api/v1/projects/${projectId}/files`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: activePath, content }),
    });
    void loadFiles();
  }

  async function applyVisual() {
    const file = files.find((f) => f.path === 'src/App.tsx');
    const base = file?.content ?? '';
    const needle = '<main';
    const idx = base.indexOf(needle);
    let next = base;
    if (idx >= 0) {
      next =
        base.slice(0, idx + needle.length) +
        ` style={{ background: '${bg}' }}` +
        base.slice(idx + needle.length);
    } else {
      next = base + `\n/* visual: bg ${bg} */\n`;
    }
    await saveFile(next);
    setTab('preview');
  }

  async function publish() {
    const res = await fetch(`/api/v1/projects/${projectId}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audience: pubAudience, slug: pubSlug, runSecurityCheck }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      const msg =
        j.error === 'revisión_paquete_fallida' && Array.isArray(j.details)
          ? `Revisión de package.json: ${j.details.map((d: { title?: string }) => d.title ?? JSON.stringify(d)).join('; ')}`
          : j.details && Array.isArray(j.details)
            ? `Compilación: ${j.details.join('\n')}`
            : (j.error as string) ?? 'Error al publicar';
      alert(msg);
      return;
    }
    const data = await res.json();
    alert(`Publicado: ${data.targetUrl}`);
    setPubOpen(false);
  }

  async function addComment() {
    if (!commentBody.trim()) return;
    await fetch(`/api/v1/projects/${projectId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: commentBody }),
    });
    setCommentBody('');
    void loadComments();
  }

  async function unpublish() {
    if (!confirm('¿Despublicar el proyecto?')) return;
    const res = await fetch(`/api/v1/projects/${projectId}/publish`, { method: 'DELETE' });
    if (!res.ok) {
      alert('Error al despublicar');
      return;
    }
    alert('Despublicado');
  }

  async function setThreadResolved(threadId: string, resolved: boolean) {
    const res = await fetch(`/api/v1/projects/${projectId}/comments/${threadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resolved }),
    });
    if (!res.ok) return;
    void loadComments();
  }

  async function sendThread(threadId: string) {
    await fetch(`/api/v1/projects/${projectId}/comments/${threadId}/send-to-agent`, { method: 'POST' });
    void loadComments();
  }

  if (!project) {
    return <div className="p-10 text-muted">Cargando…</div>;
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-sm text-muted hover:text-fg">
            ← Inicio
          </Link>
          <div className="text-sm font-semibold">{project.name}</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted">Créditos: {credits ?? '—'}</span>
          <Button variant="secondary" type="button" asChild>
            <a href={`/api/v1/projects/${projectId}/zip`}>ZIP</a>
          </Button>
          <Button variant="secondary" type="button" onClick={() => setPubOpen(true)}>
            Publicar
          </Button>
          <Button variant="ghost" type="button" onClick={() => void unpublish()}>
            Despublicar
          </Button>
        </div>
      </header>
      <div className="grid flex-1 gap-0 lg:grid-cols-2">
        <div className="border-b border-white/10 p-4 lg:border-b-0 lg:border-r">
          <div className="mb-3 flex flex-wrap gap-2">
            <div className="inline-flex rounded-[var(--radius)] bg-panel-2 p-1">
              <button
                type="button"
                className={`rounded-md px-3 py-1.5 text-sm ${mode === 'plan' ? 'bg-panel text-fg' : 'text-muted'}`}
                onClick={() => setMode('plan')}
              >
                Plan
              </button>
              <button
                type="button"
                className={`rounded-md px-3 py-1.5 text-sm ${mode === 'build' ? 'bg-panel text-fg' : 'text-muted'}`}
                onClick={() => setMode('build')}
              >
                Construir
              </button>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" type="button" disabled>
                  Adjuntar
                </Button>
              </TooltipTrigger>
              <TooltipContent>Próximamente</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" type="button" disabled>
                  Dictar prompt
                </Button>
              </TooltipTrigger>
              <TooltipContent>No disponible</TooltipContent>
            </Tooltip>
          </div>
          <textarea
            className="min-h-32 w-full rounded-[var(--radius)] border border-white/10 bg-panel px-3 py-2 text-sm text-fg placeholder:text-muted"
            placeholder="Describe lo que quieres crear…"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" onClick={() => void startRun()}>
              Enviar
            </Button>
            <Button variant="secondary" type="button" onClick={() => void approvePlan()} disabled={mode !== 'plan'}>
              Aprobar plan y ejecutar
            </Button>
          </div>
          <div className="mt-6 space-y-2 text-sm">
            <div className="text-muted">Estado: {runStatus || '—'}</div>
            <div>
              {steps.map((s) => (
                <div key={s.name} className="text-xs text-muted">
                  {s.name}: {s.status}
                </div>
              ))}
            </div>
            <div className="max-h-48 overflow-auto rounded-md border border-white/10 bg-panel-2 p-2">
              {messages.map((m, i) => (
                <div key={i} className="mb-2 whitespace-pre-wrap text-xs">
                  <span className="text-muted">{m.role}:</span> {m.content}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex min-h-[50vh] flex-col">
          <Tabs value={tab} onValueChange={setTab} className="flex flex-1 flex-col">
            <div className="border-b border-white/10 px-2">
              <TabsList className="h-auto flex-wrap gap-1 bg-transparent p-2">
                <TabsTrigger value="preview">Vista previa</TabsTrigger>
                <TabsTrigger value="code">Código</TabsTrigger>
                <TabsTrigger value="visual">Edición visual</TabsTrigger>
                <TabsTrigger value="prepublish">Antes de publicar</TabsTrigger>
                <TabsTrigger value="analytics">Analítica</TabsTrigger>
                <TabsTrigger value="comments">Comentarios</TabsTrigger>
                <TabsTrigger value="spec">Product spec</TabsTrigger>
                <TabsTrigger value="share">GitHub e integraciones</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="preview" className="m-0 flex-1 p-0">
              <iframe
                key={previewKey}
                title="Vista previa"
                className="h-[60vh] w-full bg-[#0f0f0f]"
                src={`/api/v1/projects/${projectId}/preview-frame`}
                sandbox="allow-scripts allow-same-origin"
              />
            </TabsContent>
            <TabsContent value="code" className="m-0 flex-1 p-3">
              <div className="flex h-[60vh] gap-3">
                <div className="w-48 shrink-0 overflow-auto rounded-md border border-white/10 bg-panel p-2 text-xs">
                  {files.map((f) => (
                    <button
                      key={f.path}
                      type="button"
                      className={`mb-1 block w-full rounded px-2 py-1 text-left hover:bg-white/5 ${
                        f.path === activePath ? 'bg-white/10' : ''
                      }`}
                      onClick={() => setActivePath(f.path)}
                    >
                      {f.path}
                    </button>
                  ))}
                </div>
                <div className="min-w-0 flex-1 rounded-md border border-white/10">
                  <Editor path={activePath} value={activeFile.content} onSave={(v) => void saveFile(v)} />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="visual" className="m-0 flex-1 p-4">
              <Card>
                <CardContent className="space-y-3 p-4">
                  <p className="text-sm text-muted">Ajuste rápido del fondo del elemento raíz en `src/App.tsx`.</p>
                  <label className="text-sm text-muted" htmlFor="bg">
                    Color de fondo
                  </label>
                  <Input id="bg" value={bg} onChange={(e) => setBg(e.target.value)} />
                  <Button type="button" onClick={() => void applyVisual()}>
                    Aplicar
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="prepublish" className="m-0 flex-1 space-y-3 p-4 text-sm text-muted">
              <p>
                Al publicar con la casilla activada, el servidor ejecuta una{' '}
                <strong className="text-fg">comprobación heurística de package.json</strong> (protocolos{' '}
                <code className="text-fg">file:</code>, <code className="text-fg">link:</code>, etc.) que el runtime
                de preview no puede satisfacer. No es un escáner CVE ni SAST.
              </p>
              <p>
                Si el proyecto usa <strong className="text-fg">Vite</strong>, la publicación valida el build de Vite;
                si no, se valida el bundle con <strong className="text-fg">esbuild</strong>. Si falla, verás el error en
                el diálogo de publicar.
              </p>
            </TabsContent>
            <TabsContent value="analytics" className="m-0 flex-1 p-4 text-sm">
              {analytics ? (
                <div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-muted">Visitantes</div>
                        <div className="text-2xl font-semibold">
                          {(analytics.metrics as { visitors?: number })?.visitors ?? 0}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-muted">Páginas vistas</div>
                        <div className="text-2xl font-semibold">
                          {(analytics.metrics as { pageviews?: number })?.pageviews ?? 0}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  <p className="mt-3 text-xs text-muted">
                    País no se infiere (valor almacenado nulo). Dispositivo se deduce del user-agent del visitante.
                  </p>
                </div>
              ) : (
                <div className="text-muted">Sin datos</div>
              )}
            </TabsContent>
            <TabsContent value="comments" className="m-0 flex-1 space-y-3 p-4">
              <div className="flex gap-2">
                <Input value={commentBody} onChange={(e) => setCommentBody(e.target.value)} placeholder="Comentar" />
                <Button type="button" onClick={() => void addComment()}>
                  Publicar
                </Button>
              </div>
              <div className="space-y-3">
                {threads.map((t) => (
                  <div key={t.id} className="rounded-md border border-white/10 bg-panel p-3 text-sm">
                    <div className="font-medium">
                      {t.title}
                      {t.resolved ? (
                        <span className="ml-2 text-xs text-muted">(resuelto)</span>
                      ) : null}
                    </div>
                    <div className="mt-2 space-y-1 text-xs text-muted">
                      {t.comments.map((c, i) => (
                        <div key={i}>
                          {c.user.email}: {c.body}
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" variant="secondary" type="button" onClick={() => void sendThread(t.id)}>
                        Enviar al agente
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        type="button"
                        onClick={() => void setThreadResolved(t.id, !t.resolved)}
                      >
                        {t.resolved ? 'Reabrir' : 'Resolver'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="spec" className="m-0 flex-1 p-4 text-xs">
              <pre className="max-h-[60vh] overflow-auto rounded-md border border-white/10 bg-panel p-3 text-muted">
                {specJson ? JSON.stringify(specJson, null, 2) : 'Sin spec aún. Ejecuta un run en modo Plan.'}
              </pre>
            </TabsContent>
            <TabsContent value="share" className="m-0 flex-1 space-y-4 p-4 text-sm">
              <Card>
                <CardContent className="space-y-3 p-4">
                  <div className="font-medium">Importar desde GitHub</div>
                  <p className="text-xs text-muted">
                    Repos públicos: sin token hasta que GitHub exija autenticación o límite de peticiones; entonces usa
                    token en el formulario o <code className="text-fg">GITHUB_IMPORT_TOKEN</code>. Para subir cambios
                    al remoto también puedes usar <strong className="text-fg">export commit</strong> abajo o un{' '}
                    <strong className="text-fg">ZIP</strong> manual.
                  </p>
                  <GithubImportForm projectId={projectId} onDone={() => void loadFiles()} />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="space-y-3 p-4">
                  <GithubExportForm projectId={projectId} />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="space-y-3 p-4">
                  <div className="font-medium">Integraciones</div>
                  <IntegrationsPanel projectId={projectId} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Dialog open={pubOpen} onOpenChange={setPubOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Publicar</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-muted" htmlFor="slug">
                URL publicada (slug)
              </label>
              <Input id="slug" value={pubSlug} onChange={(e) => setPubSlug(e.target.value)} />
            </div>
            <div>
              <div className="text-sm text-muted">Quién puede acceder</div>
              <select
                className="mt-1 w-full rounded-[var(--radius)] border border-white/10 bg-panel px-2 py-2 text-sm"
                value={pubAudience}
                onChange={(e) => setPubAudience(e.target.value as 'workspace' | 'anyone')}
              >
                <option value="workspace">Solo espacio de trabajo</option>
                <option value="anyone">Cualquiera con el enlace</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={runSecurityCheck}
                onChange={(e) => setRunSecurityCheck(e.target.checked)}
              />
              Revisar package.json antes de publicar (heurística, no CVE)
            </label>
            <Button type="button" onClick={() => void publish()}>
              Publicar
            </Button>
            <Button variant="secondary" type="button" onClick={() => void unpublish()}>
              Despublicar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
