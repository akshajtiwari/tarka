import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';

import { ListRow } from '../src/components/ListRow';
import { TextField } from '../src/components/TextField';
import { openFileFromDisk } from '../src/features/editor/fileActions';
import { useWorkspaceStore } from '../src/features/workspace/workspaceStore';
import { fuzzyFilter } from '../src/lib/fuzzy';
import { listEntries } from '../src/lib/projectFs';
import { allFilePaths } from '../src/lib/walk';
import { space } from '../src/theme/spacing';
import { useTheme } from '../src/theme/useTheme';

// Type part of a file name to jump to it, e.g. "mnjs" for src/main.js.
export default function QuickOpenSheet() {
  const colors = useTheme();
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const [query, setQuery] = useState('');
  const paths = useMemo(() => allFilePaths((p) => listEntries(projectId, p)), [projectId]);
  const results = fuzzyFilter(query, paths, 30);

  function open(path: string) {
    const error = openFileFromDisk(projectId, path);
    if (error) return Alert.alert('Cannot open file', error);
    useWorkspaceStore.getState().setExplorerOpen(false);
    router.back();
  }

  return (
    <View style={{ backgroundColor: colors.surface, height: 480 }}>
      <View style={styles.field}>
        <TextField label="Go to file" value={query} onChangeText={setQuery} autoFocus mono />
      </View>
      <FlatList
        data={results}
        keyExtractor={(p) => p}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <ListRow
            icon="file"
            title={item.split('/').pop()!}
            subtitle={item}
            label={`Open ${item}`}
            onPress={() => open(item)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({ field: { padding: space.lg } });
