import type { RunKind } from './runKind';

// One "press Run": what to run and the text to feed to input().
export type RunJob = { id: number; kind: RunKind; code: string; stdin: string };

export type OutputLine = { stream: 'stdout' | 'stderr' | 'info'; text: string };

export type RunResult = 'ok' | 'error' | 'timeout' | 'stopped';

// Python (Pyodide) is downloaded once from the CDN, then the browser cache keeps it.
export const PYODIDE_URL = 'https://cdn.jsdelivr.net/pyodide/v314.0.7/full/';
