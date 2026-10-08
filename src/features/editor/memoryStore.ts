import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { remember, type UsageMemory } from '../../lib/usageMemory';

// Words picked from the suggestion chips, remembered across launches.
type MemoryState = {
  words: UsageMemory;
  useWord: (word: string) => void;
};

export const useMemoryStore = create<MemoryState>()(
  persist(
    (set) => ({
      words: {},
      useWord: (word) => set((state) => ({ words: remember(state.words, word) })),
    }),
    { name: 'editor-memory', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
