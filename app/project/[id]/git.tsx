import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BusyLine } from '../../../src/components/BusyLine';
import { Button } from '../../../src/components/Button';
import { EmptyState } from '../../../src/components/EmptyState';
import { Header } from '../../../src/components/Header';
import { Hint } from '../../../src/components/Hint';
import { IconButton } from '../../../src/components/IconButton';
import { ListRow } from '../../../src/components/ListRow';
import { HomeButton } from '../../../src/components/HomeButton';
import type { Change } from '../../../src/features/git/changes';
import { ChangeRow } from '../../../src/features/git/ChangeRow';
import { CommitBox } from '../../../src/features/git/CommitBox';
import * as gitService from '../../../src/features/git/gitService';
import { pullProject, pushProject } from '../../../src/features/git/remoteActions';
import { repoDir } from '../../../src/features/git/repo';
import { gitFs } from '../../../src/lib/gitFs';
import { useGitStatus } from '../../../src/features/git/useGitStatus';
import { font, fontSize } from '../../../src/theme/fonts';
import { space } from '../../../src/theme/spacing';
import { useTheme } from '../../../src/theme/useTheme';

export default function GitScreen() {
  const colors = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const git = useGitStatus(id);
  const dir = repoDir(id);

  const [busy, setBusy] = useState<string | null>(null); // what is running, e.g. "Pulling…"

  // Run one git action at a time, then show the new state. Errors are shown, never swallowed.
  // A text result (from push/pull) is shown to the user. Returns true when it worked.
  async function run(label: string, action: () => Promise<string | void>): Promise<boolean> {
    if (busy) return false;
    setBusy(label);
    let ok = true;
    try {
      const message = await action();
      if (message) Alert.alert('Done', message);
    } catch (e) {
      ok = false;
      Alert.alert('Git error', String(e));
    }
    setBusy(null);
    await git.refresh();
    return ok;
  }

  const openDiff = (change: Change) =>
    router.push({ pathname: '/diff', params: { projectId: id, path: change.path } });

  const section = (title: string) => (
    <Text style={[styles.section, { color: colors.muted }]}>{title}</Text>
  );

  if (!git.loading && !git.isRepo) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
        <Header title="Git" left={<HomeButton />} />
        {busy && <BusyLine label={busy} />}
        <EmptyState
          title="Not a git repository yet"
          body="Start one to track changes, read diffs and commit."
        >
          <Button
            label="Start a git repository"
            variant="primary"
            onPress={() => run('Starting a repository…', () => gitService.initRepo(gitFs, dir))}
          />
        </EmptyState>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header
        title="Git"
        left={<HomeButton />}
        right={
          <>
            <IconButton
              icon="history"
              label="History"
              onPress={() => router.push({ pathname: '/history', params: { projectId: id } })}
            />
            <IconButton
              icon="arrow-down"
              label="Pull"
              onPress={() => run('Pulling…', () => pullProject(id))}
            />
            <IconButton
              icon="arrow-up"
              label="Push"
              onPress={() => run('Pushing…', () => pushProject(id))}
            />
            <IconButton icon="sync" label="Refresh" onPress={git.refresh} />
          </>
        }
      />
      {/* Keyboard-aware, so the commit message box stays visible while typing. */}
      {busy && <BusyLine label={busy} />}
      {!busy && git.loading && <BusyLine label="Reading changes…" />}
      <KeyboardAwareScrollView keyboardShouldPersistTaps="handled" bottomOffset={96}>
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
            onToggle={() =>
              run(`Unstaging ${c.path}…`, () => gitService.unstage(gitFs, dir, c.path))
            }
          />
        ))}
        {section(`Changes (${git.unstaged.length})`)}
        {git.unstaged.map((c) => (
          <ChangeRow
            key={`u-${c.path}`}
            change={c}
            staged={false}
            onOpen={() => openDiff(c)}
            onToggle={() => run(`Staging ${c.path}…`, () => gitService.stage(gitFs, dir, c))}
          />
        ))}
        {!git.loading && git.staged.length + git.unstaged.length === 0 && (
          <Hint text="Nothing changed since the last commit. Edits you make show up here." />
        )}
        {git.unstaged.length > 1 && (
          <ListRow
            icon="plus"
            title="Stage all changes"
            onPress={() =>
              run('Staging all changes…', () => gitService.stageAll(gitFs, dir, git.unstaged))
            }
          />
        )}
        <CommitBox
          stagedCount={git.staged.length}
          onCommit={(message, author) =>
            run('Committing…', async () => {
              await gitService.commit(gitFs, dir, message, author); // (returns the commit id; not shown)
            })
          }
        />
      </KeyboardAwareScrollView>
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
