export async function openaiChatCompletion(params: {
  apiKey: string;
  model: string;
  system: string;
  user: string;
}): Promise<string> {
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: params.model,
      temperature: 0.2,
      messages: [
        { role: 'system', content: params.system },
        { role: 'user', content: params.user },
      ],
    }),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`OpenAI ${r.status}: ${t.slice(0, 500)}`);
  }
  const j = (await r.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = j.choices?.[0]?.message?.content;
  if (!text) throw new Error('OpenAI: empty response');
  return text;
}
