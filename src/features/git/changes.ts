// Turns isomorphic-git's statusMatrix rows into two simple lists: staged and unstaged changes.
// A row is [path, head, workdir, stage]:
//   head:    0 = not in the last commit, 1 = in it
//   workdir: 0 = deleted, 1 = same as last commit, 2 = changed
//   stage:   0 = not staged, 1 = same as last commit, 2 = same as the file, 3 = different from both

export type ChangeKind = 'added' | 'modified' | 'deleted' | 'untracked';
export type Change = { path: string; kind: ChangeKind };
export type StatusRow = [string, number, number, number];

export function stagedChanges(rows: StatusRow[]): Change[] {
  const changes: Change[] = [];
  for (const [path, head, , stage] of rows) {
    if (head === 0 && stage >= 2) changes.push({ path, kind: 'added' });
    else if (head === 1 && stage === 0) changes.push({ path, kind: 'deleted' });
    else if (head === 1 && stage >= 2) changes.push({ path, kind: 'modified' });
  }
  return changes;
}

export function unstagedChanges(rows: StatusRow[]): Change[] {
  const changes: Change[] = [];
  for (const [path, head, workdir, stage] of rows) {
    if (workdir === 0 && stage !== 0) changes.push({ path, kind: 'deleted' });
    else if (head === 0 && stage === 0 && workdir === 2) changes.push({ path, kind: 'untracked' });
    else if (workdir === 2 && (stage === 1 || stage === 3))
      changes.push({ path, kind: 'modified' });
  }
  return changes;
}
