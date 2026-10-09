import { Redirect, router, Tabs, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { Alert, BackHandler, StyleSheet, View } from 'react-native';
import { Drawer } from 'react-native-drawer-layout';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useEditorStore } from '../../../src/features/editor/editorStore';
import { openFileFromDisk, saveAllDirty } from '../../../src/features/editor/fileActions';
import { FileTree } from '../../../src/features/explorer/FileTree';
import { dropGitCache } from '../../../src/features/git/gitCache';
import { useGitStatusStore } from '../../../src/features/git/gitStatusStore';
import { repoDir } from '../../../src/features/git/repo';
import { useProjectStore } from '../../../src/features/projects/projectStore';
import { Dock, useRail } from '../../../src/features/workspace/Dock';
import { useWorkspaceStore } from '../../../src/features/workspace/workspaceStore';
import { useTheme } from '../../../src/theme/useTheme';

// The workspace: explorer drawer on the left, Code/Git/Run/Agent tabs with the dock at the bottom
// (a rail on the left on tablets).
export default function WorkspaceLayout() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const project = useProjectStore((s) => s.projects.find((p) => p.id === id));
  const explorerOpen = useWorkspaceStore((s) => s.explorerOpen);
  const setExplorerOpen = useWorkspaceStore((s) => s.setExplorerOpen);
  const setExplorerShown = useWorkspaceStore((s) => s.setExplorerShown);
  const activePath = useEditorStore((s) => s.activePath);
  const rail = useRail();

  // Each project starts with a closed explorer. When leaving, save any changes first
  // (the autosave timer would be cancelled), then close the tabs.
  useEffect(() => {
    setExplorerOpen(false);
    useEditorStore.getState().enterProject(id);
    useGitStatusStore.getState().enterProject(id);
    return () => {
      dropGitCache(repoDir(id)); // it holds the repo's pack files in memory
      const saveErrors = saveAllDirty(id);
      // If a save failed, keep the edits in memory: reopening this project shows them again.
      if (saveErrors.length > 0)
        Alert.alert('Some files could not be saved', saveErrors.join('\n'));
      else useEditorStore.getState().reset();
    };
  }, [id, setExplorerOpen]);

  // Android back button closes the explorer first, before leaving the workspace.
  useEffect(() => {
    if (!explorerOpen) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setExplorerOpen(false);
      return true;
    });
    return () => sub.remove();
  }, [explorerOpen, setExplorerOpen]);

  // Stable handlers, so the (memoized) file tree doesn't redraw when this screen does.
  const openFile = useCallback(
    (path: string) => {
      const error = openFileFromDisk(id, path);
      if (error) Alert.alert('Cannot open file', error);
      else setExplorerOpen(false);
    },
    [id, setExplorerOpen],
  );
  const quickOpen = useCallback(
    () => router.push({ pathname: '/quick-open', params: { projectId: id } }),
    [id],
  );
  const search = useCallback(
    () => router.push({ pathname: '/search', params: { projectId: id } }),
    [id],
  );
  const fileActions = useCallback(
    (path: string, isDir: boolean) =>
      router.push({
        pathname: '/file-actions',
        params: { projectId: id, path, isDir: String(isDir) },
      }),
    [id],
  );

  if (!project) return <Redirect href="/" />;

  return (
    <Drawer
      open={explorerOpen}
      onOpen={() => setExplorerOpen(true)}
      onClose={() => setExplorerOpen(false)}
      onTransitionEnd={(closing) => setExplorerShown(!closing)}
      drawerStyle={[styles.drawer, { backgroundColor: colors.surface }]}
      renderDrawerContent={() => (
        <View style={[styles.drawerContent, { paddingTop: insets.top }]}>
          <FileTree
            projectId={project.id}
            projectName={project.name}
            activeFile={activePath}
            onQuickOpen={quickOpen}
            onSearch={search}
            onFileActions={fileActions}
            onOpenFile={openFile}
          />
        </View>
      )}
    >
      <Tabs
        tabBar={(props) => <Dock {...props} />}
        backBehavior="none" // Android back leaves the project from any tab, like the home button
        screenOptions={{
          headerShown: false,
          tabBarPosition: rail ? 'left' : 'bottom',
          // The bottom dock pads itself for the system nav bar; with the rail, each tab must.
          sceneStyle: rail
            ? { paddingBottom: insets.bottom, backgroundColor: colors.bg }
            : undefined,
        }}
      >
        <Tabs.Screen name="code" />
        <Tabs.Screen name="git" />
        <Tabs.Screen name="run" />
        <Tabs.Screen name="agent" />
      </Tabs>
    </Drawer>
  );
}

const styles = StyleSheet.create({
  drawer: { width: '84%', maxWidth: 360 },
  drawerContent: { flex: 1 },
});
