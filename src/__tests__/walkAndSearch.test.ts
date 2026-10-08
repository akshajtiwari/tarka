import type { Entry } from '../lib/projectFs';
import { searchText } from '../lib/textSearch';
import { allFilePaths } from '../lib/walk';

const folders: Record<string, Entry[]> = {
  '': [
    { name: 'src', isDir: true },
    { name: 'node_modules', isDir: true },
    { name: 'README.md', isDir: false },
  ],
  src: [{ name: 'main.js', isDir: false }],
  node_modules: [{ name: 'huge.js', isDir: false }],
};

test('lists every file but skips node_modules', () => {
  expect(allFilePaths((p) => folders[p] ?? [])).toEqual(['src/main.js', 'README.md']);
});

const files: Record<string, string | null> = {
  'a.js': 'const Name = 1;\nconsole.log(name);',
  'b.bin': null,
};

test('finds matching lines with their line numbers', () => {
  const matches = searchText(Object.keys(files), (p) => files[p], 'name', { caseSensitive: false });
  expect(matches).toEqual([
    { path: 'a.js', line: 1, text: 'const Name = 1;' },
    { path: 'a.js', line: 2, text: 'console.log(name);' },
  ]);
});

test('case-sensitive search and the result limit', () => {
  const read = (p: string) => files[p];
  expect(searchText(['a.js'], read, 'Name', { caseSensitive: true })).toHaveLength(1);
  expect(searchText(['a.js'], read, 'name', { caseSensitive: false, limit: 1 })).toHaveLength(1);
});
