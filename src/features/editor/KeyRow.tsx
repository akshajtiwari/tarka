import Octicons from '@expo/vector-icons/Octicons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';

import { font, fontSize } from '../../theme/fonts';
import { size, space } from '../../theme/spacing';
import { useTheme } from '../../theme/useTheme';
import { useTrackpad } from './useTrackpad';

// shortcut: one symbol set for every language, make it language-aware in the key row step.
const symbols = [
  '{',
  '}',
  '(',
  ')',
  '[',
  ']',
  ';',
  '=',
  '"',
  "'",
  ':',
  ',',
  '.',
  '<',
  '>',
  '/',
  '_',
  '-',
  '+',
  '*',
  '!',
  '&',
  '|',
];

type Props = {
  onInsert: (text: string) => void;
  onMove: (by: number) => void;
  onMoveLines: (by: number) => void;
  onUndo: () => void;
  onRedo: () => void;
};

// Sits right above the keyboard while editing. Press and hold, then slide, to use it as a trackpad. Taps must never close the keyboard,
// so the scroll view keeps taps (keyboardShouldPersistTaps) and nothing here takes focus.
export function KeyRow({ onInsert, onMove, onMoveLines, onUndo, onRedo }: Props) {
  const colors = useTheme();
  const trackpad = useTrackpad(onMove, onMoveLines);

  const key = (label: string, onPress: () => void, a11y = label) => (
    <Pressable
      key={a11y}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      onPress={onPress}
      style={({ pressed }) => [styles.key, pressed && { backgroundColor: colors.raised }]}
    >
      <Text style={[styles.keyText, { color: colors.text }]}>{label}</Text>
    </Pressable>
  );

  const iconKey = (
    icon: React.ComponentProps<typeof Octicons>['name'],
    a11y: string,
    onPress: () => void,
  ) => (
    <Pressable
      key={a11y}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      onPress={onPress}
      style={({ pressed }) => [styles.key, pressed && { backgroundColor: colors.raised }]}
    >
      <Octicons name={icon} size={16} color={colors.muted} />
    </Pressable>
  );

  return (
    <GestureDetector gesture={trackpad}>
      <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.line }]}>
        {key('⇥', () => onInsert('  '), 'Tab')}
        <ScrollView
          horizontal
          keyboardShouldPersistTaps="always"
          showsHorizontalScrollIndicator={false}
        >
          {symbols.map((s) => key(s, () => onInsert(s)))}
        </ScrollView>
        {iconKey('arrow-left', 'Cursor left', () => onMove(-1))}
        {iconKey('arrow-right', 'Cursor right', () => onMove(1))}
        {iconKey('undo', 'Undo', onUndo)}
        {iconKey('redo', 'Redo', onRedo)}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  row: { height: size.keyRow, flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth },
  key: {
    minWidth: 36,
    paddingHorizontal: space.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: { fontFamily: font.code, fontSize: fontSize.body },
});
