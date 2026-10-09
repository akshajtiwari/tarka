// How a file can be run on the phone, decided by its extension. null = not runnable.
export type RunKind = 'js' | 'ts' | 'py' | 'html';

export function runKindFor(path: string): RunKind | null {
  const ext = path.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'js' || ext === 'mjs' || ext === 'cjs') return 'js';
  if (ext === 'ts') return 'ts';
  if (ext === 'py') return 'py';
  if (ext === 'html' || ext === 'htm') return 'html';
  return null;
}
