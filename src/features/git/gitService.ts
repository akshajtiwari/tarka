import * as git from 'isomorphic-git';

import { stagedChanges, unstagedChanges, type Change, type StatusRow } from './changes';
import { cacheFor, dropCacheIfFails } from './gitCache';

// All git work goes through these small functions. They take `fs` as a parameter so the app
// passes its expo-file-system adapter and the tests pass Node's real `fs`.
// `dir` is the repo folder, e.g. "/projects/demo". Clone, pull and push are in gitRemote.ts.

export type Fs = Parameters<typeof git.init>[0]['fs'];
export type Author = { name: string; email: string };

export async function isRepo(fs: Fs, dir: string): Promise<boolean> {
  try {
    await git.resolveRef({ fs, dir, ref: 'HEAD' });
    return true;
  } catch {
    // A brand-new repo has no commit yet, so HEAD does not resolve. Look for .git instead.
    return git.findRoot({ fs, filepath: dir }).then(
      (root) => root === dir,
      () => false,
    );
  }
}

export function initRepo(fs: Fs, dir: string) {
  return git.init({ fs, dir, defaultBranch: 'main' });
}

export async function getChanges(
  fs: Fs,
  dir: string,
): Promise<{ staged: Change[]; unstaged: Change[] }> {
  const rows = (await git.statusMatrix({ fs, dir, cache: cacheFor(dir) })) as StatusRow[];
  return { staged: stagedChanges(rows), unstaged: unstagedChanges(rows) };
}

// Switching branch or pulling would overwrite staged work without asking, so both
// refuse while there is anything uncommitted. New files that were never staged are fine.
export async function assertClean(fs: Fs, dir: string) {
  const { staged, unstaged } = await getChanges(fs, dir);
  if (staged.length > 0 || unstaged.some((c) => c.kind !== 'untracked')) {
    throw new Error('Commit your changes first (or undo them), then try again.');
  }
}

export async function stageAll(fs: Fs, dir: string, changes: Change[]) {
  const deleted = changes.filter((c) => c.kind === 'deleted').map((c) => c.path);
  const others = changes.filter((c) => c.kind !== 'deleted').map((c) => c.path);
  if (others.length > 0) await git.add({ fs, dir, filepath: others, cache: cacheFor(dir) }); // one index write for all
  for (const path of deleted) await git.remove({ fs, dir, filepath: path, cache: cacheFor(dir) });
}

// Staging a deleted file means removing it from the index.
export function stage(fs: Fs, dir: string, change: Change) {
  const cache = cacheFor(dir);
  if (change.kind === 'deleted') return git.remove({ fs, dir, filepath: change.path, cache });
  return git.add({ fs, dir, filepath: change.path, cache });
}

export function unstage(fs: Fs, dir: string, path: string) {
  return git.resetIndex({ fs, dir, filepath: path, cache: cacheFor(dir) });
}

export function commit(fs: Fs, dir: string, message: string, author: Author) {
  return git.commit({ fs, dir, message, author, cache: cacheFor(dir) });
}

export async function history(fs: Fs, dir: string, depth = 50) {
  const commits = await git.log({ fs, dir, depth, cache: cacheFor(dir) });
  return commits.map((c) => ({
    oid: c.oid,
    message: c.commit.message.trim(),
    author: c.commit.author.name,
    time: c.commit.author.timestamp * 1000,
  }));
}

// What one commit changed, compared with its first parent. The first commit adds every file.
// `files` is null when the parent was never downloaded (we clone with depth 1).
export async function commitDetail(fs: Fs, dir: string, oid: string) {
  const cache = cacheFor(dir);
  const { commit } = await git.readCommit({ fs, dir, oid, cache });
  const parent: string | undefined = commit.parent[0];
  const info = {
    message: commit.message.trim(),
    author: commit.author.name,
    time: commit.author.timestamp * 1000,
    parent,
  };
  if (parent && !(await git.readCommit({ fs, dir, oid: parent, cache }).catch(() => null))) {
    return { ...info, files: null };
  }
  const trees = parent
    ? [git.TREE({ ref: parent }), git.TREE({ ref: oid })]
    : [git.TREE({ ref: oid })];
  const files: Change[] = await git.walk({
    fs,
    dir,
    cache,
    trees,
    map: async (path, entries) => {
      const [before, after] = parent ? entries : [null, entries[0]];
      if (path === '.') return undefined;
      if ((await before?.oid()) === (await after?.oid())) return null; // same: skip it and its insides
      if ((await before?.type()) === 'tree' || (await after?.type()) === 'tree') return undefined;
      if (!before) return { path, kind: 'added' };
      if (!after) return { path, kind: 'deleted' };
      return { path, kind: 'modified' };
    },
  });
  return { ...info, files: files.sort((a, b) => a.path.localeCompare(b.path)) };
}

export function currentBranch(fs: Fs, dir: string) {
  return git.currentBranch({ fs, dir });
}

export function listBranches(fs: Fs, dir: string) {
  return git.listBranches({ fs, dir });
}

export function createBranch(fs: Fs, dir: string, name: string) {
  return git.branch({ fs, dir, ref: name, checkout: true });
}

export function switchBranch(fs: Fs, dir: string, name: string) {
  return dropCacheIfFails(dir, () => git.checkout({ fs, dir, ref: name, cache: cacheFor(dir) }));
}

// A file's text in a commit (the last one by default), or "" if it is not there.
export async function committedText(fs: Fs, dir: string, path: string, ref = 'HEAD') {
  try {
    const oid = await git.resolveRef({ fs, dir, ref });
    const { blob } = await git.readBlob({ fs, dir, oid, filepath: path, cache: cacheFor(dir) });
    return new TextDecoder().decode(blob);
  } catch {
    return '';
  }
}
