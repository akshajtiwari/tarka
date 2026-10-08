import Octicons from '@expo/vector-icons/Octicons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../src/components/Button';
import { Header } from '../src/components/Header';
import { IconButton } from '../src/components/IconButton';
import { ListRow } from '../src/components/ListRow';
import { TextField } from '../src/components/TextField';
import { useSettings, type ThemeChoice } from '../src/features/settings/settingsStore';
import { getGitToken, setGitToken } from '../src/lib/secure';
import { font, fontSize } from '../src/theme/fonts';
import { space } from '../src/theme/spacing';
import { useTheme } from '../src/theme/useTheme';

const themes: { value: ThemeChoice; title: string }[] = [
  { value: 'system', title: 'Same as the phone' },
  { value: 'dark', title: 'Dark (slate)' },
  { value: 'light', title: 'Light (chalk)' },
];

export default function SettingsScreen() {
  const colors = useTheme();
  const { theme, setTheme, gitName, gitEmail, setGitIdentity } = useSettings();
  const [name, setName] = useState(gitName);
  const [email, setEmail] = useState(gitEmail);
  const [token, setToken] = useState('');

  useEffect(() => {
    getGitToken().then((saved) => setToken(saved ?? ''));
  }, []);

  async function saveGit() {
    setGitIdentity(name, email);
    await setGitToken(token.trim());
    Alert.alert('Saved', 'Your git name, email and token are saved.');
  }

  const section = (title: string) => (
    <Text style={[styles.section, { color: colors.muted }]}>{title}</Text>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header
        title="Settings"
        left={<IconButton icon="arrow-left" label="Back" onPress={() => router.back()} />}
      />
      <ScrollView keyboardShouldPersistTaps="handled">
        {section('Theme')}
        {themes.map((t) => (
          <ListRow
            key={t.value}
            title={t.title}
            onPress={() => setTheme(t.value)}
            right={theme === t.value && <Octicons name="check" size={18} color={colors.accent} />}
          />
        ))}
        {section('Git')}
        <View style={styles.form}>
          <TextField
            label="Your name"
            value={name}
            onChangeText={setName}
            placeholder="Ada Lovelace"
          />
          <TextField
            label="Your email"
            value={email}
            onChangeText={setEmail}
            placeholder="ada@example.com"
          />
          <TextField
            label="Access token (for push, pull and private clones)"
            value={token}
            onChangeText={setToken}
            placeholder="ghp_…"
            mono
            secret
          />
          <Button label="Save git settings" variant="primary" onPress={saveGit} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: space.lg,
    paddingTop: space.xl,
    paddingBottom: space.sm,
    fontFamily: font.uiBold,
    fontSize: fontSize.small,
  },
  form: { paddingHorizontal: space.lg, gap: space.md, paddingBottom: space.xxl },
});
