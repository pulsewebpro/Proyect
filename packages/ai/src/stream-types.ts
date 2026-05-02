export type StreamEvent =
  | { type: 'step'; name: string; status: string }
  | { type: 'message'; role: 'assistant'; content: string }
  | { type: 'diff'; path: string; patch: string }
  | { type: 'file'; path: string; content: string }
  | { type: 'done'; creditsUsed: number }
  | { type: 'error'; message: string };
