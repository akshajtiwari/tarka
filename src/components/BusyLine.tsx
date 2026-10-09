import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { font, fontSize } from '../theme/fonts';
import { space } from '../theme/spacing';
import { useTheme } from '../theme/useTheme';

// Shows that something is working, and what: a spinner and a few words ("Pulling…").
export function BusyLine({ label, color }: { label: string; color?: string }) {
  const colors = useTheme();
  return (
    <View style={styles.row} accessibilityRole="progressbar" accessibilityLabel={label}>
      <ActivityIndicator size="small" color={colors.accent} />
      <Text style={[styles.text, { color: color ?? colors.muted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  text: { flex: 1, fontFamily: font.ui, fontSize: fontSize.small },
});
