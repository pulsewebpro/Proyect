'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '@amable/ui';

export default function IniciarSesionClient() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get('next') ?? '/dashboard';
  const resetOk = search.get('reset') === 'ok';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch('/api/auth/iniciar-sesion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? 'Error');
      return;
    }
    router.push(next);
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-16">
      <Card>
        <CardHeader>
          <CardTitle>Iniciar sesión</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="mb-1 block text-sm text-muted" htmlFor="email">
                Correo electrónico
              </label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted" htmlFor="password">
                Contraseña
              </label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            {error ? <p className="text-sm text-accent-2">{error}</p> : null}
            {resetOk ? <p className="text-sm text-muted">Contraseña actualizada. Ya puedes entrar.</p> : null}
            <Button type="submit" className="w-full" disabled={loading}>
              Entrar
            </Button>
          </form>
          <div className="mt-6 space-y-2">
            <Button variant="secondary" className="w-full" type="button" asChild>
              <a href="/api/auth/oauth/google">Continuar con Google</a>
            </Button>
            <Button variant="secondary" className="w-full" type="button" asChild>
              <a href="/api/auth/oauth/github">Continuar con GitHub</a>
            </Button>
          </div>
          <p className="mt-2 text-center text-xs text-muted">Apple Sign In no está soportado.</p>
          <p className="mt-6 text-center text-sm text-muted">
            <Link className="text-accent-6 underline-offset-4 hover:underline" href="/registro">
              Crear cuenta
            </Link>
            {' · '}
            <Link className="text-accent-6 underline-offset-4 hover:underline" href="/recuperar-contrasena">
              ¿Olvidaste la contraseña?
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
