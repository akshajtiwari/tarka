// git works with absolute paths inside the app's documents folder.
export function repoDir(projectId: string): string {
  return `/projects/${projectId}`;
}
