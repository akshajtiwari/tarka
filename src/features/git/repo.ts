import { folderPath, projectDir } from '../projects/projectFolder';

// git works with plain absolute paths, e.g. "/storage/emulated/0/Documents/TARKA/demo".
export function repoDir(projectId: string): string {
  return folderPath(projectDir(projectId));
}
