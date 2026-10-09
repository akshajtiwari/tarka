import { useIsFocused } from 'expo-router';

import type { Change } from './changes';
import { useGitSnapshot, useGitStatusStore } from './gitStatusStore';

const NONE: Change[] = [];

// After a git action: read now, without waiting.
function refresh() {
  const store = useGitStatusStore.getState();
  store.markStale();
  return store.refresh();
}

// The Git tab's view of the shared git status: shown at once from the last read, and read
// again in the background while the tab is on screen and something changed.
export function useGitStatus(projectId: string) {
  const snap = useGitSnapshot(projectId, useIsFocused());
  const error = useGitStatusStore((s) => s.error);

  return {
    loading: !snap,
    isRepo: snap?.isRepo ?? false,
    branch: snap?.branch ?? null,
    staged: snap?.staged ?? NONE,
    unstaged: snap?.unstaged ?? NONE,
    error,
    refresh,
  };
}
