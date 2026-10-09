import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { IconButton } from '../../components/IconButton';
import { listEntries } from '../../lib/projectFs';
import { useWorkspaceStore } from '../workspace/workspaceStore';
import { font, fontSize } from '../../theme/fonts';
import { space } from '../../theme/spacing';
import { useTheme } from '../../theme/useTheme';
import { FileRow } from './FileRow';
import { useGitColors } from './useGitColors';
import { buildRows, type TreeRow } from './treeRows';

type Props = {
  projectId: string;
  projectName: string;
  activeFile: string | null;
  onOpenFile: (path: string) => void;
  onQuickOpen: () => void;
  onSearch: () => void;
  onFileActions: (path: string, isDir: boolean) => void; // long-press, or + for the project root
};

export function FileTree({
  projectId,
  projectName,
  activeFile,
  onOpenFile,
  onQuickOpen,
  onSearch,
  onFileActions,
}: Props) {
  const colors = useTheme();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const treeVersion = useWorkspaceStore((s) => s.treeVersion);
  const gitKinds = useGitColors(projectId);

  // treeVersion changes after a file action, so the folder is read again.
  const rows = useMemo(
    () => buildRows((path) => listEntries(projectId, path), expanded),
    [projectId, expanded, treeVersion], // eslint-disable-line react-hooks/exhaustive-deps
  );

  function toggleFolder(path: string) {
    const next = new Set(expanded);
    if (next.has(path)) next.delete(path);
    else next.add(path);
    setExpanded(next);
  }

  function pressRow(row: TreeRow) {
    if (row.isDir) toggleFolder(row.path);
    else onOpenFile(row.path);
  }

  return (
    <View style={[styles.tree, { backgroundColor: colors.surface }]}>
      <View style={styles.top}>
        <Text numberOfLines={1} style={[styles.title, { color: colors.text }]}>
          {projectName}
        </Text>
        <IconButton
          icon="plus"
          label="New file or folder"
          onPress={() => onFileActions('', true)}
        />
        <IconButton icon="file-code" label="Go to file" onPress={onQuickOpen} />
        <IconButton icon="search" label="Search in files" onPress={onSearch} />
      </View>
      <FlatList
        data={rows}
        keyExtractor={(row) => row.path}
        renderItem={({ item }) => (
          <FileRow
            row={item}
            expanded={expanded.has(item.path)}
            active={item.path === activeFile}
            gitKind={gitKinds[item.path]}
            onPress={() => pressRow(item)}
            onLongPress={() => onFileActions(item.path, item.isDir)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tree: { flex: 1 },
  top: { flexDirection: 'row', alignItems: 'center', paddingRight: space.xs },
  title: { flex: 1, padding: space.lg, fontFamily: font.uiBold, fontSize: fontSize.title },
});
