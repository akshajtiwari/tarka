import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { IconButton } from '../../components/IconButton';
import { listEntries } from '../../lib/projectFs';
import { font, fontSize } from '../../theme/fonts';
import { space } from '../../theme/spacing';
import { useTheme } from '../../theme/useTheme';
import { FileRow } from './FileRow';
import { buildRows } from './treeRows';

type Props = {
  projectId: string;
  projectName: string;
  activeFile: string | null;
  onOpenFile: (path: string) => void;
  onQuickOpen: () => void;
  onSearch: () => void;
};

export function FileTree(props: Props) {
  const { projectId, projectName, activeFile, onOpenFile, onQuickOpen, onSearch } = props;
  const colors = useTheme();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const rows = useMemo(
    () => buildRows((path) => listEntries(projectId, path), expanded),
    [projectId, expanded],
  );

  function toggleFolder(path: string) {
    const next = new Set(expanded);
    if (next.has(path)) next.delete(path);
    else next.add(path);
    setExpanded(next);
  }

  return (
    <View style={[styles.tree, { backgroundColor: colors.surface }]}>
      <View style={styles.top}>
        <Text numberOfLines={1} style={[styles.title, { color: colors.text }]}>
          {projectName}
        </Text>
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
            onPress={() => (item.isDir ? toggleFolder(item.path) : onOpenFile(item.path))}
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
