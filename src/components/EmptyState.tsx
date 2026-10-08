import { StyleSheet, Text, View } from 'react-native';

import { font, fontSize } from '../theme/fonts';
import { space } from '../theme/spacing';
import { useTheme } from '../theme/useTheme';

type Props = {
  title: string;
  body: string;
  children?: React.ReactNode; // action buttons
};

// Empty screens invite the next action instead of just saying "nothing here".
export function EmptyState({ title, body, children }: Props) {
  const colors = useTheme();

  return (
    <View style={styles.box}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.body, { color: colors.muted }]}>{body}</Text>
      <View style={styles.actions}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { padding: space.xl, gap: space.sm },
  title: { fontFamily: font.uiBold, fontSize: fontSize.title },
  body: { fontFamily: font.ui, fontSize: fontSize.body, lineHeight: 22 },
  actions: { marginTop: space.lg, gap: space.md },
});
