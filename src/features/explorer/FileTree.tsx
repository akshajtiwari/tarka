import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

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
};

export function FileTree({ projectId, projectName, activeFile, onOpenFile }: Props) {
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
      <Text numberOfLines={1} style={[styles.title, { color: colors.text }]}>
        {projectName}
      </Text>
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
  title: { padding: space.lg, fontFamily: font.uiBold, fontSize: fontSize.title },
});
