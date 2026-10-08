import type { Entry } from './projectFs';

// Folders we never look inside: they are huge and not the user's own code.
const SKIP = new Set(['.git', 'node_modules']);

// Every file path in the project, e.g. ["README.md", "src/main.js"].
export function allFilePaths(list: (relPath: string) => Entry[], relPath = ''): string[] {
  const paths: string[] = [];
  for (const entry of list(relPath)) {
    const path = relPath ? `${relPath}/${entry.name}` : entry.name;
    if (!entry.isDir) paths.push(path);
    else if (!SKIP.has(entry.name)) paths.push(...allFilePaths(list, path));
  }
  return paths;
}
