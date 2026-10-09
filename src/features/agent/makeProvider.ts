import { getSecret } from '../../lib/secure';
import { useSettings } from '../settings/settingsStore';
import { AI_PROVIDERS, GEMINI_URL } from './aiProviders';
import { anthropicProvider } from './providers/anthropic';
import { openaiProvider } from './providers/openai';
import type { Provider } from './types';

// Builds the provider chosen in Settings, with its key from secure storage.
export async function makeProvider(): Promise<Provider> {
  const { aiProvider, aiModels, aiBaseUrl } = useSettings.getState();
  const info = AI_PROVIDERS[aiProvider];
  const model = aiModels[aiProvider] || info.defaultModel;
  const key = await getSecret(info.secret);
  if (aiProvider === 'anthropic') {
    if (!key) throw new Error('Add your Anthropic API key in Settings → AI agent first.');
    return anthropicProvider(key, model);
  }
  if (aiProvider === 'gemini') {
    if (!key) throw new Error('Add your Gemini API key in Settings → AI agent first.');
    return openaiProvider(key, model, GEMINI_URL);
  }
  if (!model || !aiBaseUrl)
    throw new Error('Set the server address and model in Settings → AI agent first.');
  return openaiProvider(key ?? '', model, aiBaseUrl);
}
