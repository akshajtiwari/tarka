import { listEntries, readForSearch } from '../../lib/projectFs';
import { allFilePaths } from '../../lib/walk';

const MAX_TOTAL = 4 * 1024 * 1024; // a run gets at most this much of the project

// The project's text files a run needs (`keep` picks which), as path -> text.
// Binary and very large files are skipped (readForSearch returns null for those).
export function projectFiles(projectId: string, keep: (path: string) => boolean) {
  const files: Record<string, string> = {};
  let total = 0;
  for (const path of allFilePaths((p) => listEntries(projectId, p))) {
    if (!keep(path)) continue;
    const text = readForSearch(projectId, path);
    if (text === null || total + text.length > MAX_TOTAL) continue;
    files[path] = text;
    total += text.length;
  }
  return files;
}
