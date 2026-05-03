import Link from 'next/link';

export default function CookiesPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16 text-sm leading-relaxed text-muted">
      <h1 className="mb-6 text-2xl font-semibold text-fg">Cookies</h1>
      <p className="mb-4">
        Utilizamos cookies técnicas necesarias para mantener tu sesión iniciada (por ejemplo la cookie de sesión de
        la plataforma y, si aplica, la de la aplicación generada). No usamos cookies publicitarias de terceros en
        esta versión del producto.
      </p>
      <p>
        <Link href="/" className="text-accent-6 underline">
          Volver al inicio
        </Link>
      </p>
    </div>
  );
}
