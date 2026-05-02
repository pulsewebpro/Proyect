import { Suspense } from 'react';
import IniciarSesionClient from './ui';

export default function IniciarSesionPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-muted">Cargando…</div>}>
      <IniciarSesionClient />
    </Suspense>
  );
}
