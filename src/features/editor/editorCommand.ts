// Actions the native side sends into the editor WebView.
// `id` goes up by one every time, so pressing the same key twice is two commands.
export type EditorCommand =
  | { id: number; name: 'insert'; text: string }
  | { id: number; name: 'move'; by: number }
  | { id: number; name: 'undo' }
  | { id: number; name: 'redo' };
