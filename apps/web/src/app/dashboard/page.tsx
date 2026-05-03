'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Card, CardContent, Dialog, DialogContent, DialogHeader, DialogTitle } from '@amable/ui';
import { motion } from 'framer-motion';

type Workspace = { id: string; name: string; plan: string; _count: { projects: number } };
type Project = { id: string; name: string; slug: string; updatedAt: string };

export default function DashboardPage() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWs, setActiveWs] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [q, setQ] = useState('');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');

  useEffect(() => {
    void (async () => {
      const res = await fetch('/api/v1/workspaces');
      if (res.status === 401) {
        router.push('/iniciar-sesion');
        return;
      }
      const data = await res.json();
      setWorkspaces(data.workspaces);
      setActiveWs(data.workspaces[0]?.id ?? null);
    })();
  }, [router]);

  useEffect(() => {
    if (!activeWs) return;
    void (async () => {
      const res = await fetch(`/api/v1/projects?workspaceId=${activeWs}`);
      const data = await res.json();
      setProjects(data.projects ?? []);
    })();
  }, [activeWs]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return projects;
    return projects.filter((p) => p.name.toLowerCase().includes(qq) || p.slug.includes(qq));
  }, [projects, q]);

  async function createProject() {
    if (!activeWs || !newName || !newSlug) return;
    const res = await fetch('/api/v1/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId: activeWs, name: newName, slug: newSlug }),
    });
    if (!res.ok) return;
    const data = await res.json();
    router.push(`/proyecto/${data.project.id}`);
  }

  async function logout() {
    await fetch('/api/auth/cerrar-sesion', { method: 'POST' });
    router.push('/');
  }

  const nav = [
    'Inicio',
    'Buscar',
    'Recursos',
    'Conectores',
    'Todos los proyectos',
    'Destacados',
    'Creados por mí',
    'Compartidos conmigo',
    'Recientes',
  ];

  return (
    <div className="flex min-h-dvh">
      <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-panel lg:block">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="text-sm font-semibold">Amable Studio</div>
        </div>
        <div className="px-3 pb-4">
          <label className="sr-only" htmlFor="ws">
            Espacio de trabajo
          </label>
          <select
            id="ws"
            className="w-full rounded-[var(--radius)] border border-white/10 bg-panel-2 px-2 py-2 text-sm"
            value={activeWs ?? ''}
            onChange={(e) => setActiveWs(e.target.value)}
          >
            {workspaces.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
        <nav className="space-y-1 px-2">
          {nav.map((item) => (
            <button
              key={item}
              type="button"
              className="flex w-full items-center rounded-md px-3 py-2 text-left text-sm text-muted hover:bg-white/5 hover:text-fg"
            >
              {item}
            </button>
          ))}
        </nav>
        <p className="mt-6 px-3 text-xs text-muted">
          Cada proyecto es una plataforma web que publicas e iteras con créditos: primera versión sólida, luego refinamiento visual y
          funcional en cada run.
        </p>
      </aside>
      <main className="flex-1">
        <header className="flex items-center justify-between border-b border-white/10 px-4 py-3 lg:px-8">
          <div className="text-sm text-muted">Inicio</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" type="button" onClick={() => setPaletteOpen(true)}>
              Buscar
            </Button>
            <Button variant="ghost" type="button" onClick={() => void logout()}>
              Salir
            </Button>
          </div>
        </header>
        <div className="mx-auto max-w-5xl px-4 py-10 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <h1 className="text-2xl font-semibold tracking-tight">Nueva plataforma web</h1>
            <p className="mt-2 text-sm text-muted">
              Abre el compositor: plan, build, preview y publicación comparten el mismo motor. Los créditos miden cada mejora hasta el
              resultado que quieres vender.
            </p>
            <Card className="mt-8">
              <CardContent className="space-y-3 p-5">
                <Input placeholder="Nombre del proyecto" value={newName} onChange={(e) => setNewName(e.target.value)} />
                <Input
                  placeholder="slug-url (solo minúsculas y guiones)"
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value.toLowerCase())}
                />
                <div className="flex flex-wrap gap-2">
                  <Button type="button" onClick={() => void createProject()} disabled={!activeWs}>
                    Crear y abrir
                  </Button>
                  <Button variant="secondary" type="button" asChild>
                    <Link href="/construir-desde-url">Construir desde URL</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
            <div className="mt-10">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-semibold">Todos los proyectos</h2>
                <Input className="sm:max-w-xs" placeholder="Filtrar…" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((p) => (
                  <Link key={p.id} href={`/proyecto/${p.id}`} className="block">
                    <Card className="transition hover:border-white/20">
                      <CardContent className="p-4">
                        <div className="font-medium">{p.name}</div>
                        <div className="mt-1 text-xs text-muted">{p.slug}</div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </main>
      <Dialog open={paletteOpen} onOpenChange={setPaletteOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Buscar</DialogTitle>
          </DialogHeader>
          <Input autoFocus placeholder="Buscar proyectos…" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="max-h-60 overflow-auto text-sm text-muted">
            {filtered.slice(0, 8).map((p) => (
              <Link
                key={p.id}
                href={`/proyecto/${p.id}`}
                className="block rounded-md px-2 py-2 hover:bg-white/5"
                onClick={() => setPaletteOpen(false)}
              >
                {p.name}
              </Link>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
