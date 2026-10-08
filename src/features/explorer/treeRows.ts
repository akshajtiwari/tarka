import type { Entry } from '../../lib/projectFs';

export type TreeRow = {
  path: string; // relative to the project root, e.g. "src/main.js"
  name: string;
  isDir: boolean;
  depth: number; // 0 for top-level entries
};

// Turns the folder structure into a flat list of visible rows.
// Children of a folder are only listed when that folder is expanded.
export function buildRows(
  list: (relPath: string) => Entry[],
  expanded: Set<string>,
  relPath = '',
  depth = 0,
): TreeRow[] {
  const rows: TreeRow[] = [];
  for (const entry of list(relPath)) {
    const path = relPath ? `${relPath}/${entry.name}` : entry.name;
    rows.push({ path, name: entry.name, isDir: entry.isDir, depth });
    if (entry.isDir && expanded.has(path)) {
      rows.push(...buildRows(list, expanded, path, depth + 1));
    }
  }
  return rows;
}
