import type { ModelReply, ToolSpec, Turn } from '../types';

// The OpenAI chat format, which Ollama, OpenRouter, LM Studio and many others also speak.
type FunctionCall = {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
  extra_content?: unknown; // Gemini's "thought signature": must go back unchanged
};
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
      // Extra data the server attached to a call (Gemini's thought signature) is sent back as is.
      const sent = (turn.raw as { tool_calls?: FunctionCall[] } | undefined)?.tool_calls ?? [];
      const calls = turn.toolCalls.map((c) => {
        const extra = sent.find((s) => s.id === c.id)?.extra_content;
        return {
          id: c.id,
          type: 'function' as const,
          function: { name: c.name, arguments: JSON.stringify(c.input) },
          ...(extra ? { extra_content: extra } : {}),
        };
      });
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

// A tool without inputs is sent without a schema: some servers (Gemini) refuse an empty one.
export function toOpenAITools(tools: ToolSpec[]) {
  return tools.map((t) => {
    const { name, description, parameters } = t;
    const hasInputs = Object.keys(parameters.properties).length > 0;
    return {
      type: 'function' as const,
      function: { name, description, ...(hasInputs ? { parameters } : {}) },
    };
  });
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
  return { text: choice.message.content ?? '', toolCalls, stop, raw: choice.message };
}
