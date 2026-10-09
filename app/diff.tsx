import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '../src/components/EmptyState';
import { Header } from '../src/components/Header';
import { IconButton } from '../src/components/IconButton';
import { diffRows, type DiffRow } from '../src/features/git/diffRows';
import { DiffView } from '../src/features/git/DiffView';
import { committedText } from '../src/features/git/gitService';
import { repoDir } from '../src/features/git/repo';
import { gitFs } from '../src/lib/gitFs';
import { BINARY, fileAt, readForSearch } from '../src/lib/projectFs';
import { useTheme } from '../src/theme/useTheme';

// What changed in one file since the last commit, or in a past commit.
export default function DiffScreen() {
  const colors = useTheme();
  // `to` = a past commit: show what that commit changed (from its parent `from`, "" for none).
  const { projectId, path, from, to } = useLocalSearchParams<{
    projectId: string;
    path: string;
    from?: string;
    to?: string;
  }>();
  const [rows, setRows] = useState<DiffRow[] | null>(null);

  useEffect(() => {
    const dir = repoDir(projectId);
    if (to) {
      const isText = !BINARY.test(path); // an image or other non-text file: no text diff
      const before = isText && from ? committedText(gitFs, dir, path, from) : '';
      const after = isText ? committedText(gitFs, dir, path, to) : '';
      Promise.all([before, after]).then(([a, b]) => setRows(diffRows(a, b)));
      return;
    }
    committedText(gitFs, dir, path).then((before) => {
      const now = readForSearch(projectId, path);
      // null = binary, very large, or deleted. Only a deleted file should look like all-removed.
      if (now === null && fileAt(projectId, path).exists) return setRows([]);
      setRows(diffRows(before, now ?? ''));
    });
  }, [projectId, path, from, to]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header
        title={path.split('/').pop()!}
        left={<IconButton icon="arrow-left" label="Back" onPress={() => router.back()} />}
      />
      {rows && rows.length === 0 && (
        <EmptyState
          title="No text changes"
          body="The text is the same before and after, or it is not a text file."
        />
      )}
      {rows && rows.length > 0 && <DiffView rows={rows} />}
    </SafeAreaView>
  );
}
