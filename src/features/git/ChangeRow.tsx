import { Pressable, StyleSheet, Text } from 'react-native';

import { IconButton } from '../../components/IconButton';
import { font, fontSize } from '../../theme/fonts';
import { size, space } from '../../theme/spacing';
import { useTheme } from '../../theme/useTheme';
import type { Change } from './changes';

type Props = {
  change: Change;
  staged: boolean;
  onOpen: () => void; // show the diff
  onToggle: () => void; // stage or unstage
};

const letters = { added: 'A', modified: 'M', deleted: 'D', untracked: 'U' };

// One changed file: a colored letter (never color alone), the path, and a +/− button.
export function ChangeRow({ change, staged, onOpen, onToggle }: Props) {
  const colors = useTheme();
  const kindColor = {
    added: colors.success,
    untracked: colors.success,
    modified: colors.warning,
    deleted: colors.error,
  }[change.kind];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${change.kind} ${change.path}`}
      onPress={onOpen}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.raised }]}
    >
      <Text style={[styles.letter, { color: kindColor }]}>{letters[change.kind]}</Text>
      <Text numberOfLines={1} style={[styles.path, { color: colors.text }]}>
        {change.path}
      </Text>
      <IconButton
        icon={staged ? 'dash' : 'plus'}
        label={`${staged ? 'Unstage' : 'Stage'} ${change.path}`}
        onPress={onToggle}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: size.row,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: space.lg,
    paddingRight: space.xs,
  },
  letter: { width: 24, fontFamily: font.codeBold, fontSize: fontSize.body },
  path: { flex: 1, fontFamily: font.code, fontSize: fontSize.small },
});
