import { create } from 'zustand';

// One open file (a tab). `savedText` is what is on disk; `text` is what is in the editor.
// `locked` files (very large ones) are shown read-only.
export type OpenFile = { path: string; text: string; savedText: string; locked?: boolean };

type EditorState = {
  files: OpenFile[];
  activePath: string | null;
  openFile: (path: string, text: string, locked?: boolean) => void;
  setActive: (path: string) => void;
  updateText: (path: string, text: string) => void;
  markSaved: (path: string, text: string) => void;
  closeFile: (path: string) => void;
  reset: () => void;
};

export const useEditorStore = create<EditorState>()((set) => ({
  files: [],
  activePath: null,

  // Opening a file that is already open just switches to it (keeps unsaved edits).
  openFile: (path, text, locked = false) =>
    set((state) => {
      const alreadyOpen = state.files.some((f) => f.path === path);
      const newFile = { path, text, savedText: text, locked };
      const files = alreadyOpen ? state.files : [...state.files, newFile];
      return { files, activePath: path };
    }),

  setActive: (path) => set({ activePath: path }),

  updateText: (path, text) =>
    set((state) => ({ files: state.files.map((f) => (f.path === path ? { ...f, text } : f)) })),

  markSaved: (path, text) =>
    set((state) => ({
      files: state.files.map((f) => (f.path === path ? { ...f, savedText: text } : f)),
    })),

  closeFile: (path) =>
    set((state) => {
      const files = state.files.filter((f) => f.path !== path);
      const activePath =
        state.activePath === path ? (files.at(-1)?.path ?? null) : state.activePath;
      return { files, activePath };
    }),

  reset: () => set({ files: [], activePath: null }),
}));

export function isDirty(file: OpenFile): boolean {
  return file.text !== file.savedText;
}
