import { dirAt, fileAt, listEntries } from '../../lib/projectFs';
import { useEditorStore } from '../editor/editorStore';
import { useWorkspaceStore } from '../workspace/workspaceStore';
import { copyName, joinPath, parentOf } from './names';

// File and folder actions from the explorer. Each one refreshes the tree afterwards
// and keeps open tabs in sync. They throw an Error with a readable message on failure.

function ensureFree(projectId: string, path: string) {
  if (fileAt(projectId, path).exists || dirAt(projectId, path).exists) {
    throw new Error(`"${path}" already exists.`);
  }
}
const refresh = () => useWorkspaceStore.getState().refreshTree();

export function newFile(projectId: string, folder: string, name: string): string {
  const path = joinPath(folder, name.trim());
  ensureFree(projectId, path);
  fileAt(projectId, path).create();
  refresh();
  return path;
}

export function newFolder(projectId: string, folder: string, name: string): string {
  const path = joinPath(folder, name.trim());
  ensureFree(projectId, path);
  dirAt(projectId, path).create();
  refresh();
  return path;
}

export function renameEntry(projectId: string, path: string, isDir: boolean, newName: string) {
  if (newName.trim() === path.split('/').pop()) return; // name unchanged: nothing to do
  const newPath = joinPath(parentOf(path), newName.trim());
  ensureFree(projectId, newPath);
  if (isDir) dirAt(projectId, path).rename(newName.trim());
  else fileAt(projectId, path).rename(newName.trim());
  useEditorStore.getState().renamePath(path, newPath);
  refresh();
}

export function duplicateFile(projectId: string, path: string): string {
  const folder = parentOf(path);
  const taken = listEntries(projectId, folder).map((e) => e.name);
  const copyPath = joinPath(folder, copyName(path.split('/').pop()!, taken));
  // copySync: copy() is async, and the tree would read the folder before the copy exists.
  fileAt(projectId, path).copySync(fileAt(projectId, copyPath));
  refresh();
  return copyPath;
}

export function deleteEntry(projectId: string, path: string, isDir: boolean) {
  if (isDir) dirAt(projectId, path).delete();
  else fileAt(projectId, path).delete();
  useEditorStore.getState().closePathsUnder(path);
  refresh();
}
