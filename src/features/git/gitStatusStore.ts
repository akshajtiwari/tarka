import { useEffect } from 'react';
import { create } from 'zustand';

import { gitFs } from '../../lib/gitFs';
import type { Change, ChangeKind } from './changes';
import * as gitService from './gitService';
import { repoDir } from './repo';

// One shared picture of the open project's git state, for the Git tab and the explorer colors.
// Reading it is slow on a phone (it checks every file), so it is read only when someone is
// looking and something changed ("stale"), and the old picture stays on screen meanwhile.

export type GitSnapshot = {
  isRepo: boolean;
  branch: string | null;
  staged: Change[];
  unstaged: Change[];
  kinds: Record<string, ChangeKind>; // "src/a.js" -> "modified", for coloring explorer rows
};

type GitStatusState = {
  projectId: string | null;
  snap: GitSnapshot | null; // null until the first read finishes
  stale: boolean;
  error: string | null;
  enterProject: (projectId: string) => void;
  markStale: () => void;
  refresh: (projectId: string) => Promise<void>;
};

async function readSnapshot(projectId: string): Promise<GitSnapshot> {
  const dir = repoDir(projectId);
  if (!(await gitService.isRepo(gitFs, dir))) {
    return { isRepo: false, branch: null, staged: [], unstaged: [], kinds: {} };
  }
  const [{ staged, unstaged }, branch] = await Promise.all([
    gitService.getChanges(gitFs, dir),
    gitService.currentBranch(gitFs, dir),
  ]);
  const kinds: Record<string, ChangeKind> = {};
  for (const change of [...staged, ...unstaged]) kinds[change.path] = change.kind;
  return { isRepo: true, branch: branch ?? null, staged, unstaged, kinds };
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

// One read at a time. A refresh asked for during a read runs once more right after it.
let running: Promise<void> | null = null;
let again = false;

export const useGitStatusStore = create<GitStatusState>()((set, get) => ({
  projectId: null,
  snap: null,
  stale: true,
  error: null,
  enterProject: (projectId) => {
    if (get().projectId !== projectId) set({ projectId, snap: null, stale: true, error: null });
  },
  markStale: () => set({ stale: true }),
  refresh: (projectId) => {
    if (running) {
      again = true;
      return running;
    }
    running = (async () => {
      do {
        again = false;
        set({ stale: false }); // a change from now on marks it stale again
        try {
          const snap = await readSnapshot(projectId);
          if (get().projectId !== projectId) return; // the user left this project meanwhile
          // Unchanged parts keep their old objects, so rows that use them don't redraw.
          const old = get().snap;
          if (old && same(old.kinds, snap.kinds)) snap.kinds = old.kinds;
          set({ snap: old && same(old, snap) ? old : snap, error: null });
        } catch (e) {
          set({ error: e instanceof Error ? e.message : String(e) });
        }
      } while (again);
    })().finally(() => {
      running = null;
    });
    return running;
  },
}));

// The snapshot for this project, refreshed shortly after it becomes stale while `active`
// (explorer fully open, Git tab on screen).
export function useGitSnapshot(projectId: string, active: boolean) {
  const snap = useGitStatusStore((s) => (s.projectId === projectId ? s.snap : null));
  const stale = useGitStatusStore((s) => s.stale);

  useEffect(() => {
    if (!active || !stale) return;
    const timer = setTimeout(() => useGitStatusStore.getState().refresh(projectId), 300);
    return () => clearTimeout(timer);
  }, [projectId, active, stale]);

  return snap;
}
