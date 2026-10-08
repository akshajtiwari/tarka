import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '../../components/Button';
import { TextField } from '../../components/TextField';
import { font, fontSize } from '../../theme/fonts';
import { space } from '../../theme/spacing';
import { useTheme } from '../../theme/useTheme';
import { useSettings } from '../settings/settingsStore';

type Props = {
  stagedCount: number;
  onCommit: (message: string, author: { name: string; email: string }) => Promise<void>;
};

// Message + Commit button. A commit needs your name and email from Settings.
export function CommitBox({ stagedCount, onCommit }: Props) {
  const colors = useTheme();
  const { gitName, gitEmail } = useSettings();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  if (!gitName || !gitEmail) {
    return (
      <View style={styles.box}>
        <Text style={[styles.note, { color: colors.muted }]}>
          Add your name and email in Settings to make commits.
        </Text>
        <Button label="Open settings" onPress={() => router.push('/settings')} />
      </View>
    );
  }

  async function commit() {
    setBusy(true);
    await onCommit(message.trim(), { name: gitName, email: gitEmail });
    setMessage('');
    setBusy(false);
  }

  const files = stagedCount === 1 ? '1 file' : `${stagedCount} files`;
  return (
    <View style={styles.box}>
      <TextField
        label="Commit message"
        value={message}
        onChangeText={setMessage}
        placeholder="what changed"
      />
      <Button
        label={`Commit ${files}`}
        variant="primary"
        onPress={commit}
        disabled={busy || stagedCount === 0 || !message.trim()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { padding: space.lg, gap: space.md },
  note: { fontFamily: font.ui, fontSize: fontSize.small },
});
