import { diffRows } from '../features/git/diffRows';

test('a changed line shows as a removed and an added row with line numbers', () => {
  const rows = diffRows('a\nb\nc\n', 'a\nB\nc\n');
  expect(rows).toEqual([
    { kind: 'gap', text: 'lines 1–3' },
    { kind: 'same', text: 'a', oldNo: 1, newNo: 1 },
    { kind: 'del', text: 'b', oldNo: 2 },
    { kind: 'add', text: 'B', newNo: 2 },
    { kind: 'same', text: 'c', oldNo: 3, newNo: 3 },
  ]);
});

test('a new file is all added lines', () => {
  const rows = diffRows('', 'x\ny\n');
  expect(rows.filter((r) => r.kind === 'add').map((r) => r.text)).toEqual(['x', 'y']);
});

test('no changes means no rows', () => {
  expect(diffRows('same\n', 'same\n')).toEqual([]);
});
