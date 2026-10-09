import { FlatList, StyleSheet, Text, View } from 'react-native';

import { font, fontSize } from '../../theme/fonts';
import { space } from '../../theme/spacing';
import { useTheme } from '../../theme/useTheme';
import type { DiffRow } from './diffRows';

const marks = { add: '+', del: '-', same: ' ', gap: '' };

// Unified diff: green rows were added, red rows removed. A +/- mark is shown too, not just color.
export function DiffView({ rows }: { rows: DiffRow[] }) {
  const colors = useTheme();
  const { diff } = colors;
  const line = { add: diff.addLine, del: diff.delLine, same: 'transparent', gap: colors.surface };
  const gutter = {
    add: diff.addGutter,
    del: diff.delGutter,
    same: 'transparent',
    gap: colors.surface,
  };
  const mark = { add: diff.addMark, del: diff.delMark, same: colors.muted, gap: colors.muted };

  return (
    <FlatList
      data={rows}
      keyExtractor={(_, i) => String(i)}
      renderItem={({ item }) => (
        <View style={[styles.row, { backgroundColor: line[item.kind] }]}>
          <View style={[styles.gutter, { backgroundColor: gutter[item.kind] }]}>
            <Text style={[styles.number, { color: colors.muted }]}>{item.oldNo ?? ''}</Text>
            <Text style={[styles.number, { color: colors.muted }]}>{item.newNo ?? ''}</Text>
          </View>
          <Text style={[styles.text, { color: item.kind === 'gap' ? colors.muted : colors.text }]}>
            <Text style={{ color: mark[item.kind] }}>{marks[item.kind]} </Text>
            {item.text}
          </Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', paddingRight: space.sm },
  gutter: { flexDirection: 'row', marginRight: space.sm },
  number: {
    width: 36,
    paddingVertical: 2,
    textAlign: 'right',
    paddingRight: space.sm,
    fontFamily: font.code,
    fontSize: fontSize.caption,
  },
  text: { flex: 1, paddingVertical: 2, fontFamily: font.code, fontSize: fontSize.small },
});
