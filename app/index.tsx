import { router } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../src/components/Button';
import { EmptyState } from '../src/components/EmptyState';
import { IconButton } from '../src/components/IconButton';
import { ProjectRow } from '../src/features/projects/ProjectRow';
import { sortByRecent, useProjectStore } from '../src/features/projects/projectStore';
import { font, fontSize } from '../src/theme/fonts';
import { space } from '../src/theme/spacing';
import { useTheme } from '../src/theme/useTheme';

export default function HomeScreen() {
  const colors = useTheme();
  const projects = useProjectStore((s) => s.projects);
  const markOpened = useProjectStore((s) => s.markOpened);

  function openProject(id: string) {
    markOpened(id);
    router.push({ pathname: '/project/[id]/code', params: { id } });
  }

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
            body="Create one from a template. You can clone a git repository once Git is set up."
          />
        }
      />

      <View style={[styles.bottom, { borderColor: colors.line }]}>
        <Button label="New project" variant="primary" onPress={() => router.push('/new-project')} />
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
  bottom: { padding: space.lg, borderTopWidth: StyleSheet.hairlineWidth },
});
