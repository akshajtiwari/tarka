// The conversation in a provider-neutral shape. Each provider (Anthropic, OpenAI-compatible)
// turns this into its own message format, so the loop and the UI never depend on one API.

export type ToolCall = { id: string; name: string; input: Record<string, unknown> };
export type ToolResult = { id: string; output: string; isError: boolean };

export type Turn =
  | { role: 'user'; text: string }
  | { role: 'assistant'; text: string; toolCalls: ToolCall[]; raw?: unknown } // raw = provider's own content
  | { role: 'tool'; results: ToolResult[] };

export type ToolSpec = {
  name: string;
  description: string;
  parameters: { type: 'object'; properties: Record<string, unknown>; required: string[] };
};

// What one model call returns.
export type ModelReply = {
  text: string;
  toolCalls: ToolCall[];
  stop: 'done' | 'tools' | 'refused' | 'too-long';
  raw?: unknown;
};

export type Provider = {
  reply: (
    history: Turn[],
    tools: ToolSpec[],
    onText: (delta: string) => void,
    signal: AbortSignal,
  ) => Promise<ModelReply>;
};
