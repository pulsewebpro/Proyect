/** Extract first ```json ... ``` or raw JSON object from model output. */
export function extractJsonObject(raw: string): unknown {
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fence?.[1]?.trim() ?? raw.trim();
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('No JSON object in model output');
  const slice = candidate.slice(start, end + 1);
  return JSON.parse(slice) as unknown;
}
