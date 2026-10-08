import Octicons from '@expo/vector-icons/Octicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { font, fontSize } from '../theme/fonts';
import { size, space } from '../theme/spacing';
import { useTheme } from '../theme/useTheme';

type Props = {
  title: string;
  subtitle?: string;
  icon?: React.ComponentProps<typeof Octicons>['name'];
  onPress?: () => void;
  onLongPress?: () => void;
  right?: React.ReactNode;
};

export function ListRow({ title, subtitle, icon, onPress, onLongPress, right }: Props) {
  const colors = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.raised }]}
    >
      {icon && <Octicons name={icon} size={18} color={colors.muted} style={styles.icon} />}
      <View style={styles.texts}>
        <Text numberOfLines={1} style={[styles.title, { color: colors.text }]}>
          {title}
        </Text>
        {subtitle && (
          <Text numberOfLines={1} style={[styles.subtitle, { color: colors.muted }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {right}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: size.row,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: { width: 24, marginRight: space.md },
  texts: { flex: 1 },
  title: { fontFamily: font.ui, fontSize: fontSize.body },
  subtitle: { fontFamily: font.ui, fontSize: fontSize.small, marginTop: 2 },
});
