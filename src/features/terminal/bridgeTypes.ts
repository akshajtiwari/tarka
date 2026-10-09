// Messages between the terminal (native) and the hidden runner WebView (Runner.dom.tsx).

export type OutputStream = 'stdout' | 'stderr' | 'info';
export type OutputLine = { stream: OutputStream | 'echo'; text: string }; // echo = what you typed

// Native -> WebView. `id` goes up by one each time, so the same command twice runs twice.
export type TerminalCommand = { id: number } & (
  | { type: 'run-python'; file: string; files: Record<string, string>; requirements: string[] }
  | { type: 'repl'; line: string; requirements: string[] }
  | { type: 'pip'; action: 'install' | 'list'; packages: string[]; requirements: string[] }
  | { type: 'run-js'; file: string; files: Record<string, string>; deps: Record<string, string> }
  | { type: 'input'; text: string }
  | { type: 'stop' }
);

// WebView -> native.
export type BridgeEvent =
  | { type: 'handled'; id: number }
  | { type: 'output'; lines: OutputLine[] }
  | { type: 'ask'; prompt: string } // the program waits for input()
  | { type: 'done'; ok: boolean; more?: boolean } // more = the REPL waits for the rest of a block
  | { type: 'session'; jspi: boolean }; // Python is ready; jspi = input() can pause for typing
