import { memo, useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { Hint } from '../../components/Hint';
import { IconButton } from '../../components/IconButton';
import { listEntries } from '../../lib/projectFs';
import { useWorkspaceStore } from '../workspace/workspaceStore';
import { font, fontSize } from '../../theme/fonts';
import { size, space } from '../../theme/spacing';
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

// Memoized: the workspace re-renders often, and a big tree is costly to redraw.
export const FileTree = memo(function FileTree({
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
  const shown = useWorkspaceStore((s) => s.explorerShown);
  const gitKinds = useGitColors(projectId, shown);

  // treeVersion changes after a file action, so the folder is read again.
  const rows = useMemo(
    () => buildRows((path) => listEntries(projectId, path), expanded),
    [projectId, expanded, treeVersion], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Stable, so rows (memoized) only redraw when their own data changes.
  const pressRow = useCallback(
    (row: TreeRow) => {
      if (!row.isDir) return onOpenFile(row.path);
      setExpanded((old) => {
        const next = new Set(old);
        if (next.has(row.path)) next.delete(row.path);
        else next.add(row.path);
        return next;
      });
    },
    [onOpenFile],
  );
  const longPressRow = useCallback(
    (row: TreeRow) => onFileActions(row.path, row.isDir),
    [onFileActions],
  );

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
        getItemLayout={(_, index) => ({
          length: size.treeRow,
          offset: size.treeRow * index,
          index,
        })}
        initialNumToRender={30}
        ListEmptyComponent={<Hint text="No files yet. Tap + to make one." />}
        renderItem={({ item }) => (
          <FileRow
            row={item}
            expanded={expanded.has(item.path)}
            active={item.path === activeFile}
            gitKind={gitKinds[item.path]}
            onPress={pressRow}
            onLongPress={longPressRow}
          />
        )}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  tree: { flex: 1 },
  top: { flexDirection: 'row', alignItems: 'center', paddingRight: space.xs },
  title: { flex: 1, padding: space.lg, fontFamily: font.uiBold, fontSize: fontSize.title },
});
