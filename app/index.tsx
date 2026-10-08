import { StyleSheet, Text, View } from 'react-native';

import { font, fontSize } from '../src/theme/fonts';
import { useTheme } from '../src/theme/useTheme';

export default function HomeScreen() {
  const colors = useTheme();
  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <Text style={[styles.title, { color: colors.text }]}>TARKA</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: font.uiBold, fontSize: fontSize.display },
});
