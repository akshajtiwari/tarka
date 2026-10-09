import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../src/components/Button';
import { Header } from '../src/components/Header';
import { IconButton } from '../src/components/IconButton';
import { AiSettings } from '../src/features/settings/AiSettings';
import { GitSettings } from '../src/features/settings/GitSettings';
import { ProjectsFolderSettings } from '../src/features/settings/ProjectsFolderSettings';
import { useSettings } from '../src/features/settings/settingsStore';
import { ThemeSettings } from '../src/features/settings/ThemeSettings';
import { font, fontSize } from '../src/theme/fonts';
import { space } from '../src/theme/spacing';
import { useTheme } from '../src/theme/useTheme';

// Room kept between the focused field and the keyboard: enough to also show the button below it.
const KEYBOARD_GAP = 96;

export default function SettingsScreen() {
  const colors = useTheme();
  const gitReady = useSettings((s) => !!s.gitName && !!s.gitEmail);
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
        <AiSettings showMissing />
        {section('Git')}
        {!gitReady && (
          <Text style={[styles.missing, { color: colors.warning }]}>
            Not set up yet: commits need your name and email.
          </Text>
        )}
        <GitSettings />
        {section('Setup')}
        <View style={styles.setup}>
          <Button
            label="Run setup again"
            onPress={() => {
              useSettings.getState().setOnboarded(false);
              router.replace('/welcome');
            }}
          />
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: space.xxl },
  missing: {
    paddingHorizontal: space.lg,
    paddingBottom: space.sm,
    fontFamily: font.ui,
    fontSize: fontSize.small,
  },
  setup: { paddingHorizontal: space.lg },
  section: {
    paddingHorizontal: space.lg,
    paddingTop: space.xl,
    paddingBottom: space.sm,
    fontFamily: font.uiBold,
    fontSize: fontSize.small,
  },
});
