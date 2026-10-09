import { runKindFor } from './runKind';

const FAVORITES = ['main.py', 'main.js', 'main.ts', 'index.html'];

// What the Run tab runs: the open file if it can run, otherwise a usual entry file
// from the project root (main.py, main.js, ...), otherwise the first runnable file.
export function pickRunTarget(activePath: string | null, rootFiles: string[]): string | null {
  if (activePath && runKindFor(activePath)) return activePath;
  const favorite = FAVORITES.find((name) => rootFiles.includes(name));
  if (favorite) return favorite;
  return rootFiles.find((name) => runKindFor(name) !== null) ?? null;
}
