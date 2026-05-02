import { NextResponse } from 'next/server';

const base = () => process.env.PUBLIC_APP_URL ?? 'http://localhost:3000';

/** Sign in with Apple requiere Service ID, Key .p8 y JWT de cliente; pendiente de despliegue. */
export async function GET() {
  return NextResponse.redirect(`${base()}/iniciar-sesion?error=apple_not_configured`);
}
