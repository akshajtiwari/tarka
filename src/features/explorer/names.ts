// Small path helpers for file actions. Paths are relative with "/" between parts.

export function parentOf(path: string): string {
  return path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '';
}

export function joinPath(folder: string, name: string): string {
  return folder ? `${folder}/${name}` : name;
}

// A name the user typed must be a single, plain file or folder name.
export function nameProblem(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return 'Type a name.';
  if (trimmed.includes('/')) return 'A name cannot contain "/".';
  if (trimmed === '.' || trimmed === '..') return 'That name is reserved.';
  return null;
}

// "main.py" -> "main copy.py", then "main copy 2.py", ... until the name is free.
export function copyName(name: string, taken: string[]): string {
  const dot = name.lastIndexOf('.');
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : '';
  let candidate = `${base} copy${ext}`;
  let n = 2;
  while (taken.includes(candidate)) {
    candidate = `${base} copy ${n}${ext}`;
    n++;
  }
  return candidate;
}
