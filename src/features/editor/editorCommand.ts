import { create } from 'zustand';

// Actions the native side sends into the editor WebView.
export type EditorAction =
  | { name: 'insert'; text: string }
  | { name: 'move'; by: number } // characters
  | { name: 'moveLines'; by: number }
  | { name: 'undo' }
  | { name: 'redo' }
  | { name: 'accept'; index: number } // tap on a suggestion chip
  | { name: 'find' }
  | { name: 'gotoLine' } // asks for a line number
  | { name: 'jumpTo'; line: number }; // e.g. from a search result

// `id` goes up by one every time, so pressing the same key twice is two commands.
export type EditorCommand = EditorAction & { id: number };

// The key row, the suggestion chips and the editor menu all send commands through here.
type CommandState = {
  command: EditorCommand | null;
  send: (action: EditorAction) => void;
};

export const useEditorCommands = create<CommandState>()((set) => ({
  command: null,
  send: (action) => set((s) => ({ command: { ...action, id: (s.command?.id ?? 0) + 1 } })),
}));
