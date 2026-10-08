import { StyleSheet, Text, TextInput, View } from 'react-native';

import { font, fontSize } from '../theme/fonts';
import { radius, size, space } from '../theme/spacing';
import { useTheme } from '../theme/useTheme';

type Props = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  mono?: boolean; // use the code font, e.g. for URLs and file names
};

export function TextField({ label, value, onChangeText, placeholder, autoFocus, mono }: Props) {
  const colors = useTheme();

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        autoFocus={autoFocus}
        autoCapitalize="none"
        autoCorrect={false}
        style={[
          styles.input,
          { color: colors.text, backgroundColor: colors.raised, borderColor: colors.line },
          { fontFamily: mono ? font.code : font.ui },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: space.xs },
  label: { fontFamily: font.ui, fontSize: fontSize.small },
  input: {
    minHeight: size.touch,
    paddingHorizontal: space.md,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    fontSize: fontSize.body,
  },
});
