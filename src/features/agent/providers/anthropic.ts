import Anthropic from '@anthropic-ai/sdk';
import { fetch as expoFetch } from 'expo/fetch';

import { SYSTEM_PROMPT } from '../tools';
import type { Provider } from '../types';
import { fromAnthropic, toAnthropicMessages, toAnthropicTools } from './anthropicMessages';

export const DEFAULT_ANTHROPIC_MODEL = 'claude-opus-5-5';

export function anthropicProvider(apiKey: string, model: string): Provider {
  const client = new Anthropic({
    apiKey,
    fetch: expoFetch as unknown as typeof fetch, // expo's fetch can stream the reply as it is written
    dangerouslyAllowBrowser: true, // the user's own key on their own phone (bring your own key)
  });

  return {
    async reply(history, tools, onText, signal) {
      const stream = client.beta.messages.stream(
        {
          model: model || DEFAULT_ANTHROPIC_MODEL,
          max_tokens: 64000,
          system: SYSTEM_PROMPT,
          thinking: { type: 'adaptive' },
          output_config: { effort: 'high' },
          // If a safety check declines the request, the API retries it on a suitable model.
          betas: ['server-side-fallback-2026-07-01'],
          fallbacks: 'default',
          tools: toAnthropicTools(tools),
          messages: toAnthropicMessages(history),
        },
        { signal },
      );
      stream.on('text', onText);
      const message = await stream.finalMessage();
      return fromAnthropic(message.content, message.stop_reason);
    },
  };
}
