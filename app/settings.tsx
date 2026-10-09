import { router } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Header } from '../src/components/Header';
import { IconButton } from '../src/components/IconButton';
import { AiSettings } from '../src/features/settings/AiSettings';
import { GitSettings } from '../src/features/settings/GitSettings';
import { ProjectsFolderSettings } from '../src/features/settings/ProjectsFolderSettings';
import { ThemeSettings } from '../src/features/settings/ThemeSettings';
import { font, fontSize } from '../src/theme/fonts';
import { space } from '../src/theme/spacing';
import { useTheme } from '../src/theme/useTheme';

// Room kept between the focused field and the keyboard: enough to also show the button below it.
const KEYBOARD_GAP = 96;

export default function SettingsScreen() {
  const colors = useTheme();
  const section = (title: string) => (
    <Text style={[styles.section, { color: colors.muted }]}>{title}</Text>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header
        title="Settings"
        left={<IconButton icon="arrow-left" label="Back" onPress={() => router.back()} />}
      />
      {/* Keyboard-aware: the field you type in, and the button under it, stay above the keyboard. */}
      <KeyboardAwareScrollView
        keyboardShouldPersistTaps="handled"
        bottomOffset={KEYBOARD_GAP}
        contentContainerStyle={styles.content}
      >
        {section('Theme')}
        <ThemeSettings />
        {section('Projects folder')}
        <ProjectsFolderSettings />
        {section('AI agent')}
        <AiSettings />
        {section('Git')}
        <GitSettings />
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: space.xxl },
  section: {
    paddingHorizontal: space.lg,
    paddingTop: space.xl,
    paddingBottom: space.sm,
    fontFamily: font.uiBold,
    fontSize: fontSize.small,
  },
});
