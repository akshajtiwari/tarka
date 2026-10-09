import { useCallback, useEffect, useState } from 'react';

import { useTerminalStore } from '../terminal/terminalStore';

export type InstallStatus = 'installing' | 'ready' | 'failed';

// Downloads and starts Python (Pyodide, about 10 MB) through the hidden runner, so the WebView
// caches it and projects can use Python offline later. Starts as soon as setup opens.
export function usePythonInstall() {
  const [ready, setReady] = useState(false);
  const started = useTerminalStore((s) => s.projectId === 'setup');
  const mode = useTerminalStore((s) => s.mode);

  const start = useCallback(() => {
    const terminal = useTerminalStore.getState();
    terminal.enterProject('setup');
    terminal.send({ type: 'repl', line: 'import sys', requirements: [] }, () => setReady(true));
  }, []);

  useEffect(() => {
    start();
  }, [start]);

  // Back to the shell without success (e.g. no internet) means it failed: offer to try again.
  let status: InstallStatus = 'installing';
  if (ready) status = 'ready';
  else if (started && mode === 'shell') status = 'failed';
  return { status, retry: start };
}
