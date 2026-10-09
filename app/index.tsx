import { Redirect, router } from 'expo-router';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../src/components/Button';
import { EmptyState } from '../src/components/EmptyState';
import { IconButton } from '../src/components/IconButton';
import { folderPath, projectDir } from '../src/features/projects/projectFolder';
import { ProjectRow } from '../src/features/projects/ProjectRow';
import { sortByRecent, useProjectStore } from '../src/features/projects/projectStore';
import { useSettings } from '../src/features/settings/settingsStore';
import { useSettingsReady } from '../src/features/settings/useSettingsReady';
import { font, fontSize } from '../src/theme/fonts';
import { space } from '../src/theme/spacing';
import { useTheme } from '../src/theme/useTheme';

export default function HomeScreen() {
  const colors = useTheme();
  const projects = useProjectStore((s) => s.projects);
  const markOpened = useProjectStore((s) => s.markOpened);
  const removeProject = useProjectStore((s) => s.removeProject);
  const ready = useSettingsReady();
  const onboarded = useSettings((s) => s.onboarded);

  function openProject(id: string) {
    // The folder can be deleted or moved in a file manager (Documents/TARKA is visible there).
    const dir = projectDir(id);
    if (!dir.exists) {
      return Alert.alert(
        'Project folder is missing',
        `${folderPath(dir)} was moved or deleted, or TARKA can no longer use your files.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Remove from list', style: 'destructive', onPress: () => removeProject(id) },
        ],
      );
    }
    markOpened(id);
    router.push({ pathname: '/project/[id]/code', params: { id } });
  }

  if (!ready) return null;
  if (!onboarded) return <Redirect href="/welcome" />;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.bg }]}>
      <View style={styles.top}>
        <Text style={[styles.title, { color: colors.text }]}>Projects</Text>
        <IconButton icon="gear" label="Settings" onPress={() => router.push('/settings')} />
      </View>

      <FlatList
        data={sortByRecent(projects)}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => (
          <ProjectRow
            project={item}
            onOpen={() => openProject(item.id)}
            onShowActions={() =>
              router.push({ pathname: '/project-actions', params: { id: item.id } })
            }
          />
        )}
        ListEmptyComponent={
          <EmptyState
            title="No projects yet"
            body="Create one from a template, or clone a git repository."
          />
        }
      />

      <View style={[styles.bottom, { borderColor: colors.line }]}>
        <Button label="New project" variant="primary" onPress={() => router.push('/new-project')} />
        <Button label="Clone repository" onPress={() => router.push('/clone')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: space.lg,
    paddingRight: space.xs,
    paddingVertical: space.md,
  },
  title: { flex: 1, fontFamily: font.uiBold, fontSize: fontSize.display },
  bottom: { padding: space.lg, gap: space.md, borderTopWidth: StyleSheet.hairlineWidth },
});
