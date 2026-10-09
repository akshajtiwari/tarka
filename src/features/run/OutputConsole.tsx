import { FlatList, StyleSheet, Text } from 'react-native';

import { Hint } from '../../components/Hint';
import { font, fontSize } from '../../theme/fonts';
import { space } from '../../theme/spacing';
import { useTheme } from '../../theme/useTheme';
import type { OutputLine } from './runJob';

// Program output: normal text, errors in red, and app notes (like "Loading Python") dimmed.
export function OutputConsole({ lines }: { lines: OutputLine[] }) {
  const colors = useTheme();
  const color = { stdout: colors.text, stderr: colors.error, info: colors.muted };

  return (
    <FlatList
      data={lines}
      keyExtractor={(_, i) => String(i)}
      contentContainerStyle={styles.content}
      ListEmptyComponent={<Hint text="What your program prints shows up here." />}
      renderItem={({ item }) => (
        <Text selectable style={[styles.line, { color: color[item.stream] }]}>
          {item.text}
        </Text>
      )}
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg },
  line: { fontFamily: font.code, fontSize: fontSize.small, lineHeight: 20 },
});
