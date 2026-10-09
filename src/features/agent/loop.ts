import type { Provider, ToolCall, ToolResult, ToolSpec, Turn } from './types';

export const MAX_STEPS = 25;

export type AgentEvent =
  | { type: 'text'; delta: string }
  | { type: 'tool-start'; call: ToolCall }
  | { type: 'tool-end'; call: ToolCall; result: ToolResult }
  | { type: 'stopped'; reason: string };

type Options = {
  provider: Provider;
  history: Turn[]; // ends with the user's new message; the loop appends to it
  tools: ToolSpec[];
  runTool: (call: ToolCall) => Promise<ToolResult>;
  onEvent: (event: AgentEvent) => void;
  signal: AbortSignal;
};

// The agent loop: ask the model, run the tools it asks for, give it the results, repeat.
// It ends on a final answer, a refusal, the step budget, a repeated identical call
// (a sign it is stuck), or when the user taps Stop.
export async function runAgent({ provider, history, tools, runTool, onEvent, signal }: Options) {
  const seen = new Map<string, number>(); // "tool + input" -> how often it was called

  for (let step = 0; step < MAX_STEPS; step++) {
    if (signal.aborted) return onEvent({ type: 'stopped', reason: 'Stopped by you.' });

    const reply = await provider.reply(
      history,
      tools,
      (delta) => onEvent({ type: 'text', delta }),
      signal,
    );
    history.push({
      role: 'assistant',
      text: reply.text,
      toolCalls: reply.toolCalls,
      raw: reply.raw,
    });

    if (reply.stop === 'refused')
      return onEvent({ type: 'stopped', reason: 'The model declined this request.' });
    if (reply.stop === 'too-long')
      return onEvent({ type: 'stopped', reason: 'The reply was cut off (too long).' });
    if (reply.toolCalls.length === 0) return onEvent({ type: 'stopped', reason: 'Done.' });

    const results: ToolResult[] = [];
    for (const call of reply.toolCalls) {
      // After Stop, every remaining call still needs an answer, or the conversation breaks.
      if (signal.aborted) {
        results.push({ id: call.id, output: 'Stopped before this ran.', isError: true });
        continue;
      }
      const key = call.name + JSON.stringify(call.input);
      seen.set(key, (seen.get(key) ?? 0) + 1);
      if (seen.get(key)! >= 3) {
        return onEvent({
          type: 'stopped',
          reason: `Stopped: it called ${call.name} with the same input 3 times.`,
        });
      }
      onEvent({ type: 'tool-start', call });
      const result = await runTool(call);
      onEvent({ type: 'tool-end', call, result });
      results.push(result);
    }
    history.push({ role: 'tool', results });
  }
  onEvent({ type: 'stopped', reason: `Stopped after ${MAX_STEPS} steps.` });
}
