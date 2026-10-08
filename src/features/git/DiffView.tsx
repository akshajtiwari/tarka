import { FlatList, StyleSheet, Text, View } from 'react-native';

import { font, fontSize } from '../../theme/fonts';
import { space } from '../../theme/spacing';
import { useTheme } from '../../theme/useTheme';
import type { DiffRow } from './diffRows';

const marks = { add: '+', del: '-', same: ' ', gap: '' };

// Unified diff: green rows were added, red rows removed. A +/- mark is shown too, not just color.
export function DiffView({ rows }: { rows: DiffRow[] }) {
  const colors = useTheme();
  const background = {
    add: `${colors.success}24`,
    del: `${colors.error}24`,
    same: 'transparent',
    gap: colors.surface,
  };

  return (
    <FlatList
      data={rows}
      keyExtractor={(_, i) => String(i)}
      renderItem={({ item }) => (
        <View style={[styles.row, { backgroundColor: background[item.kind] }]}>
          <Text style={[styles.number, { color: colors.muted }]}>{item.oldNo ?? ''}</Text>
          <Text style={[styles.number, { color: colors.muted }]}>{item.newNo ?? ''}</Text>
          <Text style={[styles.text, { color: item.kind === 'gap' ? colors.muted : colors.text }]}>
            {marks[item.kind]} {item.text}
          </Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', paddingVertical: 2, paddingRight: space.sm },
  number: {
    width: 36,
    textAlign: 'right',
    paddingRight: space.sm,
    fontFamily: font.code,
    fontSize: fontSize.caption,
  },
  text: { flex: 1, fontFamily: font.code, fontSize: fontSize.small },
});
