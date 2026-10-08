import Octicons from '@expo/vector-icons/Octicons';
import { Pressable, StyleSheet } from 'react-native';

import { radius, size } from '../theme/spacing';
import { useTheme } from '../theme/useTheme';

type Props = {
  icon: React.ComponentProps<typeof Octicons>['name'];
  label: string; // read by screen readers and used by UI tests
  onPress: () => void;
  active?: boolean;
  color?: string;
};

export function IconButton({ icon, label, onPress, active = false, color }: Props) {
  const colors = useTheme();
  const iconColor = color ?? (active ? colors.accent : colors.muted);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && { backgroundColor: colors.raised }]}
    >
      <Octicons name={icon} size={20} color={iconColor} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: size.touch,
    height: size.touch,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
