'use dom';

// A hidden WebView that runs code for the terminal. Python keeps one Web Worker for the whole
// session (Pyodide loads once; pip installs stay); each JavaScript run gets a fresh worker.
// Stop kills the workers, so an endless loop never freezes the app. Nothing is drawn on screen.

import type { DOMProps } from 'expo/dom';
import { useEffect, useRef } from 'react';

import type { BridgeEvent, OutputLine, TerminalCommand } from '../terminal/bridgeTypes';
import { esmUrl, packagesRequired, toCommonJs } from '../terminal/jsModules';
import { WORKER_SOURCE } from './workerSource';

// Python (Pyodide) is downloaded once from the CDN, then the browser cache keeps it.
const PYODIDE_URL = 'https://cdn.jsdelivr.net/pyodide/v314.0.7/full/';
const MAX_LINES = 5000; // an endless print loop would otherwise flood and freeze the screen

// Code you run gets the web only. This WebView may read device files (file://, content://), and
// the worker's fetch guard can't catch import(), so the page refuses every other kind of address.
// Workers made from blob: URLs inherit this policy. Set once, before the first worker starts.
const policy = document.createElement('meta');
policy.httpEquiv = 'Content-Security-Policy';
policy.content =
  "script-src http: https: blob: data: 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval'; " +
  'connect-src http: https: ws: wss: blob: data:';
document.head.append(policy);

type Props = {
  command: TerminalCommand | null; // the latest command; a new id means a new one
  onEvent: (event: BridgeEvent) => Promise<void>;
  dom?: DOMProps;
};

export default function Runner({ command, onEvent }: Props) {
  const python = useRef<Worker | null>(null);
  const js = useRef<Worker | null>(null);
  const running = useRef<'python' | 'js' | null>(null);
  const pending = useRef<OutputLine[]>([]);
  const printed = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const emitRef = useRef(onEvent);
  useEffect(() => {
    emitRef.current = onEvent;
  });

  useEffect(() => {
    const emit = (event: BridgeEvent) => emitRef.current(event);

    // Output goes out in batches every 50 ms: one bridge call per line would be slow.
    const flush = () => {
      clearTimeout(timer.current);
      timer.current = undefined;
      if (pending.current.length === 0) return;
      emit({ type: 'output', lines: pending.current });
      pending.current = [];
    };
    const finish = (ok: boolean, more = false) => {
      flush();
      running.current = null;
      emit({ type: 'done', ok, more });
    };
    const stopAll = () => {
      js.current?.terminate();
      python.current?.terminate();
      js.current = python.current = null;
    };
    const out = (stream: OutputLine['stream'], text: string) => {
      printed.current += 1;
      if (printed.current > MAX_LINES) return;
      pending.current.push({ stream, text: text.slice(0, 10_000) });
      if (printed.current === MAX_LINES) {
        pending.current.push({ stream: 'info', text: `Stopped: more than ${MAX_LINES} lines.` });
        stopAll();
        return finish(false);
      }
      timer.current ??= setTimeout(flush, 50);
    };
    const start = (kind: 'python' | 'js') => {
      const url = URL.createObjectURL(new Blob([WORKER_SOURCE], { type: 'text/javascript' }));
      const worker = new Worker(url, { type: 'module' });
      worker.onmessage = ({ data }) => {
        if (data.type === 'out') out(data.stream, String(data.text));
        else if (data.type === 'session') emit({ type: 'session', jspi: data.jspi });
        else if (data.type === 'ask') {
          flush();
          emit({ type: 'ask', prompt: String(data.prompt) });
        } else if (data.type === 'done') {
          if (kind === 'js') {
            worker.terminate();
            js.current = null;
          }
          finish(data.ok, data.more);
        }
      };
      worker.onerror = (event) => {
        out('stderr', event.message);
        finish(false);
      };
      return worker;
    };

    if (!command) return;
    if (command.type === 'stop') {
      stopAll();
      if (running.current) finish(false);
    } else if (command.type === 'input') {
      (running.current === 'js' ? js.current : python.current)?.postMessage(command);
    } else if (command.type === 'run-js') {
      printed.current = 0;
      js.current?.terminate();
      try {
        const files: Record<string, string> = {};
        for (const [path, code] of Object.entries(command.files)) {
          files[path] = toCommonJs(code, path.endsWith('.ts'));
        }
        const specs = Object.values(files).flatMap(packagesRequired);
        const modules = Object.fromEntries(specs.map((s) => [s, esmUrl(s, command.deps)]));
        js.current = start('js');
        running.current = 'js';
        js.current.postMessage({ type: 'run-js', file: command.file, files, modules });
      } catch (error) {
        out('stderr', String(error)); // a syntax error the TypeScript/import step found
        finish(false);
      }
    } else {
      printed.current = 0;
      python.current ??= start('python');
      running.current = 'python';
      python.current.postMessage({ ...command, pyodideUrl: PYODIDE_URL });
    }
    emit({ type: 'handled', id: command.id });
    // Props arrive as fresh copies on every re-render (they cross the bridge as JSON), so only
    // a new command id may act, never a new object with the same id.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [command?.id]);

  // Leaving the project ends the session.
  useEffect(
    () => () => {
      js.current?.terminate();
      python.current?.terminate();
    },
    [],
  );

  return null;
}
