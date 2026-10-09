import { fileAt } from '../../lib/projectFs';
import { isDirty, useEditorStore } from './editorStore';
import { openModeFor } from './fileSizeGuard';
import { useGitStatusStore } from '../git/gitStatusStore';

// Reads a file from disk and opens it in a tab. Returns an error message if it could not be opened.
export function openFileFromDisk(projectId: string, path: string): string | null {
  try {
    const file = fileAt(projectId, path);
    const mode = openModeFor(file.size ?? 0);
    if (mode === 'refuse') return `${path} is larger than 10 MB, too big to open on a phone.`;
    useEditorStore.getState().openFile(path, file.textSync(), mode === 'read');
    return null;
  } catch (e) {
    return `Could not open ${path}: ${String(e)}`;
  }
}

// Writes the editor's text to disk. Returns an error message if the write failed.
export function saveFile(projectId: string, path: string): string | null {
  const file = useEditorStore.getState().files.find((f) => f.path === path);
  if (!file) return null;
  try {
    fileAt(projectId, path).write(file.text);
    useEditorStore.getState().markSaved(path, file.text);
    useGitStatusStore.getState().markStale(); // its git status may have changed
    return null;
  } catch (e) {
    return `Could not save ${path}: ${String(e)}`;
  }
}

// Saves every open file that has changes. Returns the error messages of files that failed,
// so callers can stop before doing something that would throw those edits away.
export function saveAllDirty(projectId: string): string[] {
  const errors: string[] = [];
  for (const file of useEditorStore.getState().files) {
    const error = isDirty(file) ? saveFile(projectId, file.path) : null;
    if (error) errors.push(error);
  }
  return errors;
}

// Files on disk changed (pull, branch switch): reload the open tabs from disk.
// Tabs whose file no longer exists are closed. Call saveAllDirty first.
export function reloadOpenTabs(projectId: string) {
  const { files, activePath, reset, setActive } = useEditorStore.getState();
  const paths = files.map((f) => f.path);
  reset();
  for (const path of paths) openFileFromDisk(projectId, path);
  const stillOpen = useEditorStore.getState().files.some((f) => f.path === activePath);
  if (activePath && stillOpen) setActive(activePath);
}
