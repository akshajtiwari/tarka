import type { Turn } from './types';

// If a run is stopped or fails between "the model asked for tools" and "here are the
// results", the next message would be rejected by the API. Answer the open calls.
export function repairHistory(history: Turn[]) {
  const last = history.at(-1);
  if (last?.role === 'assistant' && last.toolCalls.length > 0) {
    history.push({
      role: 'tool',
      results: last.toolCalls.map((c) => ({
        id: c.id,
        output: 'Stopped before this ran.',
        isError: true,
      })),
    });
  }
}
