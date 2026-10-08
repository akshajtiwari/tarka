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
  renamePath: (oldPath: string, newPath: string) => void;
  closePathsUnder: (path: string) => void;
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
      if (state.activePath !== path) return { files };
      // The closed file was showing, so switch to the last tab (or none).
      return { files, activePath: files.at(-1)?.path ?? null };
    }),

  // A file or folder was renamed: open tabs inside it follow along.
  renamePath: (oldPath, newPath) =>
    set((state) => {
      const rename = (p: string) => (isUnder(p, oldPath) ? newPath + p.slice(oldPath.length) : p);
      return {
        files: state.files.map((f) => ({ ...f, path: rename(f.path) })),
        activePath: state.activePath && rename(state.activePath),
      };
    }),

  // A file or folder was deleted: close its tabs.
  closePathsUnder: (path) =>
    set((state) => {
      const files = state.files.filter((f) => !isUnder(f.path, path));
      const activeGone = state.activePath !== null && isUnder(state.activePath, path);
      if (!activeGone) return { files };
      return { files, activePath: files.at(-1)?.path ?? null };
    }),

  reset: () => set({ files: [], activePath: null }),
}));

// True for the path itself and anything inside it ("src" contains "src/a.js", not "srcx.js").
function isUnder(path: string, folderOrFile: string): boolean {
  return path === folderOrFile || path.startsWith(folderOrFile + '/');
}

export function isDirty(file: OpenFile): boolean {
  return file.text !== file.savedText;
}
