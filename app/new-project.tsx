import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '../src/components/Button';
import { TextField } from '../src/components/TextField';
import { createProject } from '../src/features/projects/createProject';
import { TemplatePicker } from '../src/features/projects/TemplatePicker';
import { font, fontSize } from '../src/theme/fonts';
import { space } from '../src/theme/spacing';
import { useTheme } from '../src/theme/useTheme';

export default function NewProjectSheet() {
  const colors = useTheme();
  const [name, setName] = useState('');
  const [templateId, setTemplateId] = useState('js');
  const [error, setError] = useState('');

  function create() {
    try {
      const id = createProject(name, templateId);
      router.replace({ pathname: '/project/[id]/code', params: { id } });
    } catch (e) {
      setError(`Could not create the project folder: ${String(e)}`);
    }
  }

  return (
    <ScrollView style={{ backgroundColor: colors.surface }} keyboardShouldPersistTaps="handled">
      <View style={styles.section}>
        <Text style={[styles.title, { color: colors.text }]}>New project</Text>
        <TextField label="Name" value={name} onChangeText={setName} placeholder="my-app" mono />
      </View>
      <TemplatePicker selectedId={templateId} onSelect={setTemplateId} />
      <View style={styles.section}>
        {error !== '' && <Text style={{ color: colors.error }}>{error}</Text>}
        <Button label="Create project" variant="primary" onPress={create} disabled={!name.trim()} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  section: { padding: space.lg, gap: space.md },
  title: { fontFamily: font.uiBold, fontSize: fontSize.title },
});
