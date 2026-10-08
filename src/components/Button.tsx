import { Pressable, StyleSheet, Text } from 'react-native';

import { font, fontSize } from '../theme/fonts';
import { radius, size, space } from '../theme/spacing';
import { useTheme } from '../theme/useTheme';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
};

// Primary is brass and used once per screen for the main action. Secondary is outlined.
export function Button({ label, onPress, variant = 'secondary', disabled = false }: Props) {
  const colors = useTheme();
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        isPrimary
          ? { backgroundColor: colors.accent }
          : { borderColor: colors.line, borderWidth: StyleSheet.hairlineWidth },
        pressed && { opacity: 0.8 },
        disabled && { opacity: 0.4 },
      ]}
    >
      <Text style={[styles.label, { color: isPrimary ? colors.onAccent : colors.text }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: size.touch,
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontFamily: font.uiBold, fontSize: fontSize.body },
});
