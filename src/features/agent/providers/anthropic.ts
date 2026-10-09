import { SYSTEM_PROMPT } from '../tools';
import type { Provider } from '../types';
import {
  fromAnthropic,
  toAnthropicMessages,
  toAnthropicTools,
  type AnthropicBlock,
} from './anthropicMessages';
import { postJson } from './http';

export const DEFAULT_ANTHROPIC_MODEL = 'claude-opus-5-5';

// Calls the Claude Messages API with plain fetch. (The official SDK crashes when React
// Native's bundler loads it, see docs/DECISIONS.md.)
export function anthropicProvider(apiKey: string, model: string): Provider {
  return {
    // shortcut: not streamed, the answer appears when the turn is complete; stream it (SSE) if turns feel slow.
    async reply(history, tools, onText, signal) {
      const data = await postJson(
        'https://api.anthropic.com/v1/messages',
        {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          // If a safety check declines the request, the API retries it on a suitable model.
          'anthropic-beta': 'server-side-fallback-2026-07-01',
        },
        {
          model: model || DEFAULT_ANTHROPIC_MODEL,
          max_tokens: 16000,
          system: SYSTEM_PROMPT,
          thinking: { type: 'adaptive' },
          output_config: { effort: 'high' },
          fallbacks: 'default',
          tools: toAnthropicTools(tools),
          messages: toAnthropicMessages(history),
        },
        signal,
        'Anthropic',
      );
      const content = (data.content ?? []) as AnthropicBlock[];
      const reply = fromAnthropic(content, (data.stop_reason as string | undefined) ?? null);
      if (reply.text) onText(reply.text);
      return reply;
    },
  };
}
