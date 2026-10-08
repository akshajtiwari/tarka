import { fileAt } from '../../lib/projectFs';
import { useEditorStore } from './editorStore';

// Reads a file from disk and opens it in a tab.
export function openFileFromDisk(projectId: string, path: string) {
  const text = fileAt(projectId, path).textSync();
  useEditorStore.getState().openFile(path, text);
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
