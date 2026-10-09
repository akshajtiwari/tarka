import OpenAI from 'openai';

import { SYSTEM_PROMPT } from '../tools';
import type { Provider } from '../types';
import { fromOpenAI, toOpenAIMessages, toOpenAITools } from './openaiMessages';

// Any OpenAI-compatible server: OpenAI, OpenRouter, or a local Ollama
// (http://<laptop-ip>:11434/v1 from a phone, http://10.0.2.2:11434/v1 from the emulator).
export function openaiProvider(apiKey: string, model: string, baseURL: string): Provider {
  const client = new OpenAI({
    apiKey: apiKey || 'none',
    baseURL: baseURL || undefined,
    dangerouslyAllowBrowser: true,
  });

  return {
    // shortcut: not streamed, the whole reply arrives at once; stream it if slow replies feel stuck.
    async reply(history, tools, onText, signal) {
      const response = await client.chat.completions.create(
        {
          model,
          messages: toOpenAIMessages(SYSTEM_PROMPT, history) as never,
          tools: toOpenAITools(tools),
        },
        { signal },
      );
      const reply = fromOpenAI(response.choices[0]);
      if (reply.text) onText(reply.text);
      return reply;
    },
  };
}
