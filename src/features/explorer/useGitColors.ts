import type { ChangeKind } from '../git/changes';
import { useGitSnapshot } from '../git/gitStatusStore';

const NONE: Record<string, ChangeKind> = {};

// Git state of each changed file ("src/a.js" -> "modified"), for coloring explorer rows.
// `active` = the explorer is fully open; only then is a stale status read again.
export function useGitColors(projectId: string, active: boolean): Record<string, ChangeKind> {
  return useGitSnapshot(projectId, active)?.kinds ?? NONE;
}
