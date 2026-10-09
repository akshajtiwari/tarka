import Octicons from '@expo/vector-icons/Octicons';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '../../components/Button';
import { ListRow } from '../../components/ListRow';
import { font, fontSize } from '../../theme/fonts';
import { space } from '../../theme/spacing';
import { useTheme } from '../../theme/useTheme';
import { folderPath, newProjectsRoot } from '../projects/projectFolder';
import { useFilesAccess } from '../projects/useFilesAccess';
import { useSettings, type ProjectsLocation } from './settingsStore';

const choices: { value: ProjectsLocation; title: string; subtitle: string }[] = [
  {
    value: 'documents',
    title: 'Documents/TARKA',
    subtitle: 'Visible in file managers and Termux',
  },
  { value: 'app', title: 'Inside TARKA', subtitle: 'Private: only TARKA sees the files' },
];

// Where new projects (and clones) are saved. Existing projects stay where they are.
export function ProjectsFolderSettings() {
  const colors = useTheme();
  const { projectsLocation, setProjectsLocation } = useSettings();
  const access = useFilesAccess();
  const needsAccess = projectsLocation === 'documents' && !access.granted;

  return (
    <View>
      {choices.map((c) => (
        <ListRow
          key={c.value}
          title={c.title}
          subtitle={c.subtitle}
          onPress={() => setProjectsLocation(c.value)}
          right={
            projectsLocation === c.value && (
              <Octicons name="check" size={18} color={colors.accent} />
            )
          }
        />
      ))}
      <View style={styles.body}>
        {needsAccess && (
          <>
            <Text style={[styles.note, { color: colors.warning }]}>
              Android needs to allow TARKA to use your files. Until then, new projects are saved
              inside TARKA.
            </Text>
            <Button label="Allow file access" variant="primary" onPress={access.openSettings} />
          </>
        )}
        <Text style={[styles.note, { color: colors.muted }]}>New projects are saved in</Text>
        {/* Long-press to copy the path. */}
        <Text selectable style={[styles.path, { color: colors.text }]}>
          {folderPath(newProjectsRoot())}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: space.lg, paddingTop: space.sm, gap: space.sm },
  note: { fontFamily: font.ui, fontSize: fontSize.small, lineHeight: 20 },
  path: { fontFamily: font.code, fontSize: fontSize.small },
});
