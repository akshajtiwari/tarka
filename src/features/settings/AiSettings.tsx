import Octicons from '@expo/vector-icons/Octicons';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Button } from '../../components/Button';
import { ListRow } from '../../components/ListRow';
import { TextField } from '../../components/TextField';
import { getSecret, setSecret } from '../../lib/secure';
import { space } from '../../theme/spacing';
import { useTheme } from '../../theme/useTheme';
import { DEFAULT_ANTHROPIC_MODEL } from '../agent/providers/anthropic';
import { useSettings, type AiProvider } from './settingsStore';

// Which AI the agent uses. You bring your own key; it is stored in secure storage.
export function AiSettings() {
  const colors = useTheme();
  const { aiProvider, aiModel, aiBaseUrl, setAi } = useSettings();
  const [provider, setProvider] = useState<AiProvider>(aiProvider);
  const [model, setModel] = useState(aiModel);
  const [baseUrl, setBaseUrl] = useState(aiBaseUrl);
  const [key, setKey] = useState('');
  const keyName = provider === 'anthropic' ? 'anthropic-key' : 'openai-key';

  useEffect(() => {
    getSecret(keyName).then((saved) => setKey(saved ?? ''));
  }, [keyName]);

  async function save() {
    setAi(provider, model, baseUrl);
    await setSecret(keyName, key.trim());
    Alert.alert('Saved', 'The agent will use these settings.');
  }

  const check = (on: boolean) =>
    on ? <Octicons name="check" size={18} color={colors.accent} /> : null;

  return (
    <View>
      <ListRow
        title="Anthropic (Claude)"
        onPress={() => setProvider('anthropic')}
        right={check(provider === 'anthropic')}
      />
      <ListRow
        title="OpenAI-compatible"
        subtitle="OpenAI, OpenRouter, or Ollama on your laptop"
        onPress={() => setProvider('openai')}
        right={check(provider === 'openai')}
      />
      <View style={styles.form}>
        {provider === 'openai' && (
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
          placeholder={provider === 'anthropic' ? DEFAULT_ANTHROPIC_MODEL : 'qwen2.5-coder:3b'}
          mono
        />
        <TextField
          label="API key"
          value={key}
          onChangeText={setKey}
          placeholder={provider === 'anthropic' ? 'sk-ant-…' : 'not needed for Ollama'}
          mono
          secret
        />
        <Button label="Save AI settings" variant="primary" onPress={save} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { paddingHorizontal: space.lg, gap: space.md, paddingTop: space.md },
});
