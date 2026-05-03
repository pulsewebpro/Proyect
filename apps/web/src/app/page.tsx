import Link from 'next/link';
import { Button } from '@amable/ui';

const sections = [
  'Mira cómo cobra vida',
  'Itera y publica',
  'Plantillas',
  'Seguridad',
  'Precios',
  'Preguntas frecuentes',
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
          <p className="mb-4 text-sm text-muted">De la idea al sitio publicado, con control y transparencia</p>
          <h1 className="mx-auto max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            Empieza con una idea
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted">
            Describe la app o sitio que quieres crear o arrastra capturas y documentos
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/registro">Empieza gratis</Link>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/iniciar-sesion">Iniciar sesión</Link>
            </Button>
          </div>
        </section>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((s) => (
            <div key={s} className="rounded-[var(--radius)] border border-white/10 bg-panel p-6 shadow-panel">
              <h2 className="text-lg font-semibold">{s}</h2>
              <p className="mt-2 text-sm text-muted">
                Contenido orientado a conversión. Sin copiar textos de terceros.
              </p>
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
