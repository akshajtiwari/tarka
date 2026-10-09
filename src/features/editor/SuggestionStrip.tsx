import { memo } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { Chip } from '../../components/Chip';
import { size, space } from '../../theme/spacing';
import { useTheme } from '../../theme/useTheme';

type Props = {
  labels: string[];
  onPick: (index: number) => void;
};

// Completions as big chips in thumb reach, right above the key row.
export const SuggestionStrip = memo(function SuggestionStrip({ labels, onPick }: Props) {
  const colors = useTheme();
  if (labels.length === 0) return null;

  return (
    <ScrollView
      horizontal
      keyboardShouldPersistTaps="always"
      showsHorizontalScrollIndicator={false}
      style={[styles.strip, { backgroundColor: colors.surface, borderColor: colors.line }]}
      contentContainerStyle={styles.content}
    >
      {labels.map((label, i) => (
        <Chip key={label} label={label} mono onPress={() => onPick(i)} />
      ))}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  strip: { maxHeight: size.suggestions, borderTopWidth: StyleSheet.hairlineWidth },
  content: { alignItems: 'center', gap: space.sm, paddingHorizontal: space.sm },
});
