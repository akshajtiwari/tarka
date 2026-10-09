import { StyleSheet, Text } from 'react-native';

import { font, fontSize } from '../theme/fonts';
import { space } from '../theme/spacing';
import { useTheme } from '../theme/useTheme';

// One quiet line for an empty list: what will show up here, or what to do next.
export function Hint({ text }: { text: string }) {
  const colors = useTheme();
  return <Text style={[styles.hint, { color: colors.muted }]}>{text}</Text>;
}

const styles = StyleSheet.create({
  hint: {
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    fontFamily: font.ui,
    fontSize: fontSize.small,
    lineHeight: 20,
  },
});
