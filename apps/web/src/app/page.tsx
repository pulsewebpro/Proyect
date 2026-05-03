import Link from 'next/link';
import { Button } from '@amable/ui';

const sections = [
  {
    title: 'Primera versión, lista de verdad',
    body: 'Plan y build generan una app web publicable (preview y URL usan el mismo pipeline). No es un juguete: es tu primer entregable sólido.',
  },
  {
    title: 'Mejora con créditos',
    body: 'Cada run consume créditos y avanza el producto: copy, pantallas, datos y UI van refinándose sin empezar de cero.',
  },
  {
    title: 'Evolución visual en vivo',
    body: 'Ves el resultado en la vista previa y en publicación; cada iteración acerca la interfaz a lo que pediste, con plantillas premium como base.',
  },
  {
    title: 'Plantillas premium',
    body: 'Reservas, dashboard SaaS o landing con auth: arquetipos exigentes para que el primer resultado ya parezca producto, no plantilla genérica.',
  },
  {
    title: 'Publicación y analítica',
    body: 'URL pública, export ZIP y GitHub cuando toque; métricas básicas reales sobre el tráfico del sitio publicado.',
  },
  {
    title: 'Hecho para cobrar',
    body: 'Pensado para equipos que venden software web: entregas rápidas, iteración medible y control del alcance por plantilla.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="text-lg font-semibold tracking-tight">Amable Studio</div>
        <nav className="flex gap-3">
          <Button variant="ghost" asChild>
            <Link href="/iniciar-sesion">Iniciar sesión</Link>
          </Button>
          <Button asChild>
            <Link href="/registro">Empieza gratis</Link>
          </Button>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-6 pb-24">
        <section className="py-20 text-center">
          <p className="mb-4 text-sm text-muted">Modo producto: plataformas web, no pantallas sueltas</p>
          <h1 className="mx-auto max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            De la idea a una plataforma web que puedes publicar
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted">
            El primer entregable ya es usable y coherente; con créditos sigues iterando y ves la interfaz evolucionar en preview y en la URL
            viva, sin truco de “demo” aparte del producto.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/registro">Empieza gratis</Link>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/iniciar-sesion">Iniciar sesión</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/paridad">Paridad con builders</Link>
            </Button>
          </div>
        </section>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((s) => (
            <div key={s.title} className="rounded-[var(--radius)] border border-white/10 bg-panel p-6 shadow-panel">
              <h2 className="text-lg font-semibold">{s.title}</h2>
              <p className="mt-2 text-sm text-muted">{s.body}</p>
            </div>
          ))}
        </div>
        <section className="border-t border-white/10 py-12 text-center text-sm text-muted">
          <p>
            <Link className="text-accent-6 underline-offset-4 hover:underline" href="/privacidad">
              Privacidad
            </Link>
            {' · '}
            <Link className="text-accent-6 underline-offset-4 hover:underline" href="/terminos">
              Términos
            </Link>
            {' · '}
            <Link className="text-accent-6 underline-offset-4 hover:underline" href="/cookies">
              Cookies
            </Link>
          </p>
        </section>
      </main>
    </div>
  );
}
