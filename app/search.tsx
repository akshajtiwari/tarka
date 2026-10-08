import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../src/components/Button';
import { Chip } from '../src/components/Chip';
import { Header } from '../src/components/Header';
import { IconButton } from '../src/components/IconButton';
import { ListRow } from '../src/components/ListRow';
import { TextField } from '../src/components/TextField';
import { useEditorCommands } from '../src/features/editor/editorCommand';
import { openFileFromDisk } from '../src/features/editor/fileActions';
import { useWorkspaceStore } from '../src/features/workspace/workspaceStore';
import { listEntries, readForSearch } from '../src/lib/projectFs';
import { searchText, type SearchMatch } from '../src/lib/textSearch';
import { allFilePaths } from '../src/lib/walk';
import { font, fontSize } from '../src/theme/fonts';
import { space } from '../src/theme/spacing';
import { useTheme } from '../src/theme/useTheme';

// Search every file in the project for a word, then jump to the line.
export default function SearchScreen() {
  const colors = useTheme();
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const [query, setQuery] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [results, setResults] = useState<SearchMatch[] | null>(null);

  function search() {
    // shortcut: reads every file on the UI thread, freezes on very large repos; move off the UI thread once git clone lands
    const paths = allFilePaths((p) => listEntries(projectId, p));
    setResults(searchText(paths, (p) => readForSearch(projectId, p), query, { caseSensitive }));
  }

  function open(match: SearchMatch) {
    const error = openFileFromDisk(projectId, match.path);
    if (error) return Alert.alert('Cannot open file', error);
    useWorkspaceStore.getState().setExplorerOpen(false);
    useEditorCommands.getState().send({ name: 'jumpTo', line: match.line });
    router.back();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header
        title="Search in files"
        left={<IconButton icon="arrow-left" label="Back" onPress={() => router.back()} />}
      />
      <View style={styles.form}>
        <TextField label="Find" value={query} onChangeText={setQuery} autoFocus mono />
        <Chip
          label={caseSensitive ? 'Match case: on' : 'Match case: off'}
          onPress={() => setCaseSensitive(!caseSensitive)}
        />
        <Button label="Search" variant="primary" onPress={search} disabled={!query} />
      </View>
      {results && (
        <Text style={[styles.count, { color: colors.muted }]}>
          {results.length === 0 ? 'No matches' : `${results.length} matches`}
        </Text>
      )}
      <FlatList
        data={results ?? []}
        keyExtractor={(m) => `${m.path}:${m.line}`}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <ListRow
            title={item.text}
            subtitle={`${item.path}:${item.line}`}
            onPress={() => open(item)}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  form: { padding: space.lg, gap: space.md },
  count: { paddingHorizontal: space.lg, fontFamily: font.ui, fontSize: fontSize.small },
});
