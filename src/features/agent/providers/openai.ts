import { SYSTEM_PROMPT } from '../tools';
import type { Provider } from '../types';
import { postJson } from './http';
import { fromOpenAI, toOpenAIMessages, toOpenAITools, type ChatChoice } from './openaiMessages';

// Any OpenAI-compatible server: OpenAI, OpenRouter, or a local Ollama
// (http://<laptop-ip>:11434/v1 from a phone, http://10.0.2.2:11434/v1 from the emulator).
export function openaiProvider(apiKey: string, model: string, baseURL: string): Provider {
  return {
    // shortcut: not streamed, the whole reply arrives at once; stream it if slow replies feel stuck.
    async reply(history, tools, onText, signal) {
      const data = await postJson(
        `${baseURL.replace(/\/+$/, '')}/chat/completions`,
        apiKey ? { authorization: `Bearer ${apiKey}` } : {},
        { model, messages: toOpenAIMessages(SYSTEM_PROMPT, history), tools: toOpenAITools(tools) },
        signal,
        'AI server',
      );
      const choice = (data.choices as ChatChoice[] | undefined)?.[0];
      if (!choice) throw new Error('The AI server sent an empty reply.');
      const reply = fromOpenAI(choice);
      if (reply.text) onText(reply.text);
      return reply;
    },
  };
}
