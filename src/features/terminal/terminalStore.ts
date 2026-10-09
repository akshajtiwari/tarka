import { create } from 'zustand';

import type { BridgeEvent, NewCommand, OutputLine, TerminalCommand } from './bridgeTypes';

// The terminal's screen and state. Commands go to the hidden runner WebView one at a time:
// the next one is handed over when the runner says it took the last ("handled").

export type Mode = 'shell' | 'busy' | 'repl' | 'ask';

const MAX_LINES = 5000; // the screen keeps the newest lines

type TerminalState = {
  projectId: string | null;
  lines: OutputLine[];
  mode: Mode; // shell: commands; busy: a program runs; repl: Python prompt; ask: input() waits
  activity: string | null; // what runs right now, shown while busy ("Running main.py…")
  prompt: string; // shown before the input box
  inRepl: boolean;
  preview: string | null; // a web page being shown
  command: TerminalCommand | null; // the one the runner is taking now
  queue: TerminalCommand[];
  nextId: number;
  runId: number; // the newest run, REPL line or pip command; a "done" from an older one is ignored
  bridgeOn: boolean; // the runner WebView is mounted once something needs it
  afterSuccess: (() => void) | null; // e.g. save requirements.txt once pip install worked
  enterProject: (projectId: string) => void;
  print: (stream: OutputLine['stream'], text: string) => void;
  clear: () => void;
  send: (command: NewCommand, afterSuccess?: () => void) => void;
  setMode: (mode: Mode) => void;
  setActivity: (activity: string | null) => void;
  enterRepl: () => void;
  leaveRepl: () => void;
  setPreview: (html: string | null) => void;
  onEvent: (event: BridgeEvent) => void;
};

export const appendLines = (old: OutputLine[], added: OutputLine[]) =>
  [...old, ...added].slice(-MAX_LINES);

const shell = { mode: 'shell' as Mode, prompt: '$', inRepl: false, activity: null };

export const useTerminalStore = create<TerminalState>()((set, get) => ({
  projectId: null,
  lines: [],
  ...shell,
  preview: null,
  command: null,
  queue: [],
  nextId: 1,
  runId: 0,
  bridgeOn: false,
  afterSuccess: null,
  enterProject: (projectId) => {
    if (get().projectId === projectId) return;
    set({
      projectId,
      lines: [],
      ...shell,
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
        ...(busy
          ? { mode: 'busy' as Mode, runId: next.id, afterSuccess: afterSuccess ?? null }
          : {}),
      };
    }),
  setMode: (mode) => set(mode === 'shell' ? { mode, activity: null } : { mode }),
  setActivity: (activity) => set({ activity }),
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
      if (!event.jspi) {
        s.print(
          'info',
          "This phone's WebView can't pause for input(): type the answers before running, or update Android System WebView.",
        );
      }
    } else if (event.type === 'done') {
      // Run file while a program runs: the stopped program's "done" arrives after the new run
      // started, and must not make the terminal look idle.
      if (event.id !== s.runId) return;
      const after = s.afterSuccess;
      set(s.inRepl ? { mode: 'repl', prompt: event.more ? '...' : '>>>', activity: null } : shell);
      set({ afterSuccess: null });
      if (event.ok && after) after();
    }
  },
}));
