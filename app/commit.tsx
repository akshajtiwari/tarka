import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BusyLine } from '../src/components/BusyLine';
import { EmptyState } from '../src/components/EmptyState';
import { Header } from '../src/components/Header';
import { IconButton } from '../src/components/IconButton';
import { ChangeRow } from '../src/features/git/ChangeRow';
import { commitDetail } from '../src/features/git/gitService';
import { repoDir } from '../src/features/git/repo';
import { gitFs } from '../src/lib/gitFs';
import { timeAgo } from '../src/lib/timeAgo';
import { font, fontSize } from '../src/theme/fonts';
import { space } from '../src/theme/spacing';
import { useTheme } from '../src/theme/useTheme';

type Detail = Awaited<ReturnType<typeof commitDetail>>;

function fileCount(n: number) {
  return n === 1 ? '1 file' : `${n} files`;
}

// One past commit: its message and the files it changed. Tap a file to see its diff.
export default function CommitScreen() {
  const colors = useTheme();
  const { projectId, oid } = useLocalSearchParams<{ projectId: string; oid: string }>();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    commitDetail(gitFs, repoDir(projectId), oid).then(setDetail, (e) =>
      setError(e instanceof Error ? e.message : String(e)),
    );
  }, [projectId, oid]);

  function openDiff(path: string) {
    const from = detail?.parent ?? '';
    router.push({ pathname: '/diff', params: { projectId, path, from, to: oid } });
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header
        title={`Commit ${oid.slice(0, 7)}`}
        left={<IconButton icon="arrow-left" label="Back" onPress={() => router.back()} />}
      />
      {!detail && !error && <BusyLine label="Reading the commit…" />}
      {error !== '' && <EmptyState title="Could not read this commit" body={error} />}
      {detail && (
        <FlatList
          data={detail.files ?? []}
          keyExtractor={(f) => f.path}
          ListHeaderComponent={
            <View style={[styles.summary, { borderColor: colors.line }]}>
              <Text style={[styles.message, { color: colors.text }]}>{detail.message}</Text>
              <Text style={[styles.meta, { color: colors.muted }]}>
                {`${detail.author}, ${timeAgo(detail.time)}`}
                {detail.files && `, ${fileCount(detail.files.length)}`}
              </Text>
            </View>
          }
          ListEmptyComponent={
            detail.files ? (
              <EmptyState title="No file changes" body="This commit did not change any files." />
            ) : (
              <EmptyState
                title="Changes not downloaded"
                body="Cloning only downloads the newest commit, so what it changed is not known."
              />
            )
          }
          renderItem={({ item }) => <ChangeRow change={item} onOpen={() => openDiff(item.path)} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  summary: {
    padding: space.lg,
    gap: space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  message: { fontFamily: font.ui, fontSize: fontSize.body, lineHeight: 24 },
  meta: { fontFamily: font.ui, fontSize: fontSize.small },
});
