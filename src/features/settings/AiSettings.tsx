import Octicons from '@expo/vector-icons/Octicons';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../components/Button';
import { ListRow } from '../../components/ListRow';
import { TextField } from '../../components/TextField';
import { getSecret, setSecret } from '../../lib/secure';
import { font, fontSize } from '../../theme/fonts';
import { space } from '../../theme/spacing';
import { useTheme } from '../../theme/useTheme';
import { AI_PROVIDERS } from '../agent/aiProviders';
import { useSettings, type AiProvider } from './settingsStore';

const providerIds = Object.keys(AI_PROVIDERS) as AiProvider[];

type Props = {
  onSaved?: () => void; // e.g. onboarding moves on; Settings shows a message
  showMissing?: boolean; // say so when no key is saved yet
};

// Which AI the agent uses. You bring your own key; it is stored in secure storage.
export function AiSettings({ onSaved, showMissing }: Props) {
  const colors = useTheme();
  const { aiProvider, aiModels, aiBaseUrl, setAi } = useSettings();
  const [provider, setProvider] = useState<AiProvider>(aiProvider);
  const [model, setModel] = useState(aiModels[aiProvider] ?? '');
  const [baseUrl, setBaseUrl] = useState(aiBaseUrl);
  const [key, setKey] = useState('');
  const [keyLoaded, setKeyLoaded] = useState(false); // saving before then would erase the saved key
  const info = AI_PROVIDERS[provider];

  // Switching provider shows that provider's model and key. The key field is cleared on the tap
  // and a late answer is ignored, so one provider's key can never end up saved under another.
  function choose(next: AiProvider) {
    if (next === provider) return;
    setKey('');
    setKeyLoaded(false);
    setModel(useSettings.getState().aiModels[next] ?? '');
    setProvider(next);
  }

  useEffect(() => {
    let live = true;
    getSecret(info.secret).then((saved) => {
      if (!live) return;
      setKey(saved ?? '');
      setKeyLoaded(true);
    });
    return () => {
      live = false;
    };
  }, [info.secret]);

  async function save() {
    setAi(provider, model, baseUrl);
    await setSecret(info.secret, key.trim());
    if (onSaved) onSaved();
    else Alert.alert('Saved', 'The agent will use these settings.');
  }

  return (
    <View>
      {providerIds.map((id) => (
        <ListRow
          key={id}
          title={AI_PROVIDERS[id].name}
          subtitle={AI_PROVIDERS[id].subtitle}
          onPress={() => choose(id)}
          right={provider === id && <Octicons name="check" size={18} color={colors.accent} />}
        />
      ))}
      <View style={styles.form}>
        {showMissing && keyLoaded && !key && !info.needsServer && (
          <Text style={[styles.missing, { color: colors.warning }]}>
            Not set up yet: add a key to use the agent.
          </Text>
        )}
        {info.needsServer && (
          <TextField
            label="Server address"
            value={baseUrl}
            onChangeText={setBaseUrl}
            placeholder="http://192.168.1.20:11434/v1"
            mono
          />
        )}
        <TextField
          label="Model"
          value={model}
          onChangeText={setModel}
          placeholder={info.defaultModel || 'qwen2.5-coder:3b'}
          mono
        />
        <TextField
          label="API key"
          value={key}
          onChangeText={setKey}
          placeholder={info.keyHint}
          mono
          secret
        />
        <Button label="Save AI settings" variant="primary" onPress={save} disabled={!keyLoaded} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { paddingHorizontal: space.lg, gap: space.md, paddingTop: space.md },
  missing: { fontFamily: font.ui, fontSize: fontSize.small },
});
