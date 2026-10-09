import type { ModelReply, ToolSpec, Turn } from '../types';

// The few pieces of the Anthropic Messages API format we use.
export type AnthropicBlock = { type: string; [field: string]: unknown };
export type AnthropicMessage = { role: 'user' | 'assistant'; content: string | AnthropicBlock[] };

// Our history -> Anthropic messages. Assistant turns are sent back exactly as the API gave
// them (including thinking blocks), which the API requires when continuing a conversation.
export function toAnthropicMessages(history: Turn[]): AnthropicMessage[] {
  return history.map((turn): AnthropicMessage => {
    if (turn.role === 'user') return { role: 'user', content: turn.text };
    if (turn.role === 'assistant')
      return { role: 'assistant', content: turn.raw as AnthropicBlock[] };
    return {
      role: 'user',
      content: turn.results.map((r) => ({
        type: 'tool_result',
        tool_use_id: r.id,
        content: r.output,
        is_error: r.isError,
      })),
    };
  });
}

export function toAnthropicTools(tools: ToolSpec[]) {
  return tools.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.parameters,
  }));
}

// Anthropic's reply -> our neutral reply.
export function fromAnthropic(content: AnthropicBlock[], stopReason: string | null): ModelReply {
  const toolCalls = content.flatMap((b) =>
    b.type === 'tool_use'
      ? [
          {
            id: String(b.id),
            name: String(b.name),
            input: (b.input ?? {}) as Record<string, unknown>,
          },
        ]
      : [],
  );
  const text = content.flatMap((b) => (b.type === 'text' ? [String(b.text)] : [])).join('');
  let stop: ModelReply['stop'] = toolCalls.length > 0 ? 'tools' : 'done';
  if (stopReason === 'refusal') stop = 'refused'; // never run tools from a refused turn
  if (stopReason === 'max_tokens') stop = 'too-long'; // a cut-off tool input is not safe to run
  return { text, toolCalls, stop, raw: content };
}
