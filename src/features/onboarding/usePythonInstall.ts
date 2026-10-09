import { useEffect, useState } from 'react';

import { useTerminalStore } from '../terminal/terminalStore';

export type InstallStatus = 'installing' | 'ready' | 'failed';

const SLOW_MS = 60_000; // after this, "Try again" is offered even while it still downloads

// Downloads and starts Python (Pyodide, about 10 MB) through the hidden runner, so the WebView
// caches it and projects can use Python offline later. Starts as soon as setup opens.
export function usePythonInstall() {
  const [ready, setReady] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [slowAttempt, setSlowAttempt] = useState(-1);
  const started = useTerminalStore((s) => s.projectId === 'setup');
  const mode = useTerminalStore((s) => s.mode);

  useEffect(() => {
    const terminal = useTerminalStore.getState();
    // Trying again replaces the old Python: a download that broke halfway can hang forever.
    if (attempt > 0) terminal.send({ type: 'stop' });
    terminal.enterProject('setup');
    terminal.send({ type: 'repl', line: 'import sys', requirements: [] }, () => setReady(true));
    const timer = setTimeout(() => setSlowAttempt(attempt), SLOW_MS);
    return () => clearTimeout(timer);
  }, [attempt]);

  // Back to the shell without success (e.g. no internet) means it failed: offer to try again.
  let status: InstallStatus = 'installing';
  if (ready) status = 'ready';
  else if (started && mode === 'shell') status = 'failed';
  return { status, slow: slowAttempt === attempt, retry: () => setAttempt((a) => a + 1) };
}
