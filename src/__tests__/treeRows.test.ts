import { buildRows } from '../features/explorer/treeRows';
import type { Entry } from '../lib/projectFs';

const folders: Record<string, Entry[]> = {
  '': [
    { name: 'src', isDir: true },
    { name: 'README.md', isDir: false },
  ],
  src: [{ name: 'main.js', isDir: false }],
};
const list = (path: string) => folders[path] ?? [];

test('shows only top-level entries when nothing is expanded', () => {
  expect(buildRows(list, new Set()).map((r) => r.path)).toEqual(['src', 'README.md']);
});

test('shows the children of an expanded folder, one level deeper', () => {
  const rows = buildRows(list, new Set(['src']));
  expect(rows.map((r) => [r.path, r.depth])).toEqual([
    ['src', 0],
    ['src/main.js', 1],
    ['README.md', 0],
  ]);
});
