import { fileAt } from '../../lib/projectFs';
import { useEditorStore } from './editorStore';
import { openModeFor } from './fileSizeGuard';

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

// Writes the editor's text to disk. Returns false if the write failed.
export function saveFile(projectId: string, path: string): boolean {
  const file = useEditorStore.getState().files.find((f) => f.path === path);
  if (!file) return false;
  try {
    fileAt(projectId, path).write(file.text);
    useEditorStore.getState().markSaved(path, file.text);
    return true;
  } catch {
    return false;
  }
}
