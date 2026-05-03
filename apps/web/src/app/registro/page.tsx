'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '@amable/ui';

export default function RegistroPage() {
  const router = useRouter();
  const [registrationOpen, setRegistrationOpen] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      const r = await fetch('/api/auth/registro');
      const j = await r.json().catch(() => ({}));
      if (typeof j.registrationOpen === 'boolean') setRegistrationOpen(j.registrationOpen);
    })();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch('/api/auth/registro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name: name || undefined }),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? 'Error');
      return;
    }
    router.push('/dashboard');
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-16">
      <Card>
        <CardHeader>
          <CardTitle>Crear cuenta</CardTitle>
        </CardHeader>
        <CardContent>
          {!registrationOpen ? (
            <p className="text-sm text-muted">
              El registro público está cerrado. Si necesitas acceso, escribe al equipo.
            </p>
          ) : (
            <form className="space-y-4" onSubmit={onSubmit}>
              <div>
                <label className="mb-1 block text-sm text-muted" htmlFor="name">
                  Nombre
                </label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
              </div>
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
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              {error ? <p className="text-sm text-accent-2">{error}</p> : null}
              <Button type="submit" className="w-full" disabled={loading}>
                Crear espacio de trabajo
              </Button>
            </form>
          )}
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
            ¿Ya tienes cuenta?{' '}
            <Link className="text-accent-6 underline-offset-4 hover:underline" href="/iniciar-sesion">
              Iniciar sesión
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
