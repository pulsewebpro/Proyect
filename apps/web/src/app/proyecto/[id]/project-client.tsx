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
    { id: string; title: string | null; comments: { body: string; user: { email: string } }[] }[]
  >([]);
  const [commentBody, setCommentBody] = useState('');
  const [analytics, setAnalytics] = useState<Record<string, unknown> | null>(null);
  const [security, setSecurity] = useState<{ title: string; severity: string }[]>([]);
  const [pubOpen, setPubOpen] = useState(false);
  const [pubSlug, setPubSlug] = useState('');
  const [pubAudience, setPubAudience] = useState<'workspace' | 'anyone'>('anyone');
  const esRef = useRef<EventSource | null>(null);

  const activeFile = useMemo(
    () => files.find((f) => f.path === activePath) ?? { path: activePath, content: '' },
    [files, activePath]
  );

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

  const loadSecurity = useCallback(async () => {
    const res = await fetch(`/api/v1/projects/${projectId}/security`);
    const data = await res.json();
    setSecurity((data.findings ?? []).map((f: { title: string; severity: string }) => ({ title: f.title, severity: f.severity })));
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
    void loadSecurity();
    void loadAnalytics();
  }, [loadProject, loadFiles, loadComments, loadSecurity, loadAnalytics]);

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
      }
    };
    return () => es.close();
  }, [runId, projectId, loadFiles, loadProject]);

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
      body: JSON.stringify({ audience: pubAudience, slug: pubSlug, runSecurityCheck: true }),
    });
    if (!res.ok) {
      alert('Error al publicar');
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
              <TooltipContent>Dictar prompt</TooltipContent>
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
                <TabsTrigger value="security">Seguridad</TabsTrigger>
                <TabsTrigger value="analytics">Analítica</TabsTrigger>
                <TabsTrigger value="comments">Comentarios</TabsTrigger>
                <TabsTrigger value="share">Compartir</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="preview" className="m-0 flex-1 p-0">
              <iframe
                title="preview"
                className="h-[60vh] w-full bg-white"
                src={`/api/v1/projects/${projectId}/preview-html`}
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
            <TabsContent value="security" className="m-0 flex-1 p-4 text-sm">
              <ul className="space-y-2">
                {security.map((f, i) => (
                  <li key={i} className="rounded-md border border-white/10 bg-panel p-3">
                    <div className="font-medium">{f.title}</div>
                    <div className="text-xs text-muted">{f.severity}</div>
                  </li>
                ))}
              </ul>
            </TabsContent>
            <TabsContent value="analytics" className="m-0 flex-1 p-4 text-sm">
              {analytics ? (
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
                    <div className="font-medium">{t.title}</div>
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
                      <Button size="sm" variant="ghost" type="button" disabled>
                        Resolver
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="share" className="m-0 flex-1 p-4 text-sm text-muted">
              Compartir con miembros (stub): invitación por correo en próxima iteración.
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
              <input type="checkbox" defaultChecked /> Ejecutar revisión de seguridad
            </label>
            <Button type="button" onClick={() => void publish()}>
              Publicar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
