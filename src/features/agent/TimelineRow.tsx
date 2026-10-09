import Octicons from '@expo/vector-icons/Octicons';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { font, fontSize } from '../../theme/fonts';
import { radius, space } from '../../theme/spacing';
import { useTheme } from '../../theme/useTheme';
import type { TimelineItem } from './useAgent';

// One row of the agent timeline. Not chat bubbles: your message is a quoted block,
// the agent's text is plain, each tool call is one compact monospace line.
export function TimelineRow({ item }: { item: TimelineItem }) {
  const colors = useTheme();

  if (item.kind === 'user') {
    return (
      <View style={[styles.quote, { borderColor: colors.line, backgroundColor: colors.surface }]}>
        <Text selectable style={[styles.text, { color: colors.text }]}>
          {item.text}
        </Text>
      </View>
    );
  }
  if (item.kind === 'assistant') {
    return (
      <Text selectable style={[styles.text, styles.answer, { color: colors.text }]}>
        {item.text}
      </Text>
    );
  }
  if (item.kind === 'note') {
    return <Text style={[styles.note, { color: colors.muted }]}>{item.text}</Text>;
  }

  const statusIcon = {
    running: <ActivityIndicator size="small" color={colors.running} />,
    done: <Octicons name="check" size={14} color={colors.success} />,
    error: <Octicons name="x" size={14} color={colors.error} />,
  }[item.status];
  return (
    <View style={styles.tool} accessibilityLabel={`${item.name} ${item.detail} ${item.status}`}>
      {statusIcon}
      <Text numberOfLines={1} style={[styles.toolText, { color: colors.muted }]}>
        {item.name} <Text style={{ color: colors.text }}>{item.detail}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  quote: {
    marginVertical: space.sm,
    padding: space.md,
    borderLeftWidth: 3,
    borderRadius: radius.sm,
  },
  text: { fontFamily: font.ui, fontSize: fontSize.body, lineHeight: 22 },
  answer: { marginVertical: space.sm },
  note: { marginVertical: space.sm, fontFamily: font.ui, fontSize: fontSize.small },
  tool: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.xs },
  toolText: { flex: 1, fontFamily: font.code, fontSize: fontSize.small },
});
