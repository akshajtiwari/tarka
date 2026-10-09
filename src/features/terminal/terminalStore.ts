import { create } from 'zustand';

import type { BridgeEvent, OutputLine, TerminalCommand } from './bridgeTypes';

// The terminal's screen and state. Commands go to the hidden runner WebView one at a time:
// the next one is handed over when the runner says it took the last ("handled").

export type Mode = 'shell' | 'busy' | 'repl' | 'ask';
type NewCommand = TerminalCommand extends infer C
  ? C extends unknown
    ? Omit<C, 'id'>
    : never
  : never;

const MAX_LINES = 5000; // the screen keeps the newest lines

type TerminalState = {
  projectId: string | null;
  lines: OutputLine[];
  mode: Mode; // shell: commands; busy: a program runs; repl: Python prompt; ask: input() waits
  prompt: string; // shown before the input box
  inRepl: boolean;
  jspi: boolean | null; // can input() pause for typing? (null until Python started)
  preview: string | null; // a web page being shown
  command: TerminalCommand | null; // the one the runner is taking now
  queue: TerminalCommand[];
  nextId: number;
  bridgeOn: boolean; // the runner WebView is mounted once something needs it
  afterSuccess: (() => void) | null; // e.g. save requirements.txt once pip install worked
  enterProject: (projectId: string) => void;
  print: (stream: OutputLine['stream'], text: string) => void;
  clear: () => void;
  send: (command: NewCommand, afterSuccess?: () => void) => void;
  setMode: (mode: Mode) => void;
  enterRepl: () => void;
  leaveRepl: () => void;
  setPreview: (html: string | null) => void;
  onEvent: (event: BridgeEvent) => void;
};

export const appendLines = (old: OutputLine[], added: OutputLine[]) =>
  [...old, ...added].slice(-MAX_LINES);

const shell = { mode: 'shell' as Mode, prompt: '$', inRepl: false };

export const useTerminalStore = create<TerminalState>()((set, get) => ({
  projectId: null,
  lines: [],
  ...shell,
  jspi: null,
  preview: null,
  command: null,
  queue: [],
  nextId: 1,
  bridgeOn: false,
  afterSuccess: null,
  enterProject: (projectId) => {
    if (get().projectId === projectId) return;
    set({
      projectId,
      lines: [],
      ...shell,
      jspi: null,
      preview: null,
      command: null,
      queue: [],
      bridgeOn: false,
    });
  },
  print: (stream, text) => set((s) => ({ lines: appendLines(s.lines, [{ stream, text }]) })),
  clear: () => set({ lines: [] }),
  send: (command, afterSuccess) =>
    set((s) => {
      const next = { ...command, id: s.nextId } as TerminalCommand;
      const busy = command.type !== 'input' && command.type !== 'stop';
      return {
        nextId: s.nextId + 1,
        bridgeOn: true,
        ...(s.command ? { queue: [...s.queue, next] } : { command: next }),
        ...(busy ? { mode: 'busy' as Mode, afterSuccess: afterSuccess ?? null } : {}),
      };
    }),
  setMode: (mode) => set({ mode }),
  enterRepl: () => set({ mode: 'repl', prompt: '>>>', inRepl: true }),
  leaveRepl: () => set(shell),
  setPreview: (preview) => set({ preview }),
  onEvent: (event) => {
    const s = get();
    if (event.type === 'handled') {
      if (s.command?.id === event.id) set({ command: s.queue[0] ?? null, queue: s.queue.slice(1) });
    } else if (event.type === 'output') {
      set({ lines: appendLines(s.lines, event.lines) });
    } else if (event.type === 'ask') {
      set({ mode: 'ask', prompt: event.prompt || '?' });
    } else if (event.type === 'session') {
      set({ jspi: event.jspi });
      if (!event.jspi) {
        s.print(
          'info',
          "This phone's WebView can't pause for input(): type the answers before running, or update Android System WebView.",
        );
      }
    } else if (event.type === 'done') {
      const after = s.afterSuccess;
      set(s.inRepl ? { mode: 'repl', prompt: event.more ? '...' : '>>>' } : shell);
      set({ afterSuccess: null });
      if (event.ok && after) after();
    }
  },
}));
