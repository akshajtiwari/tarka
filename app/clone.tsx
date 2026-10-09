import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../src/components/Button';
import { Header } from '../src/components/Header';
import { IconButton } from '../src/components/IconButton';
import { TextField } from '../src/components/TextField';
import { cloneProject, nameFromUrl } from '../src/features/projects/cloneProject';
import { font, fontSize } from '../src/theme/fonts';
import { space } from '../src/theme/spacing';
import { useTheme } from '../src/theme/useTheme';

export default function CloneScreen() {
  const colors = useTheme();
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('Connecting…');

  async function clone() {
    setBusy(true);
    try {
      const id = await cloneProject(url, name || nameFromUrl(url), ({ phase, loaded, total }) =>
        setProgress(total ? `${phase} ${Math.round((loaded / total) * 100)}%` : `${phase}…`),
      );
      router.replace({ pathname: '/project/[id]/code', params: { id } });
    } catch (e) {
      Alert.alert(
        'Clone failed',
        `${String(e)}\n\nCheck the URL. Private repos need a token in Settings.`,
      );
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header
        title="Clone repository"
        left={<IconButton icon="arrow-left" label="Back" onPress={() => router.back()} />}
      />
      <View style={styles.form}>
        <TextField
          label="Repository URL"
          value={url}
          onChangeText={setUrl}
          placeholder="https://github.com/user/repo.git"
          mono
        />
        <TextField
          label="Project name"
          value={name}
          onChangeText={setName}
          placeholder={nameFromUrl(url) || 'my-repo'}
        />
        <Text style={[styles.note, { color: colors.muted }]}>
          Only the latest commit of the main branch is downloaded, to keep it fast on a phone.
        </Text>
        {busy ? (
          <View style={styles.progress}>
            <ActivityIndicator color={colors.accent} />
            <Text style={[styles.note, { color: colors.text }]}>{progress}</Text>
          </View>
        ) : (
          <Button label="Clone" variant="primary" onPress={clone} disabled={!url.trim()} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  form: { padding: space.lg, gap: space.md },
  note: { fontFamily: font.ui, fontSize: fontSize.small },
  progress: { flexDirection: 'row', alignItems: 'center', gap: space.md },
});
