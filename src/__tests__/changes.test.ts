import { stagedChanges, unstagedChanges, type StatusRow } from '../features/git/changes';

// Rows are [path, head, workdir, stage], as isomorphic-git's statusMatrix returns them.
const rows: StatusRow[] = [
  ['same.js', 1, 1, 1],
  ['new.js', 0, 2, 0],
  ['added.js', 0, 2, 2],
  ['edited.js', 1, 2, 1],
  ['staged.js', 1, 2, 2],
  ['both.js', 1, 2, 3],
  ['gone.js', 1, 0, 1],
  ['removed.js', 1, 0, 0],
];

test('staged changes are what the next commit will contain', () => {
  expect(stagedChanges(rows)).toEqual([
    { path: 'added.js', kind: 'added' },
    { path: 'staged.js', kind: 'modified' },
    { path: 'both.js', kind: 'modified' },
    { path: 'removed.js', kind: 'deleted' },
  ]);
});

test('unstaged changes are edits not yet added', () => {
  expect(unstagedChanges(rows)).toEqual([
    { path: 'new.js', kind: 'untracked' },
    { path: 'edited.js', kind: 'modified' },
    { path: 'both.js', kind: 'modified' },
    { path: 'gone.js', kind: 'deleted' },
  ]);
});
