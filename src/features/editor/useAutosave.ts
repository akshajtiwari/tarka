import { useEffect } from 'react';
import { AppState } from 'react-native';

import { isDirty, useEditorStore } from './editorStore';
import { saveAllDirty } from './fileActions';

// Saves changed files 1.5 seconds after typing stops, and right away when the app goes to the background.
export function useAutosave(projectId: string) {
  const files = useEditorStore((s) => s.files);

  useEffect(() => {
    if (!files.some(isDirty)) return;
    const timer = setTimeout(() => saveAllDirty(projectId), 1500);
    return () => clearTimeout(timer);
  }, [files, projectId]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') saveAllDirty(projectId);
    });
    return () => sub.remove();
  }, [projectId]);
}
