import * as SecureStore from 'expo-secure-store';

// Secrets (git token, AI API keys) are kept in the phone's encrypted storage (Android Keystore),
// never in plain app storage.
export type SecretName = 'git-token' | 'anthropic-key' | 'openai-key';

export function getSecret(name: SecretName): Promise<string | null> {
  return SecureStore.getItemAsync(name);
}

export function setSecret(name: SecretName, value: string): Promise<void> {
  if (!value) return SecureStore.deleteItemAsync(name);
  return SecureStore.setItemAsync(name, value);
}

export const getGitToken = () => getSecret('git-token');
export const setGitToken = (token: string) => setSecret('git-token', token);
