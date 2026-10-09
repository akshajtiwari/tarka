import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemeChoice = 'system' | 'dark' | 'light';
export type AiProvider = 'anthropic' | 'gemini' | 'openai';
// Where new projects go: Documents/TARKA (visible to file managers and Termux) or inside the app.
export type ProjectsLocation = 'documents' | 'app';

// App-wide settings saved between launches. Secrets (git token) live in secure storage instead.
type Settings = {
  theme: ThemeChoice;
  gitName: string;
  gitEmail: string;
  aiProvider: AiProvider;
  aiModels: Partial<Record<AiProvider, string>>; // per provider; empty = its default
  aiBaseUrl: string; // only for OpenAI-compatible servers (Ollama, OpenRouter, ...)
  projectsLocation: ProjectsLocation;
  setProjectsLocation: (location: ProjectsLocation) => void;
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
      aiModels: {},
      aiBaseUrl: '',
      projectsLocation: 'app',
      setProjectsLocation: (projectsLocation) => set({ projectsLocation }),
      tipsDone: false,
      finishTips: () => set({ tipsDone: true }),
      setAi: (aiProvider, model, aiBaseUrl) =>
        set((s) => ({
          aiProvider,
          aiModels: { ...s.aiModels, [aiProvider]: model.trim() },
          aiBaseUrl: aiBaseUrl.trim(),
        })),
      setTheme: (theme) => set({ theme }),
      setGitIdentity: (gitName, gitEmail) =>
        set({ gitName: gitName.trim(), gitEmail: gitEmail.trim() }),
    }),
    {
      name: 'settings',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      migrate: (saved, version) => migrateSettings(saved as Record<string, unknown>, version),
    },
  ),
);

// Version 0 kept one model for every provider; version 1 keeps one per provider.
export function migrateSettings(saved: Record<string, unknown>, version: number) {
  if (version >= 1) return saved as unknown as Settings;
  const { aiModel, ...rest } = saved;
  const provider = (saved.aiProvider as AiProvider) ?? 'anthropic';
  return { ...rest, aiModels: aiModel ? { [provider]: aiModel } : {} } as unknown as Settings;
}
