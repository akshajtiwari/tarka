import { router, useLocalSearchParams } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../../src/components/Button';
import { EmptyState } from '../../../src/components/EmptyState';
import { Header } from '../../../src/components/Header';
import { IconButton } from '../../../src/components/IconButton';
import { ListRow } from '../../../src/components/ListRow';
import type { Change } from '../../../src/features/git/changes';
import { ChangeRow } from '../../../src/features/git/ChangeRow';
import { CommitBox } from '../../../src/features/git/CommitBox';
import * as gitService from '../../../src/features/git/gitService';
import { gitFs, repoDir } from '../../../src/features/git/repo';
import { useGitStatus } from '../../../src/features/git/useGitStatus';
import { font, fontSize } from '../../../src/theme/fonts';
import { space } from '../../../src/theme/spacing';
import { useTheme } from '../../../src/theme/useTheme';

export default function GitScreen() {
  const colors = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const git = useGitStatus(id);
  const dir = repoDir(id);

  // Run a git action, then show the new state. Errors are shown, never swallowed.
  async function run(action: () => Promise<unknown>) {
    try {
      await action();
    } catch (e) {
      Alert.alert('Git error', String(e));
    }
    await git.refresh();
  }

  const openDiff = (change: Change) =>
    router.push({ pathname: '/diff', params: { projectId: id, path: change.path } });

  const section = (title: string) => (
    <Text style={[styles.section, { color: colors.muted }]}>{title}</Text>
  );

  if (!git.loading && !git.isRepo) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
        <Header title="Git" />
        <EmptyState
          title="Not a git repository yet"
          body="Start one to track changes, read diffs and commit."
        >
          <Button
            label="Start a git repository"
            variant="primary"
            onPress={() => run(() => gitService.initRepo(gitFs, dir))}
          />
        </EmptyState>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header
        title="Git"
        right={
          <>
            <IconButton
              icon="history"
              label="History"
              onPress={() => router.push({ pathname: '/history', params: { projectId: id } })}
            />
            <IconButton icon="sync" label="Refresh" onPress={git.refresh} />
          </>
        }
      />
      <ScrollView keyboardShouldPersistTaps="handled">
        <ListRow
          icon="git-branch"
          title={git.branch ?? 'no branch yet'}
          subtitle="Tap to switch or create a branch"
          onPress={() => router.push({ pathname: '/branches', params: { projectId: id } })}
        />
        {section(`Staged (${git.staged.length})`)}
        {git.staged.map((c) => (
          <ChangeRow
            key={`s-${c.path}`}
            change={c}
            staged
            onOpen={() => openDiff(c)}
            onToggle={() => run(() => gitService.unstage(gitFs, dir, c.path))}
          />
        ))}
        {section(`Changes (${git.unstaged.length})`)}
        {git.unstaged.map((c) => (
          <ChangeRow
            key={`u-${c.path}`}
            change={c}
            staged={false}
            onOpen={() => openDiff(c)}
            onToggle={() => run(() => gitService.stage(gitFs, dir, c))}
          />
        ))}
        {git.unstaged.length > 1 && (
          <ListRow
            icon="plus"
            title="Stage all changes"
            onPress={() =>
              run(async () => {
                for (const c of git.unstaged) await gitService.stage(gitFs, dir, c);
              })
            }
          />
        )}
        <CommitBox
          stagedCount={git.staged.length}
          onCommit={(message, author) => run(() => gitService.commit(gitFs, dir, message, author))}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    paddingBottom: space.xs,
    fontFamily: font.uiBold,
    fontSize: fontSize.small,
  },
});
