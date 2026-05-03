import type { OutputTemplateId } from './output-templates';

function basePackageJson(): string {
  return JSON.stringify(
    {
      name: 'amable-generated-premium',
      private: true,
      type: 'module',
      scripts: { build: 'vite build', dev: 'vite' },
      dependencies: {
        react: '^19.0.0',
        'react-dom': '^19.0.0',
        'react-router-dom': '^6.28.0',
      },
      devDependencies: {
        vite: '^6.0.11',
        '@vitejs/plugin-react': '^4.3.4',
        typescript: '^5.7.2',
      },
    },
    null,
    2
  );
}

function sharedViteConfig(): string {
  return `import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\n\nexport default defineConfig({ plugins: [react()] });\n`;
}

function sharedIndexHtml(title: string): string {
  return `<!DOCTYPE html>\n<html lang="es">\n  <head>\n    <meta charset="UTF-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <title>${title}</title>\n    <link rel="preconnect" href="https://fonts.googleapis.com" />\n    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />\n    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap" rel="stylesheet" />\n  </head>\n  <body>\n    <div id="root"></div>\n    <script type="module" src="/src/main.tsx"></script>\n  </body>\n</html>\n`;
}

function sharedIndexCss(): string {
  return `:root {\n  --bg: #0c0c10;\n  --panel: #14141c;\n  --panel2: #1a1a26;\n  --border: rgba(255,255,255,0.08);\n  --text: #f4f4f8;\n  --muted: #9b9bb0;\n  --accent: #6366f1;\n  --accent2: #22d3ee;\n  --danger: #f87171;\n  --radius: 14px;\n  --shadow: 0 24px 80px rgba(0,0,0,0.45);\n}\n* { box-sizing: border-box; }\nhtml, body, #root { height: 100%; margin: 0; }\nbody {\n  font-family: 'DM Sans', system-ui, sans-serif;\n  background: radial-gradient(1200px 600px at 10% -10%, rgba(99,102,241,0.18), transparent 55%),\n    radial-gradient(900px 500px at 100% 0%, rgba(34,211,238,0.12), transparent 50%),\n    var(--bg);\n  color: var(--text);\n  -webkit-font-smoothing: antialiased;\n}\na { color: inherit; text-decoration: none; }\nbutton {\n  font: inherit;\n  cursor: pointer;\n  border: none;\n  border-radius: 10px;\n  padding: 0.55rem 1rem;\n  transition: transform 0.12s ease, box-shadow 0.12s ease, background 0.15s;\n}\nbutton:active { transform: scale(0.98); }\n.btn-primary {\n  background: linear-gradient(135deg, var(--accent), #818cf8);\n  color: #fff;\n  font-weight: 600;\n  box-shadow: 0 10px 40px rgba(99,102,241,0.35);\n}\n.btn-primary:hover { filter: brightness(1.06); }\n.btn-ghost {\n  background: transparent;\n  color: var(--muted);\n  border: 1px solid var(--border);\n}\n.btn-ghost:hover { color: var(--text); border-color: rgba(255,255,255,0.18); }\n.card {\n  background: linear-gradient(180deg, rgba(255,255,255,0.04), transparent), var(--panel);\n  border: 1px solid var(--border);\n  border-radius: var(--radius);\n  box-shadow: var(--shadow);\n}\n.input {\n  width: 100%;\n  padding: 0.65rem 0.85rem;\n  border-radius: 10px;\n  border: 1px solid var(--border);\n  background: var(--panel2);\n  color: var(--text);\n  font: inherit;\n}\n.input:focus {\n  outline: 2px solid rgba(99,102,241,0.45);\n  outline-offset: 1px;\n}\n.table-wrap { overflow: auto; border-radius: 12px; border: 1px solid var(--border); }\ntable { width: 100%; border-collapse: collapse; font-size: 0.875rem; }\nth, td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid var(--border); }\nth { color: var(--muted); font-weight: 500; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em; }\ntr:last-child td { border-bottom: none; }\n.badge { display: inline-flex; align-items: center; padding: 0.2rem 0.55rem; border-radius: 999px; font-size: 0.7rem; font-weight: 600; }\n.badge-ok { background: rgba(34,197,94,0.15); color: #86efac; }\n.badge-warn { background: rgba(251,191,36,0.15); color: #fcd34d; }\n.hide-mobile { }\n.show-mobile { display: none; }\n@media (max-width: 768px) {\n  .hide-mobile { display: none !important; }\n  .show-mobile { display: block !important; }\n}\n`;
}

function sharedMain(): string {
  return `import { StrictMode } from 'react';\nimport { createRoot } from 'react-dom/client';\nimport { HashRouter } from 'react-router-dom';\nimport App from './App';\nimport './index.css';\n\ncreateRoot(document.getElementById('root')!).render(\n  <StrictMode>\n    <HashRouter>\n      <App />\n    </HashRouter>\n  </StrictMode>\n);\n`;
}

function bookingsAppSource(promptConst: string): string {
  return `import type { FormEvent, ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Route, Routes } from 'react-router-dom';

const USER_PROMPT = ${promptConst};

type Row = Record<string, unknown> & { id?: string };

async function api(path: string, init?: RequestInit) {
  const r = await fetch(path, { credentials: 'include', ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) } });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((j as { error?: string }).error || r.statusText);
  return j;
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          borderBottom: '1px solid var(--border)',
          backdropFilter: 'blur(12px)',
          background: 'rgba(12,12,16,0.72)',
          position: 'sticky',
          top: 0,
          zIndex: 20,
        }}
      >
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <Link to="/" style={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
            Reservas<span style={{ color: 'var(--accent2)' }}>.</span>
          </Link>
          <nav style={{ display: 'flex', gap: '0.35rem', flex: 1 }}>
            <NavLink
              to="/"
              style={({ isActive }) => ({
                padding: '0.45rem 0.75rem',
                borderRadius: 8,
                color: isActive ? 'var(--text)' : 'var(--muted)',
                background: isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
                fontSize: '0.9rem',
                fontWeight: 500,
              })}
            >
              Panel
            </NavLink>
            <NavLink
              to="/bookings"
              style={({ isActive }) => ({
                padding: '0.45rem 0.75rem',
                borderRadius: 8,
                color: isActive ? 'var(--text)' : 'var(--muted)',
                background: isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
                fontSize: '0.9rem',
                fontWeight: 500,
              })}
            >
              Reservas
            </NavLink>
            <NavLink
              to="/admin"
              className="hide-mobile"
              style={({ isActive }) => ({
                padding: '0.45rem 0.75rem',
                borderRadius: 8,
                color: isActive ? 'var(--text)' : 'var(--muted)',
                background: isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
                fontSize: '0.9rem',
                fontWeight: 500,
              })}
            >
              Admin
            </NavLink>
          </nav>
          <span style={{ fontSize: '0.75rem', color: 'var(--muted)', maxWidth: 220, textAlign: 'right' }} data-testid="e2e-prompt-snippet">
            {USER_PROMPT}
          </span>
        </div>
      </header>
      <main style={{ flex: 1, maxWidth: 1120, margin: '0 auto', width: '100%', padding: '1.5rem 1.25rem 2.5rem' }} data-testid="e2e-generated-root">
        {children}
      </main>
    </div>
  );
}

function Dashboard() {
  return (
    <div style={{ display: 'grid', gap: '1.25rem' }}>
      <div>
        <h1 style={{ margin: '0 0 0.35rem', fontSize: '1.75rem', letterSpacing: '-0.03em' }}>Buenos días</h1>
        <p style={{ margin: 0, color: 'var(--muted)', maxWidth: 560 }}>
          Vista previa premium: ocupación, próximas reservas y acciones rápidas. Misma build en publicación.
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {[
          { k: 'Ocupación', v: '78%', s: '+4% vs semana pasada' },
          { k: 'Reservas hoy', v: '12', s: '3 pendientes de confirmar' },
          { k: 'Ingresos simul.', v: '2.840 €', s: 'Pagos demo' },
        ].map((x) => (
          <div key={x.k} className="card" style={{ padding: '1.15rem 1.25rem' }}>
            <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{x.k}</div>
            <div style={{ fontSize: '1.65rem', fontWeight: 700, marginTop: 6 }}>{x.v}</div>
            <div style={{ color: 'var(--muted)', fontSize: '0.78rem', marginTop: 8 }}>{x.s}</div>
          </div>
        ))}
      </div>
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.05rem' }}>Actividad</h2>
          <span className="badge badge-ok">En vivo</span>
        </div>
        <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.55 }}>
          El gráfico es ilustrativo; los datos de tabla vienen de la API generada <code style={{ color: 'var(--accent2)' }}>/api/app/Booking</code>.
        </p>
        <div style={{ marginTop: 16, height: 120, borderRadius: 12, background: 'linear-gradient(90deg, rgba(99,102,241,0.35), rgba(34,211,238,0.2))', opacity: 0.9 }} />
      </div>
    </div>
  );
}

function BookingsView() {
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [title, setTitle] = useState('');
  const [guest, setGuest] = useState('');
  const [busy, setBusy] = useState(false);
  const [user, setUser] = useState<{ email: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const j = (await api('/api/app/Booking')) as { items?: Row[] };
      setRows(j.items ?? []);
      const me = (await fetch('/api/app/auth/me', { credentials: 'include' }).then((r) => r.json())) as { user?: { email: string } | null };
      setUser(me.user ?? null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => JSON.stringify(r).toLowerCase().includes(s));
  }, [rows, q]);

  async function demoLogin() {
    setBusy(true);
    setErr(null);
    try {
      const email = 'demo@reservas.local';
      const password = 'DemoReserva1!';
      await api('/api/app/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, role: 'user' }),
      }).catch(() => null);
      await api('/api/app/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function createBooking(e: FormEvent) {
    e.preventDefault();
    if (!user) {
      setErr('Entra con la cuenta demo para crear reservas.');
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await api('/api/app/Booking', {
        method: 'POST',
        body: JSON.stringify({
          title: title || 'Nueva reserva',
          guestName: guest || 'Invitado',
          startsAt: new Date().toISOString(),
          status: 'confirmada',
        }),
      });
      setTitle('');
      setGuest('');
      await load();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : String(e2));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: 'grid', gap: '1.25rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ margin: '0 0 0.35rem', fontSize: '1.65rem' }}>Reservas</h1>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.92rem' }}>Tabla, filtros y formulario con estados vacíos reales.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {!user ? (
            <button type="button" className="btn-primary" disabled={busy} onClick={() => void demoLogin()}>
              Entrar con cuenta demo
            </button>
          ) : (
            <span className="badge badge-ok" style={{ alignSelf: 'center' }}>
              {user.email}
            </span>
          )}
        </div>
      </div>
      <div className="card" style={{ padding: '1.25rem' }}>
        <h2 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>Nueva reserva</h2>
        <form onSubmit={createBooking} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 6 }}>Título</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Cena terraza — 4 pax" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 6 }}>Huésped</label>
            <input className="input" value={guest} onChange={(e) => setGuest(e.target.value)} placeholder="Nombre" />
          </div>
          <button type="submit" className="btn-primary" disabled={busy}>
            Añadir
          </button>
        </form>
      </div>
      <div className="card" style={{ padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem', alignItems: 'center' }}>
          <input className="input" style={{ maxWidth: 280 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrar…" />
          <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{filtered.length} filas</span>
        </div>
        {loading ? (
          <p style={{ color: 'var(--muted)' }}>Cargando…</p>
        ) : err ? (
          <p style={{ color: 'var(--danger)' }}>{err}</p>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--muted)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📅</div>
            <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Sin reservas todavía</div>
            <div style={{ fontSize: '0.9rem', maxWidth: 360, margin: '0 auto' }}>Usa la cuenta demo y crea la primera fila, o espera al seed del plan.</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Título / nota</th>
                  <th className="hide-mobile">Estado</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={String(r.id)}>
                    <td style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.78rem', color: 'var(--muted)' }}>{String(r.id).slice(0, 12)}…</td>
                    <td>{String(r.title ?? r.note ?? JSON.stringify(r)).slice(0, 80)}</td>
                    <td className="hide-mobile">
                      <span className="badge badge-ok">{String(r.status ?? '—')}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function AdminView() {
  return (
    <div className="card" style={{ padding: '1.5rem', maxWidth: 640 }}>
      <h1 style={{ marginTop: 0 }}>Admin simulado</h1>
      <p style={{ color: 'var(--muted)', lineHeight: 1.6 }}>Pagos y permisos avanzados son demo visual. La app ya separa roles en API (PATCH/DELETE admin).</p>
      <button type="button" className="btn-ghost" style={{ marginTop: '1rem' }}>
        Exportar informe (demo)
      </button>
    </div>
  );
}

export default function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/bookings" element={<BookingsView />} />
        <Route path="/admin" element={<AdminView />} />
      </Routes>
    </Shell>
  );
}
`;
}

function saasAppSource(promptConst: string): string {
  return `import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Route, Routes } from 'react-router-dom';

const USER_PROMPT = ${promptConst};

type Row = Record<string, unknown> & { id?: string };

async function api(path: string, init?: RequestInit) {
  const r = await fetch(path, { credentials: 'include', ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) } });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((j as { error?: string }).error || r.statusText);
  return j;
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: '100%', display: 'flex' }}>
      <aside
        className="hide-mobile"
        style={{
          width: 240,
          borderRight: '1px solid var(--border)',
          padding: '1.25rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          background: 'rgba(20,20,28,0.6)',
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 8, letterSpacing: '-0.02em' }}>
          Orbit<span style={{ color: 'var(--accent2)' }}>CRM</span>
        </div>
        <NavLink to="/" style={nav}>Overview</NavLink>
        <NavLink to="/leads" style={nav}>Leads</NavLink>
        <NavLink to="/settings" style={nav}>Ajustes</NavLink>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: '0.7rem', color: 'var(--muted)', lineHeight: 1.4 }} data-testid="e2e-prompt-snippet">
          {USER_PROMPT}
        </div>
      </aside>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{ borderBottom: '1px solid var(--border)', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontWeight: 600, display: 'none' }} className="show-mobile">
            OrbitCRM
          </div>
          <div style={{ flex: 1 }} />
          <button type="button" className="btn-ghost" style={{ fontSize: '0.85rem' }}>
            Filtrar pipeline
          </button>
          <button type="button" className="btn-primary" style={{ fontSize: '0.85rem' }}>
            Nuevo lead
          </button>
        </header>
        <main style={{ flex: 1, padding: '1.25rem' }} data-testid="e2e-generated-root">
          {children}
        </main>
      </div>
    </div>
  );
}

function nav({ isActive }: { isActive: boolean }) {
  return {
    padding: '0.5rem 0.75rem',
    borderRadius: 10,
    fontSize: '0.9rem',
    fontWeight: 500,
    color: isActive ? 'var(--text)' : 'var(--muted)',
    background: isActive ? 'rgba(99,102,241,0.18)' : 'transparent',
  } as const;
}

function Overview() {
  return (
    <div style={{ display: 'grid', gap: '1.25rem' }}>
      <h1 style={{ margin: 0, fontSize: '1.6rem', letterSpacing: '-0.03em' }}>Overview</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: '1rem' }}>
        {[
          { l: 'MRR simulado', v: '48.2k €', d: '+12%' },
          { l: 'Leads activos', v: '128', d: '23 nuevos' },
          { l: 'Win rate', v: '34%', d: 'últimos 30d' },
        ].map((x) => (
          <div key={x.l} className="card" style={{ padding: '1.1rem 1.2rem' }}>
            <div style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>{x.l}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: 6 }}>{x.v}</div>
            <div style={{ color: 'var(--accent2)', fontSize: '0.78rem', marginTop: 6 }}>{x.d}</div>
          </div>
        ))}
      </div>
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <strong>Embudo</strong>
          <span className="badge badge-warn">Demo</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, fontSize: '0.78rem', color: 'var(--muted)' }}>
          {['Descubierto', 'Reunión', 'Propuesta', 'Ganado'].map((s, i) => (
            <div key={s} className="card" style={{ padding: '0.75rem', background: 'var(--panel2)' }}>
              <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>{s}</div>
              <div>{[12, 9, 5, 3][i]} deals</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Leads() {
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [user, setUser] = useState<{ email: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const j = (await api('/api/app/Lead')) as { items?: Row[] };
      setRows(j.items ?? []);
      const me = (await fetch('/api/app/auth/me', { credentials: 'include' }).then((r) => r.json())) as { user?: { email: string } | null };
      setUser(me.user ?? null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => JSON.stringify(r).toLowerCase().includes(s));
  }, [rows, q]);

  async function demo() {
    const email = 'demo@saas.local';
    const password = 'DemoSaas123!';
    await api('/api/app/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) }).catch(() => null);
    await api('/api/app/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    await api('/api/app/Lead', {
      method: 'POST',
      body: JSON.stringify({ name: 'Acme SL', company: 'Acme', email: 'hola@acme.test', status: 'nuevo', value: 12000 }),
    });
    await load();
  }

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Leads</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input className="input" style={{ width: 220 }} placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} />
          <button type="button" className="btn-primary" onClick={() => void demo()}>
            Demo + fila
          </button>
        </div>
      </div>
      {user && <span className="badge badge-ok" style={{ width: 'fit-content' }}>{user.email}</span>}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <p style={{ padding: '1.25rem', color: 'var(--muted)' }}>Cargando…</p>
        ) : err ? (
          <p style={{ padding: '1.25rem', color: 'var(--danger)' }}>{err}</p>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--muted)' }}>
            <div style={{ fontSize: '2rem' }}>📊</div>
            <div style={{ fontWeight: 600, color: 'var(--text)', marginTop: 8 }}>Pipeline vacío</div>
            <div style={{ marginTop: 6, fontSize: '0.9rem' }}>Pulsa «Demo + fila» para poblar CRM de ejemplo.</div>
          </div>
        ) : (
          <div className="table-wrap" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>Email</th>
                  <th>Valor</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={String(r.id)}>
                    <td style={{ fontWeight: 600 }}>{String(r.name ?? r.company ?? '—')}</td>
                    <td style={{ color: 'var(--muted)' }}>{String(r.email ?? '—')}</td>
                    <td>{r.value != null ? Number(r.value).toLocaleString('es-ES') + ' €' : '—'}</td>
                    <td>
                      <span className="badge badge-ok">{String(r.status ?? '—')}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Settings() {
  return (
    <div className="card" style={{ padding: '1.5rem', maxWidth: 520 }}>
      <h1 style={{ marginTop: 0 }}>Ajustes</h1>
      <p style={{ color: 'var(--muted)' }}>Preferencias de equipo e integraciones Stripe aparecen como adaptadores en el panel de Amable.</p>
    </div>
  );
}

export default function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/leads" element={<Leads />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Shell>
  );
}
`;
}

function landingAppSource(promptConst: string): string {
  return `import type { FormEvent, ReactNode } from 'react';
import { useState } from 'react';
import { Link, NavLink, Route, Routes } from 'react-router-dom';

const USER_PROMPT = ${promptConst};

async function api(path: string, init?: RequestInit) {
  const r = await fetch(path, { credentials: 'include', ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) } });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((j as { error?: string }).error || r.statusText);
  return j;
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <header style={{ borderBottom: '1px solid var(--border)', background: 'rgba(12,12,16,0.85)', backdropFilter: 'blur(10px)' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link to="/" style={{ fontWeight: 700 }}>
            Aurora<span style={{ color: 'var(--accent2)' }}>Labs</span>
          </Link>
          <nav style={{ display: 'flex', gap: 8, flex: 1 }}>
            <NavLink to="/" style={({ isActive }) => ({ fontSize: '0.9rem', color: isActive ? 'var(--text)' : 'var(--muted)', fontWeight: 500 })}>Producto</NavLink>
            <NavLink to="/waitlist" style={({ isActive }) => ({ fontSize: '0.9rem', color: isActive ? 'var(--text)' : 'var(--muted)', fontWeight: 500 })}>Lista</NavLink>
            <NavLink to="/auth" style={({ isActive }) => ({ fontSize: '0.9rem', color: isActive ? 'var(--text)' : 'var(--muted)', fontWeight: 500 })}>Acceso</NavLink>
          </nav>
          <span style={{ fontSize: '0.72rem', color: 'var(--muted)', maxWidth: 200, textAlign: 'right' }} data-testid="e2e-prompt-snippet">
            {USER_PROMPT}
          </span>
        </div>
      </header>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

function Home() {
  return (
    <div data-testid="e2e-generated-root">
      <section style={{ maxWidth: 1040, margin: '0 auto', padding: '3.5rem 1.25rem 2rem', textAlign: 'center' }}>
        <div className="badge badge-warn" style={{ marginBottom: '1rem' }}>
          Acceso anticipado
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', margin: '0 0 1rem', letterSpacing: '-0.04em', lineHeight: 1.1 }}>
          El futuro de tus datos, <span style={{ color: 'var(--accent2)' }}>sin fricción</span>
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '1.1rem', maxWidth: 560, margin: '0 auto 1.75rem', lineHeight: 1.6 }}>
          Landing premium responsive: prueba social, CTA claros y lista de espera real vía API pública.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/waitlist">
            <button type="button" className="btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
              Unirme a la lista
            </button>
          </Link>
          <Link to="/auth">
            <button type="button" className="btn-ghost" style={{ padding: '0.75rem 1.5rem' }}>
              Ya tengo cuenta
            </button>
          </Link>
        </div>
        <div style={{ marginTop: '3rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))', gap: '1rem', textAlign: 'left' }}>
          {[
            { t: 'Seguridad', d: 'Cifrado en tránsito y cookies httpOnly en auth de app.' },
            { t: 'Velocidad', d: 'Vite + React 19. Misma build en preview y publicación.' },
            { t: 'Equipos', d: 'Roles user/admin en endpoints generados.' },
          ].map((x) => (
            <div key={x.t} className="card" style={{ padding: '1.1rem 1.2rem' }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>{x.t}</div>
              <div style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>{x.d}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Waitlist() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    try {
      await api('/api/app/WaitlistEntry', { method: 'POST', body: JSON.stringify({ name, email, role: 'founder' }) });
      setMsg('¡Estás dentro! Te avisamos pronto.');
      setName('');
      setEmail('');
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : String(e2));
    }
  }
  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '2.5rem 1.25rem' }} data-testid="e2e-generated-root">
      <h1 style={{ marginTop: 0 }}>Lista de espera</h1>
      <p style={{ color: 'var(--muted)' }}>POST público validado — sin sesión previa.</p>
      <form className="card" style={{ padding: '1.25rem', display: 'grid', gap: '0.85rem', marginTop: '1rem' }} onSubmit={submit}>
        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Nombre</label>
          <input className="input" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Email</label>
          <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        {err && <p style={{ color: 'var(--danger)', margin: 0, fontSize: '0.88rem' }}>{err}</p>}
        {msg && <p style={{ color: '#86efac', margin: 0, fontSize: '0.88rem' }}>{msg}</p>}
        <button type="submit" className="btn-primary">
          Enviar
        </button>
      </form>
    </div>
  );
}

function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tab, setTab] = useState<'in' | 'up'>('in');
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  async function go() {
    setErr(null);
    setOk(false);
    try {
      if (tab === 'up') {
        await api('/api/app/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) });
      }
      await api('/api/app/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      setOk(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }
  return (
    <div style={{ maxWidth: 420, margin: '0 auto', padding: '2.5rem 1.25rem' }} data-testid="e2e-generated-root">
      <h1 style={{ marginTop: 0 }}>Acceso</h1>
      <div style={{ display: 'flex', gap: 8, marginBottom: '1rem' }}>
        <button type="button" className={tab === 'in' ? 'btn-primary' : 'btn-ghost'} onClick={() => setTab('in')}>
          Entrar
        </button>
        <button type="button" className={tab === 'up' ? 'btn-primary' : 'btn-ghost'} onClick={() => setTab('up')}>
          Registro
        </button>
      </div>
      <div className="card" style={{ padding: '1.25rem', display: 'grid', gap: '0.75rem' }}>
        <input className="input" type="email" placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="input" type="password" placeholder="contraseña (mín. 8)" value={password} onChange={(e) => setPassword(e.target.value)} />
        {err && <p style={{ color: 'var(--danger)', margin: 0, fontSize: '0.85rem' }}>{err}</p>}
        {ok && <p style={{ color: '#86efac', margin: 0, fontSize: '0.85rem' }}>Sesión iniciada. Cookie de app generada.</p>}
        <button type="button" className="btn-primary" onClick={() => void go()}>
          Continuar
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/waitlist" element={<Waitlist />} />
        <Route path="/auth" element={<Auth />} />
      </Routes>
    </Shell>
  );
}
`;
}

export function mockPremiumViteFiles(template: OutputTemplateId, promptSnippet: string): { path: string; content: string }[] {
  const promptConst = JSON.stringify(promptSnippet.slice(0, 200));
  const titles: Record<OutputTemplateId, string> = {
    bookings: 'Reservas — premium',
    saas_dashboard: 'SaaS — dashboard',
    landing_auth: 'Landing — Aurora',
  };
  const app =
    template === 'saas_dashboard'
      ? saasAppSource(promptConst)
      : template === 'landing_auth'
        ? landingAppSource(promptConst)
        : bookingsAppSource(promptConst);

  return [
    { path: 'package.json', content: basePackageJson() + '\n' },
    { path: 'vite.config.ts', content: sharedViteConfig() },
    { path: 'index.html', content: sharedIndexHtml(titles[template]) },
    { path: 'src/index.css', content: sharedIndexCss() },
    { path: 'src/main.tsx', content: sharedMain() },
    { path: 'src/App.tsx', content: app },
  ];
}
