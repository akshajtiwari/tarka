import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { BackHandler, StyleSheet, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../src/components/Button';
import { PythonStep } from '../src/features/onboarding/PythonStep';
import { STEPS } from '../src/features/onboarding/steps';
import { TipsList } from '../src/features/onboarding/TipsList';
import { usePythonInstall } from '../src/features/onboarding/usePythonInstall';
import { AiSettings } from '../src/features/settings/AiSettings';
import { GitSettings } from '../src/features/settings/GitSettings';
import { ProjectsFolderSettings } from '../src/features/settings/ProjectsFolderSettings';
import { useSettings } from '../src/features/settings/settingsStore';
import { ThemeSettings } from '../src/features/settings/ThemeSettings';
import { TerminalBridge } from '../src/features/terminal/TerminalBridge';
import { TermuxSettings } from '../src/features/termux/TermuxSettings';
import { font, fontSize } from '../src/theme/fonts';
import { radius, space } from '../src/theme/spacing';
import { useTheme } from '../src/theme/useTheme';

// First-launch setup. Required: the home screen sends you here until it's finished.
// Theme, projects folder and Python must be done; git and AI can wait.
export default function WelcomeScreen() {
  const colors = useTheme();
  const [index, setIndex] = useState(0);
  const python = usePythonInstall(); // starts downloading right away, in the background
  const step = STEPS[index];

  // Documents/TARKA is the suggested folder; the folder step shows it selected.
  useEffect(() => {
    useSettings.getState().setProjectsLocation('documents');
  }, []);

  // Android back goes to the previous step.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (index === 0) return false;
      setIndex(index - 1);
      return true;
    });
    return () => sub.remove();
  }, [index]);

  const next = () => setIndex((i) => Math.min(i + 1, STEPS.length - 1));

  function finish() {
    useSettings.getState().setOnboarded(true);
    router.replace('/');
  }

  function mainButton() {
    if (step.optional) return <Button label="Set up later" onPress={next} />;
    if (step.key === 'done')
      return <Button label="Start coding" variant="primary" onPress={finish} />;
    const waiting = step.key === 'python' && python.status !== 'ready';
    const label = index === 0 ? 'Start setup' : 'Continue';
    return <Button label={label} variant="primary" onPress={next} disabled={waiting} />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.progress}>
        <View style={[styles.track, { backgroundColor: colors.raised }]}>
          <View
            style={[
              styles.fill,
              { backgroundColor: colors.accent, width: `${((index + 1) / STEPS.length) * 100}%` },
            ]}
          />
        </View>
        <Text style={[styles.count, { color: colors.muted }]}>
          Step {index + 1} of {STEPS.length}
        </Text>
      </View>
      <KeyboardAwareScrollView
        keyboardShouldPersistTaps="handled"
        bottomOffset={96}
        contentContainerStyle={styles.content}
      >
        <Text style={[styles.title, { color: colors.text }]}>{step.title}</Text>
        {step.body && <Text style={[styles.body, { color: colors.muted }]}>{step.body}</Text>}
        {step.key === 'theme' && <ThemeSettings />}
        {step.key === 'folder' && <ProjectsFolderSettings />}
        {step.key === 'python' && <PythonStep status={python.status} onRetry={python.retry} />}
        {step.key === 'git' && <GitSettings onSaved={next} />}
        {step.key === 'ai' && <AiSettings onSaved={next} />}
        {step.key === 'termux' && <TermuxSettings />}
        {step.key === 'tips' && <TipsList />}
      </KeyboardAwareScrollView>
      <View style={[styles.footer, { borderColor: colors.line }]}>
        {index > 0 && (
          <View style={styles.half}>
            <Button label="Back" onPress={() => setIndex(index - 1)} />
          </View>
        )}
        <View style={styles.half}>{mainButton()}</View>
      </View>
      <TerminalBridge />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  progress: { paddingHorizontal: space.lg, paddingTop: space.lg, gap: space.sm },
  track: { height: 4, borderRadius: radius.sm, overflow: 'hidden' },
  fill: { height: 4 },
  count: { fontFamily: font.ui, fontSize: fontSize.small },
  content: { paddingTop: space.xl, paddingBottom: space.xxl },
  title: {
    paddingHorizontal: space.lg,
    fontFamily: font.uiBold,
    fontSize: fontSize.display,
    lineHeight: 36,
  },
  body: {
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    paddingBottom: space.md,
    fontFamily: font.ui,
    fontSize: fontSize.body,
    lineHeight: 24,
  },
  footer: {
    flexDirection: 'row',
    gap: space.md,
    padding: space.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  half: { flex: 1 },
});
