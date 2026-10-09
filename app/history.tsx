import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '../src/components/EmptyState';
import { Header } from '../src/components/Header';
import { IconButton } from '../src/components/IconButton';
import { ListRow } from '../src/components/ListRow';
import { history } from '../src/features/git/gitService';
import { repoDir } from '../src/features/git/repo';
import { gitFs } from '../src/lib/gitFs';
import { timeAgo } from '../src/lib/timeAgo';
import { useTheme } from '../src/theme/useTheme';

type Commit = Awaited<ReturnType<typeof history>>[number];

// The last 50 commits, newest first.
export default function HistoryScreen() {
  const colors = useTheme();
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const [commits, setCommits] = useState<Commit[] | null>(null);

  useEffect(() => {
    // A repo with no commits yet has no history to read.
    history(gitFs, repoDir(projectId)).then(setCommits, () => setCommits([]));
  }, [projectId]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header
        title="History"
        left={<IconButton icon="arrow-left" label="Back" onPress={() => router.back()} />}
      />
      {commits && commits.length === 0 && (
        <EmptyState
          title="No commits yet"
          body="Stage some changes in the Git tab and make your first commit."
        />
      )}
      <FlatList
        data={commits ?? []}
        keyExtractor={(c) => c.oid}
        renderItem={({ item }) => (
          <ListRow
            icon="git-commit"
            title={item.message}
            subtitle={`${item.oid.slice(0, 7)}, ${item.author}, ${timeAgo(item.time)}`}
          />
        )}
      />
    </SafeAreaView>
  );
}
