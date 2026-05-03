const RESEND_API = 'https://api.resend.com/emails';

export async function sendTransactionalEmail(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM?.trim() || 'Amable Studio <onboarding@resend.dev>';
  if (!key) {
    if (process.env.NODE_ENV !== 'production') {
      console.info('[email] RESEND_API_KEY no configurada; no se envía correo a', params.to);
    }
    return { ok: false, error: 'RESEND_API_KEY no configurada' };
  }
  const r = await fetch(RESEND_API, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [params.to],
      subject: params.subject,
      html: params.html,
      text: params.text ?? params.html.replace(/<[^>]+>/g, ' '),
    }),
  });
  if (!r.ok) {
    const t = await r.text();
    return { ok: false, error: t.slice(0, 400) };
  }
  return { ok: true };
}
