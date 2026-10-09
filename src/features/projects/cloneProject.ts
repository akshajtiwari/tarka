import { getGitToken } from '../../lib/secure';
import * as gitService from '../git/gitService';
import { gitFs } from '../../lib/gitFs';
import { repoDir } from '../git/repo';
import { deleteProjectFolder, existingProjectFolders } from './projectFolder';
import { makeProjectId } from './projectId';
import { useProjectStore } from './projectStore';

// "https://github.com/user/my-app.git" -> "my-app"
export function nameFromUrl(url: string): string {
  const last = url.trim().replace(/\/+$/, '').split('/').pop() ?? '';
  return last.replace(/\.git$/, '');
}

// Clones a repository into a new project and adds it to the list. Returns the project id.
export async function cloneProject(url: string, name: string): Promise<string> {
  const { projects, addProject } = useProjectStore.getState();
  const id = makeProjectId(name, [...projects.map((p) => p.id), ...existingProjectFolders()]);
  try {
    await gitService.clone(gitFs, repoDir(id), url.trim(), await getGitToken());
  } catch (e) {
    deleteProjectFolder(id); // don't leave half a clone behind
    throw e;
  }
  const now = Date.now();
  addProject({ id, name: name.trim() || id, createdAt: now, openedAt: now });
  return id;
}
