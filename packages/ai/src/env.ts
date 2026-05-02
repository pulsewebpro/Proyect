export type LlmEnv = {
  openaiApiKey?: string;
  anthropicApiKey?: string;
  openaiModel?: string;
  anthropicModel?: string;
  nodeEnv?: string;
};

export function hasAnyLlmKey(env: LlmEnv): boolean {
  return Boolean((env.openaiApiKey ?? '').trim() || (env.anthropicApiKey ?? '').trim());
}

export function isLocalDev(env: LlmEnv): boolean {
  return (env.nodeEnv ?? 'development') !== 'production';
}
