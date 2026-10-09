import { getSecret } from '../../lib/secure';
import { useSettings } from '../settings/settingsStore';
import { anthropicProvider } from './providers/anthropic';
import { openaiProvider } from './providers/openai';
import type { Provider } from './types';

// Builds the provider chosen in Settings, with its key from secure storage.
export async function makeProvider(): Promise<Provider> {
  const { aiProvider, aiModel, aiBaseUrl } = useSettings.getState();
  if (aiProvider === 'anthropic') {
    const key = await getSecret('anthropic-key');
    if (!key) throw new Error('Add your Anthropic API key in Settings → AI first.');
    return anthropicProvider(key, aiModel);
  }
  if (!aiModel || !aiBaseUrl)
    throw new Error('Set the server address and model in Settings → AI first.');
  return openaiProvider((await getSecret('openai-key')) ?? '', aiModel, aiBaseUrl);
}
