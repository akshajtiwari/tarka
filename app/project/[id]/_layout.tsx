import { Redirect, router, Tabs, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { Alert, BackHandler, StyleSheet, View } from 'react-native';
import { Drawer } from 'react-native-drawer-layout';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useEditorStore } from '../../../src/features/editor/editorStore';
import { openFileFromDisk, saveAllDirty } from '../../../src/features/editor/fileActions';
import { FileTree } from '../../../src/features/explorer/FileTree';
import { useProjectStore } from '../../../src/features/projects/projectStore';
import { Dock } from '../../../src/features/workspace/Dock';
import { useWorkspaceStore } from '../../../src/features/workspace/workspaceStore';
import { useTheme } from '../../../src/theme/useTheme';

// The workspace: explorer drawer on the left, Code/Git/Run/Agent tabs with the dock at the bottom.
export default function WorkspaceLayout() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const project = useProjectStore((s) => s.projects.find((p) => p.id === id));
  const { explorerOpen, setExplorerOpen } = useWorkspaceStore();
  const activePath = useEditorStore((s) => s.activePath);

  // Each project starts with a closed explorer. When leaving, save any changes first
  // (the autosave timer would be cancelled), then close the tabs.
  useEffect(() => {
    setExplorerOpen(false);
    useEditorStore.getState().enterProject(id);
    return () => {
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

  if (!project) return <Redirect href="/" />;

  function openFile(path: string) {
    const error = openFileFromDisk(id, path);
    if (error) Alert.alert('Cannot open file', error);
    else setExplorerOpen(false);
  }

  return (
    <Drawer
      open={explorerOpen}
      onOpen={() => setExplorerOpen(true)}
      onClose={() => setExplorerOpen(false)}
      drawerStyle={[styles.drawer, { backgroundColor: colors.surface }]}
      renderDrawerContent={() => (
        <View style={[styles.drawerContent, { paddingTop: insets.top }]}>
          <FileTree
            projectId={project.id}
            projectName={project.name}
            activeFile={activePath}
            onQuickOpen={() =>
              router.push({ pathname: '/quick-open', params: { projectId: project.id } })
            }
            onSearch={() => router.push({ pathname: '/search', params: { projectId: project.id } })}
            onFileActions={(path, isDir) =>
              router.push({
                pathname: '/file-actions',
                params: { projectId: project.id, path, isDir: String(isDir) },
              })
            }
            onOpenFile={openFile}
          />
        </View>
      )}
    >
      <Tabs tabBar={(props) => <Dock {...props} />} screenOptions={{ headerShown: false }}>
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
