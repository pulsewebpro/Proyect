import Link from 'next/link';
import { Button } from '@amable/ui';

const rows = [
  ['Prompt → plan (spec)', 'Sí'],
  ['Build → código + plantillas premium', 'Sí'],
  ['Preview = misma build que publicación', 'Sí'],
  ['URL pública + despublicar', 'Sí'],
  ['API + datos + auth app generada', 'Sí'],
  ['ZIP + GitHub export', 'Sí'],
  ['Créditos por iteración + estado /engine', 'Sí'],
  ['MicroVM sandbox por proyecto (tipo E2B)', 'No en el núcleo'],
  ['DB dedicada auto por tenant', 'Namespaced en tu Postgres'],
];

export default function ParidadPage() {
  return (
    <div className="mx-auto min-h-dvh max-w-3xl px-6 py-16">
      <p className="text-sm text-muted">
        <Link href="/" className="text-accent-6 hover:underline">
          ← Inicio
        </Link>
      </p>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">Paridad con AI web builders</h1>
      <p className="mt-4 text-muted">
        Puedes usar Amable Studio <strong className="text-fg">como los referentes del segmento</strong> para el flujo que define el
        producto: idea → spec → código → preview real → publicación → URL → datos → export → iteración con créditos. Eso está en{' '}
        <code className="text-fg">main</code> y es el uso diario de equipos que venden software web con IA.
      </p>
      <p className="mt-3 text-sm text-muted">
        La tabla detallada y los matices viven en el repo:{' '}
        <code className="text-fg">docs/BUILDER_PARITY.md</code>.
      </p>
      <div className="mt-10 overflow-hidden rounded-[var(--radius)] border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-panel-2 text-left text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Capacidad</th>
              <th className="px-4 py-3 font-medium">Amable</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([cap, ok]) => (
              <tr key={cap} className="border-t border-white/10">
                <td className="px-4 py-3">{cap}</td>
                <td className="px-4 py-3 font-medium text-fg">{ok}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-10 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/registro">Empezar</Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href="/iniciar-sesion">Iniciar sesión</Link>
        </Button>
      </div>
    </div>
  );
}
