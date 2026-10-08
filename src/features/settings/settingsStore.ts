import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemeChoice = 'system' | 'dark' | 'light';

// App-wide settings saved between launches. Secrets (git token) live in secure storage instead.
type Settings = {
  theme: ThemeChoice;
  gitName: string;
  gitEmail: string;
  setTheme: (theme: ThemeChoice) => void;
  setGitIdentity: (name: string, email: string) => void;
};

export const useSettings = create<Settings>()(
  persist(
    (set) => ({
      theme: 'system',
      gitName: '',
      gitEmail: '',
      setTheme: (theme) => set({ theme }),
      setGitIdentity: (gitName, gitEmail) =>
        set({ gitName: gitName.trim(), gitEmail: gitEmail.trim() }),
    }),
    { name: 'settings', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
