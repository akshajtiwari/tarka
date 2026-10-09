import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import type { Change } from './changes';
import * as gitService from './gitService';
import { gitFs } from '../../lib/gitFs';
import { repoDir } from './repo';

type GitStatus = {
  loading: boolean;
  isRepo: boolean;
  branch: string | null;
  staged: Change[];
  unstaged: Change[];
  error: string | null;
};

const empty: GitStatus = {
  loading: true,
  isRepo: false,
  branch: null,
  staged: [],
  unstaged: [],
  error: null,
};

// Reads the repo state whenever the Git tab comes into view, and on refresh().
export function useGitStatus(projectId: string) {
  const [status, setStatus] = useState<GitStatus>(empty);

  const refresh = useCallback(async () => {
    const dir = repoDir(projectId);
    try {
      if (!(await gitService.isRepo(gitFs, dir))) {
        setStatus({ ...empty, loading: false });
        return;
      }
      const [changes, branch] = await Promise.all([
        gitService.getChanges(gitFs, dir),
        gitService.currentBranch(gitFs, dir),
      ]);
      setStatus({ loading: false, isRepo: true, branch: branch ?? null, ...changes, error: null });
    } catch (e) {
      setStatus({ ...empty, loading: false, error: String(e) });
    }
  }, [projectId]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return { ...status, refresh };
}
