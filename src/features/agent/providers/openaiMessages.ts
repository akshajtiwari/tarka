import type { ModelReply, ToolSpec, Turn } from '../types';

// The OpenAI chat format, which Ollama, OpenRouter, LM Studio and many others also speak.
type FunctionCall = { id: string; type: 'function'; function: { name: string; arguments: string } };
export type ChatMessage =
  | { role: 'system' | 'user'; content: string }
  | { role: 'assistant'; content: string | null; tool_calls?: FunctionCall[] }
  | { role: 'tool'; tool_call_id: string; content: string };
export type ChatChoice = {
  finish_reason: string | null;
  message: { content?: string | null; tool_calls?: FunctionCall[] | null };
};

export function toOpenAIMessages(system: string, history: Turn[]): ChatMessage[] {
  const messages: ChatMessage[] = [{ role: 'system', content: system }];
  for (const turn of history) {
    if (turn.role === 'user') messages.push({ role: 'user', content: turn.text });
    if (turn.role === 'assistant') {
      const calls = turn.toolCalls.map((c) => ({
        id: c.id,
        type: 'function' as const,
        function: { name: c.name, arguments: JSON.stringify(c.input) },
      }));
      messages.push({
        role: 'assistant',
        content: turn.text || null,
        ...(calls.length ? { tool_calls: calls } : {}),
      });
    }
    if (turn.role === 'tool') {
      for (const r of turn.results)
        messages.push({ role: 'tool', tool_call_id: r.id, content: r.output });
    }
  }
  return messages;
}

export function toOpenAITools(tools: ToolSpec[]) {
  return tools.map((t) => ({
    type: 'function' as const,
    function: { name: t.name, description: t.description, parameters: t.parameters },
  }));
}

export function fromOpenAI(choice: ChatChoice): ModelReply {
  const toolCalls = (choice.message.tool_calls ?? []).map((c) => {
    let input: Record<string, unknown> = {};
    try {
      input = JSON.parse(c.function.arguments || '{}');
    } catch {
      input = { _unreadable_arguments: c.function.arguments }; // the tool will report the bad input
    }
    return { id: c.id, name: c.function.name, input };
  });
  let stop: ModelReply['stop'] = toolCalls.length > 0 ? 'tools' : 'done';
  if (choice.finish_reason === 'content_filter') stop = 'refused';
  if (choice.finish_reason === 'length') stop = 'too-long';
  return { text: choice.message.content ?? '', toolCalls, stop };
}
