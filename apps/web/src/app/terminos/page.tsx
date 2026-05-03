import Link from 'next/link';

const support = process.env.SUPPORT_EMAIL ?? 'soporte@tudominio.com';

export default function TerminosPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16 text-sm leading-relaxed text-muted">
      <h1 className="mb-6 text-2xl font-semibold text-fg">Términos de uso</h1>
      <p className="mb-4">
        Al usar Amable Studio te comprometes a no emplear el servicio para actividades ilegales, a respetar la
        propiedad intelectual de terceros y a no sobrecargar de forma abusiva la infraestructura. El servicio se
        ofrece «tal cual»; la disponibilidad y las prestaciones pueden cambiar.
      </p>
      <p className="mb-4">
        Para incidencias comerciales o contractuales:{' '}
        <a className="text-accent-6 underline" href={`mailto:${support}`}>
          {support}
        </a>
        . Sustituye este borrador por los términos revisados por tu abogado antes de abrir al público de pago.
      </p>
      <p>
        <Link href="/" className="text-accent-6 underline">
          Volver al inicio
        </Link>
      </p>
    </div>
  );
}
