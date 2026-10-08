import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Button } from '../src/components/Button';
import { TextField } from '../src/components/TextField';
import { deleteProjectFolder } from '../src/features/projects/projectFolder';
import { useProjectStore } from '../src/features/projects/projectStore';
import { font, fontSize } from '../src/theme/fonts';
import { space } from '../src/theme/spacing';
import { useTheme } from '../src/theme/useTheme';

export default function ProjectActionsSheet() {
  const colors = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const project = useProjectStore((s) => s.projects.find((p) => p.id === id));
  const renameProject = useProjectStore((s) => s.renameProject);
  const removeProject = useProjectStore((s) => s.removeProject);
  const [name, setName] = useState(project?.name ?? '');

  if (!project) return null;

  function rename() {
    renameProject(project!.id, name.trim());
    router.back();
  }

  function confirmDelete() {
    Alert.alert(`Delete ${project!.name}?`, 'This removes the project and all its files from the phone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteProjectFolder(project!.id);
          removeProject(project!.id);
          router.back();
        },
      },
    ]);
  }

  return (
    <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
      <Text style={[styles.title, { color: colors.text }]}>{project.name}</Text>
      <TextField label="Name" value={name} onChangeText={setName} />
      <Button label="Rename" variant="primary" onPress={rename} disabled={!name.trim()} />
      <Button label="Delete project" onPress={confirmDelete} />
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { padding: space.lg, gap: space.md },
  title: { fontFamily: font.uiBold, fontSize: fontSize.title },
});
