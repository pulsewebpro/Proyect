export async function anthropicMessages(params: {
  apiKey: string;
  model: string;
  system: string;
  user: string;
}): Promise<string> {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': params.apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: params.model,
      max_tokens: 8192,
      system: params.system,
      messages: [{ role: 'user', content: params.user }],
    }),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`Anthropic ${r.status}: ${t.slice(0, 500)}`);
  }
  const j = (await r.json()) as {
    content?: { type: string; text?: string }[];
  };
  const block = j.content?.find((c) => c.type === 'text');
  const text = block?.text;
  if (!text) throw new Error('Anthropic: empty response');
  return text;
}
