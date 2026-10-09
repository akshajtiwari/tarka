import Octicons from '@expo/vector-icons/Octicons';
import { StyleSheet, Text, View } from 'react-native';

import { font, fontSize } from '../../theme/fonts';
import { space } from '../../theme/spacing';
import { useTheme } from '../../theme/useTheme';

type Icon = React.ComponentProps<typeof Octicons>['name'];

// The phone-only tricks that are easy to miss.
const TIPS: { icon: Icon; text: string }[] = [
  { icon: 'sidebar-collapse', text: 'Swipe in from the left edge of a project to see its files.' },
  { icon: 'arrow-both', text: 'Hold a key on the key row, then drag to move the cursor.' },
  { icon: 'screen-full', text: 'Pinch the code to make the text bigger or smaller.' },
  { icon: 'play', text: 'Run file opens the terminal. Type help there to see what it can do.' },
  { icon: 'lock', text: 'Read lock in the ⋯ menu lets you scroll without the keyboard.' },
  { icon: 'home', text: 'The house button takes you back to your projects from anywhere.' },
];

export function TipsList() {
  const colors = useTheme();
  return (
    <View style={styles.list}>
      {TIPS.map((tip) => (
        <View key={tip.icon} style={styles.tip}>
          <Octicons name={tip.icon} size={18} color={colors.accent} style={styles.icon} />
          <Text style={[styles.text, { color: colors.text }]}>{tip.text}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: space.lg, paddingTop: space.md, gap: space.lg },
  tip: { flexDirection: 'row', gap: space.md },
  icon: { width: 22, marginTop: 2 },
  text: { flex: 1, fontFamily: font.ui, fontSize: fontSize.body, lineHeight: 24 },
});
