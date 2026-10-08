import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Button } from '../src/components/Button';
import { ListRow } from '../src/components/ListRow';
import { TextField } from '../src/components/TextField';
import {
  deleteEntry,
  duplicateFile,
  newFile,
  newFolder,
  renameEntry,
} from '../src/features/explorer/fileOps';
import { nameProblem } from '../src/features/explorer/names';
import { font, fontSize } from '../src/theme/fonts';
import { space } from '../src/theme/spacing';
import { useTheme } from '../src/theme/useTheme';

type Mode = 'menu' | 'new-file' | 'new-folder' | 'rename';

const fieldLabel = { 'new-file': 'File name', 'new-folder': 'Folder name', rename: 'New name' };

// Long-press sheet for an explorer row. `path` is "" for the project root (the + button).
export default function FileActionsSheet() {
  const colors = useTheme();
  const params = useLocalSearchParams<{ projectId: string; path: string; isDir: string }>();
  const { projectId, path } = params;
  const isDir = params.isDir === 'true';
  const name = path ? path.split('/').pop()! : 'Project';
  const [mode, setMode] = useState<Mode>('menu');
  const [text, setText] = useState('');

  // Every action can fail (name taken, disk error): show the reason instead of crashing.
  function attempt(action: () => void) {
    try {
      action();
      router.back();
    } catch (e) {
      Alert.alert('That did not work', e instanceof Error ? e.message : String(e));
    }
  }

  function confirmName() {
    const problem = nameProblem(text);
    if (problem) return Alert.alert('Check the name', problem);
    if (mode === 'new-file') attempt(() => newFile(projectId, path, text));
    if (mode === 'new-folder') attempt(() => newFolder(projectId, path, text));
    if (mode === 'rename') attempt(() => renameEntry(projectId, path, isDir, text));
  }

  function confirmDelete() {
    Alert.alert(
      `Delete ${name}?`,
      isDir ? 'The folder and everything in it will be removed.' : '',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => attempt(() => deleteEntry(projectId, path, isDir)),
        },
      ],
    );
  }

  if (mode !== 'menu') {
    return (
      <View style={[styles.form, { backgroundColor: colors.surface }]}>
        <TextField label={fieldLabel[mode]} value={text} onChangeText={setText} autoFocus mono />
        <Button label="Done" variant="primary" onPress={confirmName} />
      </View>
    );
  }

  return (
    <View style={{ backgroundColor: colors.surface }}>
      <Text style={[styles.title, { color: colors.text }]}>{name}</Text>
      {isDir && <ListRow icon="file-added" title="New file" onPress={() => setMode('new-file')} />}
      {isDir && (
        <ListRow icon="file-directory" title="New folder" onPress={() => setMode('new-folder')} />
      )}
      {path !== '' && (
        <ListRow
          icon="pencil"
          title="Rename"
          onPress={() => {
            setText(name);
            setMode('rename');
          }}
        />
      )}
      {!isDir && (
        <ListRow
          icon="copy"
          title="Duplicate"
          onPress={() => attempt(() => duplicateFile(projectId, path))}
        />
      )}
      {path !== '' && <ListRow icon="trash" title="Delete" onPress={confirmDelete} />}
    </View>
  );
}

const styles = StyleSheet.create({
  title: { padding: space.lg, fontFamily: font.uiBold, fontSize: fontSize.title },
  form: { padding: space.lg, gap: space.md },
});
