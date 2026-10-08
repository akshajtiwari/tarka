import Octicons from '@expo/vector-icons/Octicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Button } from '../src/components/Button';
import { ListRow } from '../src/components/ListRow';
import { TextField } from '../src/components/TextField';
import { useEditorStore } from '../src/features/editor/editorStore';
import { saveAllDirty } from '../src/features/editor/fileActions';
import { nameProblem } from '../src/features/explorer/names';
import * as gitService from '../src/features/git/gitService';
import { gitFs, repoDir } from '../src/features/git/repo';
import { useWorkspaceStore } from '../src/features/workspace/workspaceStore';
import { font, fontSize } from '../src/theme/fonts';
import { space } from '../src/theme/spacing';
import { useTheme } from '../src/theme/useTheme';

// Switch to another branch or create a new one.
export default function BranchesSheet() {
  const colors = useTheme();
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const dir = repoDir(projectId);
  const [branches, setBranches] = useState<string[]>([]);
  const [current, setCurrent] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    gitService.listBranches(gitFs, dir).then(setBranches, () => setBranches([]));
    gitService.currentBranch(gitFs, dir).then((b) => setCurrent(b ?? null));
  }, [dir]);

  // Files on disk change when the branch changes, so save first and reopen tabs afterwards.
  async function change(action: () => Promise<unknown>) {
    saveAllDirty(projectId);
    try {
      await action();
      useEditorStore.getState().reset();
      useWorkspaceStore.getState().refreshTree();
      router.back();
    } catch (e) {
      Alert.alert('Could not switch branch', String(e));
    }
  }

  function create() {
    const problem = nameProblem(newName);
    if (problem) return Alert.alert('Check the name', problem);
    change(() => gitService.createBranch(gitFs, dir, newName.trim()));
  }

  return (
    <View style={{ backgroundColor: colors.surface }}>
      <Text style={[styles.title, { color: colors.text }]}>Branches</Text>
      {branches.map((b) => (
        <ListRow
          key={b}
          icon="git-branch"
          title={b}
          onPress={() => b !== current && change(() => gitService.switchBranch(gitFs, dir, b))}
          right={b === current && <Octicons name="check" size={18} color={colors.accent} />}
        />
      ))}
      <View style={styles.form}>
        <TextField
          label="New branch"
          value={newName}
          onChangeText={setNewName}
          placeholder="feature-x"
          mono
        />
        <Button label="Create and switch" onPress={create} disabled={!newName.trim()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { padding: space.lg, fontFamily: font.uiBold, fontSize: fontSize.title },
  form: { padding: space.lg, gap: space.md },
});
