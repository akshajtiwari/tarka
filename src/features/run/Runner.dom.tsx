'use dom';

// A hidden WebView that runs code. Each run gets a fresh Web Worker, which is killed when
// the run ends, times out or is stopped. Nothing is drawn on screen.

import type { DOMProps } from 'expo/dom';
import { useEffect, useRef } from 'react';
import { transform } from 'sucrase';

import { PYODIDE_URL, type RunJob, type RunResult } from './runJob';
import { WORKER_SOURCE } from './workerSource';

type Props = {
  job: RunJob | null;
  stopId: number; // goes up when the user taps Stop
  onOutput: (stream: string, text: string) => Promise<void>;
  onDone: (result: RunResult, ms: number) => Promise<void>;
  dom?: DOMProps;
};

const TIME_LIMIT = { js: 10_000, ts: 10_000, py: 60_000, html: 0 }; // Python includes download time

export default function Runner({ job, stopId, onOutput, onDone }: Props) {
  const stop = useRef<() => void>(() => {});

  useEffect(() => {
    if (!job) return;
    const started = Date.now();
    const url = URL.createObjectURL(new Blob([WORKER_SOURCE], { type: 'text/javascript' }));
    const worker = new Worker(url, { type: 'module' });
    let finished = false;

    const finish = (result: RunResult) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      onDone(result, Date.now() - started);
      if (result === 'ok')
        setTimeout(() => worker.terminate(), 1500); // let late async logs arrive
      else worker.terminate();
    };
    const timer = setTimeout(() => finish('timeout'), TIME_LIMIT[job.kind]);
    stop.current = () => finish('stopped');

    worker.onmessage = ({ data }) => {
      if (data.type === 'out') onOutput(data.stream, data.text);
      else finish(data.ok ? 'ok' : 'error');
    };
    worker.onerror = (event) => {
      onOutput('stderr', event.message);
      finish('error');
    };

    let code = job.code;
    if (job.kind === 'ts') {
      try {
        code = transform(code, { transforms: ['typescript'] }).code; // strip the types
      } catch (error) {
        onOutput('stderr', String(error));
        finish('error');
      }
    }
    if (!finished)
      worker.postMessage({ kind: job.kind, code, stdin: job.stdin, pyodideUrl: PYODIDE_URL });

    return () => {
      clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(url);
    };
    // Props arrive as fresh copies on every re-render (they cross the bridge as JSON),
    // so only a new job id may start a new run, never a new object with the same id.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job?.id]);

  useEffect(() => {
    if (stopId > 0) stop.current();
  }, [stopId]);

  return null;
}
