import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { remember, type UsageMemory } from '../../lib/usageMemory';

// Commands typed in the terminal, remembered across launches (shown as quick chips).
type HistoryState = {
  commands: UsageMemory;
  add: (command: string) => void;
};

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      commands: {},
      add: (command) => set((s) => ({ commands: remember(s.commands, command) })),
    }),
    { name: 'terminal-history', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
