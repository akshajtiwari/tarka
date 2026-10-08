import Octicons from '@expo/vector-icons/Octicons';
import { Pressable, StyleSheet, Text } from 'react-native';

import { font, fontSize } from '../../theme/fonts';
import { size, space } from '../../theme/spacing';
import { useTheme } from '../../theme/useTheme';
import type { TreeRow } from './treeRows';

type Props = {
  row: TreeRow;
  expanded: boolean;
  active: boolean;
  onPress: () => void;
};

export function FileRow({ row, expanded, active, onPress }: Props) {
  const colors = useTheme();
  const folderIcon = expanded ? 'file-directory-open-fill' : 'file-directory-fill';
  const icon = row.isDir ? folderIcon : 'file';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={row.path}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { paddingLeft: space.md + row.depth * space.lg },
        (pressed || active) && { backgroundColor: colors.raised },
        active && { borderLeftColor: colors.accent },
      ]}
    >
      <Octicons name={icon} size={16} color={row.isDir ? colors.accent : colors.muted} />
      <Text numberOfLines={1} style={[styles.name, { color: colors.text }]}>
        {row.name}
      </Text>
    </Pressable>
  );
}

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
});
