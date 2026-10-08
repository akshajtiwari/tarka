import { StyleSheet, Text, View } from 'react-native';

import { font, fontSize } from '../theme/fonts';
import { size, space } from '../theme/spacing';
import { useTheme } from '../theme/useTheme';

type Props = {
  title: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
};

export function Header({ title, left, right }: Props) {
  const colors = useTheme();

  return (
    <View style={[styles.header, { backgroundColor: colors.surface, borderColor: colors.line }]}>
      {left}
      <Text numberOfLines={1} style={[styles.title, { color: colors.text }]}>
        {title}
      </Text>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: size.header,
    paddingHorizontal: space.xs,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { flex: 1, marginHorizontal: space.md, fontFamily: font.uiBold, fontSize: fontSize.title },
});
