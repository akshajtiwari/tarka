import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Alert } from 'react-native';

import { useWorkspaceStore } from '../workspace/workspaceStore';
import { useEditorStore } from './editorStore';
import { saveFile } from './fileActions';

// What the editor header's buttons and swipes do. Stable functions (they read the stores
// when called), so the memoized header doesn't redraw on every keystroke.
export function useEditorActions(projectId: string) {
  const setExplorerOpen = useWorkspaceStore((s) => s.setExplorerOpen);

  return useMemo(
    () => ({
      showFiles: () => setExplorerOpen(true),
      showTabs: () => router.push({ pathname: '/open-files', params: { projectId } }),
      showMenu: () => router.push({ pathname: '/editor-menu', params: { projectId } }),
      save: () => {
        const { activePath } = useEditorStore.getState();
        const error = activePath && saveFile(projectId, activePath);
        if (error) Alert.alert('Could not save', error);
      },
      // Swiping the header: by = 1 for the next open file, -1 for the previous one.
      switchTab: (by: number) => {
        const { files, activePath, setActive } = useEditorStore.getState();
        const next = files[files.findIndex((f) => f.path === activePath) + by];
        if (!next) return;
        setActive(next.path);
        Haptics.selectionAsync();
      },
    }),
    [projectId, setExplorerOpen],
  );
}
