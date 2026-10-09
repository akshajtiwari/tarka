import Octicons from '@expo/vector-icons/Octicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Button } from '../src/components/Button';
import { ListRow } from '../src/components/ListRow';
import { TextField } from '../src/components/TextField';
import { reloadOpenTabs, saveAllDirty } from '../src/features/editor/fileActions';
import { nameProblem } from '../src/features/explorer/names';
import * as gitService from '../src/features/git/gitService';
import { repoDir } from '../src/features/git/repo';
import { gitFs } from '../src/lib/gitFs';
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

  // Switching changes files on disk: save first, refuse if there is uncommitted work
  // (it would be overwritten), then reload the open tabs.
  async function switchTo(branch: string) {
    try {
      const saveErrors = saveAllDirty(projectId);
      if (saveErrors.length > 0) throw new Error(saveErrors.join('\n'));
      await gitService.assertClean(gitFs, dir);
      await gitService.switchBranch(gitFs, dir, branch);
      reloadOpenTabs(projectId);
      useWorkspaceStore.getState().refreshTree();
      router.back();
    } catch (e) {
      Alert.alert('Could not switch branch', String(e));
    }
  }

  // A new branch starts from the current commit, so no file changes and the tabs stay as they are.
  async function create() {
    const problem = nameProblem(newName);
    if (problem) return Alert.alert('Check the name', problem);
    try {
      await gitService.createBranch(gitFs, dir, newName.trim());
      router.back();
    } catch (e) {
      Alert.alert('Could not create the branch', String(e));
    }
  }

  return (
    <View style={{ backgroundColor: colors.surface }}>
      <Text style={[styles.title, { color: colors.text }]}>Branches</Text>
      {branches.map((b) => (
        <ListRow
          key={b}
          icon="git-branch"
          title={b}
          onPress={() => b !== current && switchTo(b)}
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
