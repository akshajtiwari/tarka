// What Termux already has: after the first full copy, only files that changed are sent again.
// Kept in memory, so the first `termux` command after starting TARKA sends everything.
// shortcut: files deleted in TARKA stay in the Termux copy (remove them with `termux rm <file>`);
// delete removed files during the copy if stale files start to confuse builds.

export type FileStamp = Record<string, string>; // path -> "size:modified"

const sent = new Map<string, FileStamp>(); // per project

export function changedFiles(projectId: string, now: FileStamp): string[] {
  const before = sent.get(projectId) ?? {};
  return Object.keys(now).filter((path) => before[path] !== now[path]);
}

export function rememberSent(projectId: string, stamps: FileStamp) {
  sent.set(projectId, { ...sent.get(projectId), ...stamps });
}

export function forgetSent(projectId: string) {
  sent.delete(projectId);
}
