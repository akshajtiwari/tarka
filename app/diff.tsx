import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '../src/components/EmptyState';
import { Header } from '../src/components/Header';
import { IconButton } from '../src/components/IconButton';
import { diffRows, type DiffRow } from '../src/features/git/diffRows';
import { DiffView } from '../src/features/git/DiffView';
import { committedText } from '../src/features/git/gitService';
import { gitFs, repoDir } from '../src/features/git/repo';
import { readForSearch } from '../src/lib/projectFs';
import { useTheme } from '../src/theme/useTheme';

// What changed in one file since the last commit.
export default function DiffScreen() {
  const colors = useTheme();
  const { projectId, path } = useLocalSearchParams<{ projectId: string; path: string }>();
  const [rows, setRows] = useState<DiffRow[] | null>(null);

  useEffect(() => {
    committedText(gitFs, repoDir(projectId), path).then((before) => {
      const now = readForSearch(projectId, path) ?? ''; // deleted or binary files read as empty
      setRows(diffRows(before, now));
    });
  }, [projectId, path]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header
        title={path.split('/').pop()!}
        left={<IconButton icon="arrow-left" label="Back" onPress={() => router.back()} />}
      />
      {rows && rows.length === 0 && (
        <EmptyState
          title="No text changes"
          body="The file is the same as in the last commit, or it is not a text file."
        />
      )}
      {rows && rows.length > 0 && <DiffView rows={rows} />}
    </SafeAreaView>
  );
}
