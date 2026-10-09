import { getGitToken } from '../../lib/secure';
import { reloadOpenTabs, saveAllDirty } from '../editor/fileActions';
import { useSettings } from '../settings/settingsStore';
import { useWorkspaceStore } from '../workspace/workspaceStore';
import * as gitService from './gitService';
import { gitFs } from '../../lib/gitFs';
import { repoDir } from './repo';

// Push and pull for the Git tab. Both use the token from Settings when there is one.

export async function pushProject(projectId: string): Promise<string> {
  const dir = repoDir(projectId);
  await gitService.assertHasRemote(gitFs, dir);
  await gitService.push(gitFs, dir, await getGitToken());
  return 'Your commits were pushed.';
}

// Pull changes files on disk: open files are saved first, the work tree must be clean
// (otherwise the pull could undo other people's changes), and tabs are reloaded after.
export async function pullProject(projectId: string): Promise<string> {
  const dir = repoDir(projectId);
  const { gitName, gitEmail } = useSettings.getState();
  if (!gitName || !gitEmail) throw new Error('Add your name and email in Settings first.');
  const saveErrors = saveAllDirty(projectId);
  if (saveErrors.length > 0) throw new Error(saveErrors.join('\n'));
  await gitService.assertHasRemote(gitFs, dir);
  await gitService.assertClean(gitFs, dir);
  await gitService.pull(gitFs, dir, { name: gitName, email: gitEmail }, await getGitToken());
  reloadOpenTabs(projectId);
  useWorkspaceStore.getState().refreshTree();
  return 'You have the latest changes.';
}
