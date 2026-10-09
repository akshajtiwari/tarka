import type { ModelReply, ToolSpec, Turn } from '../types';

// The few pieces of the Anthropic Messages API format we use.
export type AnthropicBlock = { type: string; [field: string]: unknown };
export type AnthropicMessage = { role: 'user' | 'assistant'; content: string | AnthropicBlock[] };

// Assistant turns are sent back exactly as the API gave them (including thinking blocks),
// which the API requires when continuing a conversation. A turn from the other provider
// (you switched in Settings) has no such content, so it is rebuilt from its text and tool calls.
function assistantContent(turn: Extract<Turn, { role: 'assistant' }>): AnthropicBlock[] {
  if (Array.isArray(turn.raw) && turn.raw.length > 0) return turn.raw;
  const blocks: AnthropicBlock[] = turn.text ? [{ type: 'text', text: turn.text }] : [];
  for (const c of turn.toolCalls)
    blocks.push({ type: 'tool_use', id: c.id, name: c.name, input: c.input });
  return blocks.length > 0 ? blocks : [{ type: 'text', text: '(no reply)' }]; // the API refuses empty content
}

// Our history -> Anthropic messages.
export function toAnthropicMessages(history: Turn[]): AnthropicMessage[] {
  return history.map((turn): AnthropicMessage => {
    if (turn.role === 'user') return { role: 'user', content: turn.text };
    if (turn.role === 'assistant') return { role: 'assistant', content: assistantContent(turn) };
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
