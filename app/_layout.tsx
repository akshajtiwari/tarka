import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { fontFiles } from '../src/theme/fonts';
import { radius } from '../src/theme/spacing';
import { useTheme } from '../src/theme/useTheme';

export default function RootLayout() {
  const [fontsLoaded] = useFonts(fontFiles);
  const colors = useTheme();

  // Fonts are bundled with the app, so this is only a blink on startup.
  if (!fontsLoaded) return null;

  const sheet = {
    presentation: 'formSheet',
    sheetAllowedDetents: 'fitToContents',
    sheetGrabberVisible: true,
    sheetCornerRadius: radius.lg,
    contentStyle: { backgroundColor: colors.surface },
  } as const;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
          <Stack.Screen name="new-project" options={sheet} />
          <Stack.Screen name="project-actions" options={sheet} />
          <Stack.Screen name="open-files" options={sheet} />
          <Stack.Screen name="editor-menu" options={sheet} />
          <Stack.Screen name="quick-open" options={sheet} />
        </Stack>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
