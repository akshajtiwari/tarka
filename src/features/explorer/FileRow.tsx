import Octicons from '@expo/vector-icons/Octicons';
import { memo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { font, fontSize } from '../../theme/fonts';
import { size, space } from '../../theme/spacing';
import { useTheme } from '../../theme/useTheme';
import type { ChangeKind } from '../git/changes';
import { changeColor, changeLetters } from '../git/changeStyle';
import type { TreeRow } from './treeRows';

type Props = {
  row: TreeRow;
  expanded: boolean;
  active: boolean;
  gitKind?: ChangeKind; // shown as a colored letter: M modified, U new, A added
  onPress: (row: TreeRow) => void;
  onLongPress: (row: TreeRow) => void;
};

// Memoized: with stable handlers, a row only redraws when its own data changes.
export const FileRow = memo(function FileRow({
  row,
  expanded,
  active,
  gitKind,
  onPress,
  onLongPress,
}: Props) {
  const colors = useTheme();
  const gitColor = gitKind && changeColor(gitKind, colors);
  const folderIcon = expanded ? 'file-directory-open-fill' : 'file-directory-fill';
  const icon = row.isDir ? folderIcon : 'file';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${row.isDir ? 'Folder' : 'File'} ${row.path}`}
      onPress={() => onPress(row)}
      onLongPress={() => onLongPress(row)}
      style={({ pressed }) => [
        styles.row,
        { paddingLeft: space.md + row.depth * space.lg },
        (pressed || active) && { backgroundColor: colors.raised },
        active && { borderLeftColor: colors.accent },
      ]}
    >
      <Octicons name={icon} size={16} color={row.isDir ? colors.accent : colors.muted} />
      <Text numberOfLines={1} style={[styles.name, { color: gitColor ?? colors.text }]}>
        {row.name}
      </Text>
      {gitKind && (
        <Text style={[styles.gitLetter, { color: gitColor }]}>{changeLetters[gitKind]}</Text>
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    height: size.treeRow,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingRight: space.md,
    borderLeftWidth: 2,
    borderLeftColor: 'transparent',
  },
  name: { flex: 1, fontFamily: font.code, fontSize: fontSize.small },
  gitLetter: { fontFamily: font.codeBold, fontSize: fontSize.caption },
});
