import { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Button } from '../../components/Button';
import { TextField } from '../../components/TextField';
import { getGitToken, setGitToken } from '../../lib/secure';
import { space } from '../../theme/spacing';
import { useSettings } from './settingsStore';

type Props = { onSaved?: () => void }; // e.g. onboarding moves on; Settings shows a message

// Your name and email for commits, and the token for push, pull and private clones.
export function GitSettings({ onSaved }: Props) {
  const { gitName, gitEmail, setGitIdentity } = useSettings();
  const [name, setName] = useState(gitName);
  const [email, setEmail] = useState(gitEmail);
  const [token, setToken] = useState('');
  const [tokenLoaded, setTokenLoaded] = useState(false); // saving before then would erase it

  useEffect(() => {
    getGitToken().then((saved) => {
      setToken(saved ?? '');
      setTokenLoaded(true);
    });
  }, []);

  async function save() {
    setGitIdentity(name, email);
    await setGitToken(token.trim());
    if (onSaved) onSaved();
    else Alert.alert('Saved', 'Your git name, email and token are saved.');
  }

  return (
    <View style={styles.form}>
      <TextField label="Your name" value={name} onChangeText={setName} placeholder="Ada Lovelace" />
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
      <Button label="Save git settings" variant="primary" onPress={save} disabled={!tokenLoaded} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { paddingHorizontal: space.lg, gap: space.md },
});
