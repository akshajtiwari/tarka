import * as SecureStore from 'expo-secure-store';

// The git token (a GitHub/GitLab personal access token) is kept in the phone's
// encrypted storage (Android Keystore), never in plain app storage.
const GIT_TOKEN = 'git-token';

export function getGitToken(): Promise<string | null> {
  return SecureStore.getItemAsync(GIT_TOKEN);
}

export function setGitToken(token: string): Promise<void> {
  if (!token) return SecureStore.deleteItemAsync(GIT_TOKEN);
  return SecureStore.setItemAsync(GIT_TOKEN, token);
}
