import Octicons from '@expo/vector-icons/Octicons';
import { memo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';

import { font, fontSize } from '../../theme/fonts';
import { size, space } from '../../theme/spacing';
import { useTheme } from '../../theme/useTheme';
import { symbolsFor } from './keySymbols';
import { useTrackpad } from './useTrackpad';

type Props = {
  path: string; // the open file, used to pick the symbols
  onInsert: (text: string) => void;
  onMove: (by: number) => void;
  onMoveLines: (by: number) => void;
  onUndo: () => void;
  onRedo: () => void;
};

// Sits right above the keyboard while editing. Press and hold, then slide, to use it as a trackpad.
// Taps must never close the keyboard, so the scroll view keeps taps (keyboardShouldPersistTaps)
// and nothing here takes focus.
export const KeyRow = memo(function KeyRow({
  path,
  onInsert,
  onMove,
  onMoveLines,
  onUndo,
  onRedo,
}: Props) {
  const colors = useTheme();
  const trackpad = useTrackpad(onMove, onMoveLines);

  function textKey(label: string, onPress: () => void, a11y = label) {
    return (
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
  }

  function iconKey(
    icon: React.ComponentProps<typeof Octicons>['name'],
    a11y: string,
    onPress: () => void,
  ) {
    return (
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
  }

  return (
    <GestureDetector gesture={trackpad}>
      <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.line }]}>
        {textKey('⇥', () => onInsert('  '), 'Tab')}
        <ScrollView
          horizontal
          keyboardShouldPersistTaps="always"
          showsHorizontalScrollIndicator={false}
        >
          {symbolsFor(path).map((symbol) => textKey(symbol, () => onInsert(symbol)))}
        </ScrollView>
        {iconKey('arrow-left', 'Cursor left', () => onMove(-1))}
        {iconKey('arrow-right', 'Cursor right', () => onMove(1))}
        {iconKey('undo', 'Undo', onUndo)}
        {iconKey('redo', 'Redo', onRedo)}
      </View>
    </GestureDetector>
  );
});

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
