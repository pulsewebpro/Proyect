import Link from 'next/link';

const support = process.env.SUPPORT_EMAIL ?? 'soporte@tudominio.com';

export default function PrivacidadPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16 text-sm leading-relaxed text-muted">
      <h1 className="mb-6 text-2xl font-semibold text-fg">Privacidad</h1>
      <p className="mb-4">
        Amable Studio trata los datos que nos facilitas (correo, nombre, contenido de proyectos y uso del servicio)
        para prestar la plataforma: cuenta, facturación básica, ejecución de runs, alojamiento de archivos y
        publicación. Los proveedores de infraestructura (por ejemplo alojamiento, base de datos, correo y modelos
        de IA) pueden procesar datos en tu nombre según sus propias políticas.
      </p>
      <p className="mb-4">
        Puedes ejercer tus derechos de acceso, rectificación o supresión escribiendo a{' '}
        <a className="text-accent-6 underline" href={`mailto:${support}`}>
          {support}
        </a>
        . Este texto es orientativo: revisa con tu asesor legal la versión definitiva antes de lanzar a clientes
        finales.
      </p>
      <p>
        <Link href="/" className="text-accent-6 underline">
          Volver al inicio
        </Link>
      </p>
    </div>
  );
}
