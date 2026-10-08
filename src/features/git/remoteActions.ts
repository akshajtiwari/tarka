import { getGitToken } from '../../lib/secure';
import { useEditorStore } from '../editor/editorStore';
import { saveAllDirty } from '../editor/fileActions';
import { useSettings } from '../settings/settingsStore';
import { useWorkspaceStore } from '../workspace/workspaceStore';
import * as gitService from './gitService';
import { gitFs, repoDir } from './repo';

// Push and pull for the Git tab. Both use the token from Settings when there is one.

export async function pushProject(projectId: string): Promise<string> {
  await gitService.push(gitFs, repoDir(projectId), await getGitToken());
  return 'Your commits were pushed.';
}

// Pull changes files on disk, so open files are saved first and reopened after.
export async function pullProject(projectId: string): Promise<string> {
  const { gitName, gitEmail } = useSettings.getState();
  if (!gitName || !gitEmail) throw new Error('Add your name and email in Settings first.');
  saveAllDirty(projectId);
  await gitService.pull(
    gitFs,
    repoDir(projectId),
    { name: gitName, email: gitEmail },
    await getGitToken(),
  );
  useEditorStore.getState().reset();
  useWorkspaceStore.getState().refreshTree();
  return 'You have the latest changes.';
}
