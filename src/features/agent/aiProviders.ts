import type { SecretName } from '../../lib/secure';
import type { AiProvider } from '../settings/settingsStore';
import { DEFAULT_ANTHROPIC_MODEL } from './providers/anthropic';

// Gemini speaks the OpenAI chat format at this address, so it reuses the OpenAI-compatible code.
export const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/';

type ProviderInfo = {
  name: string;
  subtitle?: string;
  secret: SecretName; // where its API key is kept
  defaultModel: string; // used when the model field is empty ("" = must be filled in)
  keyHint: string;
  needsServer?: boolean; // the user types the server address
};

// The AI services the agent can use, in the order Settings shows them.
export const AI_PROVIDERS: Record<AiProvider, ProviderInfo> = {
  anthropic: {
    name: 'Anthropic (Claude)',
    secret: 'anthropic-key',
    defaultModel: DEFAULT_ANTHROPIC_MODEL,
    keyHint: 'sk-ant-…',
  },
  gemini: {
    name: 'Google Gemini',
    subtitle: 'Get a key at aistudio.google.com',
    secret: 'gemini-key',
    defaultModel: 'gemini-3.8-flash',
    keyHint: 'AIza…',
  },
  openai: {
    name: 'OpenAI-compatible',
    subtitle: 'OpenAI, OpenRouter, or Ollama on your laptop',
    secret: 'openai-key',
    defaultModel: '',
    keyHint: 'not needed for Ollama',
    needsServer: true,
  },
};
