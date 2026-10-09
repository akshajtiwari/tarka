import { useEffect, useState } from 'react';

import type { ChangeKind } from '../git/changes';
import * as gitService from '../git/gitService';
import { gitFs } from '../../lib/gitFs';
import { repoDir } from '../git/repo';
import { useWorkspaceStore } from '../workspace/workspaceStore';

// Git state of each changed file ("src/a.js" -> "modified"), for coloring explorer rows.
// Read again whenever the explorer opens or files change. Not a repo = no colors.
export function useGitColors(projectId: string): Record<string, ChangeKind> {
  const explorerOpen = useWorkspaceStore((s) => s.explorerOpen);
  const treeVersion = useWorkspaceStore((s) => s.treeVersion);
  const [kinds, setKinds] = useState<Record<string, ChangeKind>>({});

  useEffect(() => {
    if (!explorerOpen) return;
    const dir = repoDir(projectId);
    gitService
      .isRepo(gitFs, dir)
      .then((repo) => (repo ? gitService.getChanges(gitFs, dir) : { staged: [], unstaged: [] }))
      .then(({ staged, unstaged }) => {
        const next: Record<string, ChangeKind> = {};
        for (const change of [...staged, ...unstaged]) next[change.path] = change.kind;
        setKinds(next);
      })
      .catch(() => setKinds({}));
  }, [projectId, explorerOpen, treeVersion]);

  return kinds;
}
