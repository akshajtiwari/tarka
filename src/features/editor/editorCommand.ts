// Actions the native side sends into the editor WebView.
export type EditorAction =
  | { name: 'insert'; text: string }
  | { name: 'move'; by: number } // characters
  | { name: 'moveLines'; by: number }
  | { name: 'undo' }
  | { name: 'redo' }
  | { name: 'accept'; index: number }; // tap on a suggestion chip

// `id` goes up by one every time, so pressing the same key twice is two commands.
export type EditorCommand = EditorAction & { id: number };
