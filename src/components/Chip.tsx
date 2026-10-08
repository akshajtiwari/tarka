import { Pressable, StyleSheet, Text } from 'react-native';

import { font, fontSize } from '../theme/fonts';
import { radius, space } from '../theme/spacing';
import { useTheme } from '../theme/useTheme';

type Props = {
  label: string;
  onPress: () => void;
  mono?: boolean;
};

export function Chip({ label, onPress, mono = false }: Props) {
  const colors = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: pressed ? colors.line : colors.raised },
      ]}
    >
      <Text style={[styles.label, { color: colors.text, fontFamily: mono ? font.code : font.ui }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: 32,
    paddingHorizontal: space.md,
    borderRadius: radius.sm,
    justifyContent: 'center',
  },
  label: { fontSize: fontSize.small },
});
