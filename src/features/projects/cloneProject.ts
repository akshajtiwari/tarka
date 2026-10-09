import type { ProgressCallback } from 'isomorphic-git';

import { gitFs } from '../../lib/gitFs';
import { getGitToken } from '../../lib/secure';
import * as gitRemote from '../git/gitRemote';
import { existingProjectFolders, folderPath, newProjectDir } from './projectFolder';
import { makeProjectId } from './projectId';
import { useProjectStore } from './projectStore';

// "https://github.com/user/my-app.git" -> "my-app"
export function nameFromUrl(url: string): string {
  const last = url.trim().replace(/\/+$/, '').split('/').pop() ?? '';
  return last.replace(/\.git$/, '');
}

// Clones a repository into a new project and adds it to the list. Returns the project id.
export async function cloneProject(
  url: string,
  name: string,
  onProgress?: ProgressCallback,
): Promise<string> {
  const { projects, addProject } = useProjectStore.getState();
  const id = makeProjectId(name, [...projects.map((p) => p.id), ...existingProjectFolders()]);
  const dir = newProjectDir(id);
  try {
    await gitRemote.clone(gitFs, folderPath(dir), url.trim(), await getGitToken(), onProgress);
  } catch (e) {
    if (dir.exists) dir.delete(); // don't leave half a clone behind
    throw e;
  }
  const now = Date.now();
  addProject({ id, name: name.trim() || id, createdAt: now, openedAt: now, root: dir.uri });
  return id;
}
