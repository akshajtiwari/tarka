import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { clampFont } from './fontLimits';

type EditorSettings = {
  fontSize: number;
  wrap: boolean;
  readOnly: boolean;
  setFontSize: (size: number) => void;
  toggleWrap: () => void;
  toggleReadOnly: () => void;
};

export const useEditorSettings = create<EditorSettings>()(
  persist(
    (set) => ({
      fontSize: 14,
      wrap: true,
      readOnly: false,
      setFontSize: (size) => set({ fontSize: clampFont(size) }),
      toggleWrap: () => set((s) => ({ wrap: !s.wrap })),
      toggleReadOnly: () => set((s) => ({ readOnly: !s.readOnly })),
    }),
    { name: 'editor-settings', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
