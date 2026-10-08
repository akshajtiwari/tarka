import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { fontFiles } from '../src/theme/fonts';
import { useTheme } from '../src/theme/useTheme';

export default function RootLayout() {
  const [fontsLoaded] = useFonts(fontFiles);
  const colors = useTheme();

  // Fonts are bundled with the app, so this is only a blink on startup.
  if (!fontsLoaded) return null;

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
    </>
  );
}
