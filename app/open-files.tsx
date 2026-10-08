import Octicons from '@expo/vector-icons/Octicons';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { IconButton } from '../src/components/IconButton';
import { ListRow } from '../src/components/ListRow';
import { isDirty, useEditorStore, type OpenFile } from '../src/features/editor/editorStore';
import { saveFile } from '../src/features/editor/fileActions';
import { font, fontSize } from '../src/theme/fonts';
import { space } from '../src/theme/spacing';
import { useTheme } from '../src/theme/useTheme';

// Sheet listing the open files (tabs). Tap to switch, × to close.
export default function OpenFilesSheet() {
  const colors = useTheme();
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const { files, activePath, setActive, closeFile } = useEditorStore();

  // Never lose edits: save before closing.
  function close(file: OpenFile) {
    const error = isDirty(file) ? saveFile(projectId, file.path) : null;
    if (error) {
      Alert.alert('Could not save', `${error}\nThe file stays open so your changes are not lost.`);
      return;
    }
    closeFile(file.path);
    if (files.length === 1) router.back();
  }

  function switchTo(file: OpenFile) {
    setActive(file.path);
    router.back();
  }

  return (
    <View style={{ backgroundColor: colors.surface, paddingBottom: space.lg }}>
      <Text style={[styles.title, { color: colors.text }]}>Open files</Text>
      {files.map((file) => (
        <ListRow
          key={file.path}
          icon={file.path === activePath ? 'dot-fill' : 'file'}
          title={file.path.split('/').pop()!}
          subtitle={isDirty(file) ? `${file.path}, not saved yet` : file.path}
          onPress={() => switchTo(file)}
          right={
            <View style={styles.right}>
              {isDirty(file) && <Octicons name="dot-fill" size={14} color={colors.accent} />}
              <IconButton icon="x" label={`Close ${file.path}`} onPress={() => close(file)} />
            </View>
          }
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  title: { padding: space.lg, fontFamily: font.uiBold, fontSize: fontSize.title },
  right: { flexDirection: 'row', alignItems: 'center' },
});
