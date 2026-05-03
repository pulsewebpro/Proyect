'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '@amable/ui';

function Form() {
  const router = useRouter();
  const search = useSearchParams();
  const token = search.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      setError('Enlace inválido');
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetch('/api/auth/restablecer-contrasena', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? 'Error');
      return;
    }
    router.push('/iniciar-sesion?reset=ok');
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nueva contraseña</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <Input
            type="password"
            required
            minLength={8}
            placeholder="Nueva contraseña (mín. 8 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error ? <p className="text-sm text-accent-2">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={loading || !token}>
            Guardar
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted">
          <Link href="/iniciar-sesion">Iniciar sesión</Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function NuevaContrasenaPage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-16">
      <Suspense fallback={<div className="text-muted">Cargando…</div>}>
        <Form />
      </Suspense>
    </div>
  );
}
