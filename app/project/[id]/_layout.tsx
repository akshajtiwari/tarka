import { Redirect, Tabs, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Drawer } from 'react-native-drawer-layout';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const { explorerOpen, setExplorerOpen, activeFile, openFile, reset } = useWorkspaceStore();

  // Start each project with a closed explorer and no file open.
  useEffect(() => reset, [id, reset]);

  if (!project) return <Redirect href="/" />;

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
            activeFile={activeFile}
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
