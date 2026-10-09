import Octicons from '@expo/vector-icons/Octicons';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '../../components/Button';
import { font, fontSize } from '../../theme/fonts';
import { radius, space } from '../../theme/spacing';
import { useTheme } from '../../theme/useTheme';

type Icon = React.ComponentProps<typeof Octicons>['name'];

// The phone-only tricks that are easy to miss.
const TIPS: { icon: Icon; text: string }[] = [
  { icon: 'sidebar-collapse', text: 'Swipe in from the left edge of a project to see its files.' },
  { icon: 'arrow-both', text: 'Hold a key on the key row, then drag to move the cursor.' },
  { icon: 'screen-full', text: 'Pinch the code to make the text bigger or smaller.' },
  { icon: 'lock', text: 'Read lock in the ⋯ menu lets you scroll without the keyboard.' },
  { icon: 'key', text: 'The agent needs your own AI key, added in Settings.' },
];

type Props = { onDone: () => void };

// Shown on the home screen until you tap "Got it".
export function TipsCard({ onDone }: Props) {
  const colors = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
      <Text style={[styles.title, { color: colors.text }]}>Coding on a phone</Text>
      {TIPS.map((tip) => (
        <View key={tip.icon} style={styles.tip}>
          <Octicons name={tip.icon} size={16} color={colors.accent} style={styles.icon} />
          <Text style={[styles.text, { color: colors.muted }]}>{tip.text}</Text>
        </View>
      ))}
      <Button label="Got it" onPress={onDone} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: space.lg,
    padding: space.lg,
    gap: space.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  title: { fontFamily: font.uiBold, fontSize: fontSize.title },
  tip: { flexDirection: 'row', gap: space.md },
  icon: { width: 20, marginTop: 3 },
  text: { flex: 1, fontFamily: font.ui, fontSize: fontSize.small, lineHeight: 21 },
});
