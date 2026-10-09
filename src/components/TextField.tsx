import { useRef } from 'react';
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
  secret?: boolean; // hide what is typed (tokens, passwords)
};

export function TextField(props: Props) {
  const { label, value, onChangeText, placeholder, autoFocus, mono, secret } = props;
  const colors = useTheme();
  const input = useRef<TextInput>(null);

  return (
    <View style={styles.field}>
      {/* Tapping the label works like tapping the box: it starts typing. */}
      <Text style={[styles.label, { color: colors.muted }]} onPress={() => input.current?.focus()}>
        {label}
      </Text>
      <TextInput
        ref={input}
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        autoFocus={autoFocus}
        secureTextEntry={secret}
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
