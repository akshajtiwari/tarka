import { useCallback, useState } from 'react';

import type { OutputLine, RunJob, RunResult } from './runJob';
import type { RunKind } from './runKind';

// State of the Run tab: the current job, its output and whether it is still running.
export function useRunner() {
  const [job, setJob] = useState<RunJob | null>(null);
  const [lines, setLines] = useState<OutputLine[]>([]);
  const [running, setRunning] = useState(false);
  const [stopId, setStopId] = useState(0);

  function start(kind: RunKind, code: string, stdin: string) {
    setLines([]);
    setRunning(true);
    setJob({ id: Date.now(), kind, code, stdin });
  }

  const onOutput = useCallback(async (stream: string, text: string) => {
    setLines((old) => [...old, { stream: stream as OutputLine['stream'], text }]);
  }, []);

  const onDone = useCallback(async (result: RunResult, ms: number) => {
    const seconds = (ms / 1000).toFixed(1);
    const summary = {
      ok: `Finished in ${seconds} s`,
      error: `Stopped with an error after ${seconds} s`,
      timeout: `Stopped: took longer than the time limit (${seconds} s)`,
      stopped: `Stopped by you after ${seconds} s`,
    }[result];
    setLines((old) => [...old, { stream: 'info', text: summary }]);
    setRunning(false);
  }, []);

  return {
    job,
    lines,
    running,
    stopId,
    start,
    stop: () => setStopId((n) => n + 1),
    onOutput,
    onDone,
  };
}
