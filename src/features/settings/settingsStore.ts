import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemeChoice = 'system' | 'dark' | 'light';
export type AiProvider = 'anthropic' | 'openai';

// App-wide settings saved between launches. Secrets (git token) live in secure storage instead.
type Settings = {
  theme: ThemeChoice;
  gitName: string;
  gitEmail: string;
  aiProvider: AiProvider;
  aiModel: string; // empty = the provider's default
  aiBaseUrl: string; // only for OpenAI-compatible servers (Ollama, OpenRouter, ...)
  tipsDone: boolean; // the first-launch tips card was dismissed
  finishTips: () => void;
  setAi: (provider: AiProvider, model: string, baseUrl: string) => void;
  setTheme: (theme: ThemeChoice) => void;
  setGitIdentity: (name: string, email: string) => void;
};

export const useSettings = create<Settings>()(
  persist(
    (set) => ({
      theme: 'system',
      gitName: '',
      gitEmail: '',
      aiProvider: 'anthropic',
      aiModel: '',
      aiBaseUrl: '',
      tipsDone: false,
      finishTips: () => set({ tipsDone: true }),
      setAi: (aiProvider, aiModel, aiBaseUrl) =>
        set({ aiProvider, aiModel: aiModel.trim(), aiBaseUrl: aiBaseUrl.trim() }),
      setTheme: (theme) => set({ theme }),
      setGitIdentity: (gitName, gitEmail) =>
        set({ gitName: gitName.trim(), gitEmail: gitEmail.trim() }),
    }),
    { name: 'settings', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
