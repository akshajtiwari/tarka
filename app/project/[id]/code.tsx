import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../../src/components/Button';
import { EmptyState } from '../../../src/components/EmptyState';
import { Header } from '../../../src/components/Header';
import { IconButton } from '../../../src/components/IconButton';
import { fileAt } from '../../../src/lib/projectFs';
import { useWorkspaceStore } from '../../../src/features/workspace/workspaceStore';
import { font, fontSize } from '../../../src/theme/fonts';
import { space } from '../../../src/theme/spacing';
import { useTheme } from '../../../src/theme/useTheme';

export default function CodeScreen() {
  const colors = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activeFile, setExplorerOpen } = useWorkspaceStore();
  const showFiles = () => setExplorerOpen(true);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header
        title={activeFile ? activeFile.split('/').pop()! : 'No file open'}
        left={<IconButton icon="three-bars" label="Show files" onPress={showFiles} />}
      />
      {activeFile ? (
        <FilePreview projectId={id} path={activeFile} />
      ) : (
        <EmptyState title="Open a file" body="Pick a file from the explorer to start reading or editing.">
          <Button label="Show files" variant="primary" onPress={showFiles} />
        </EmptyState>
      )}
    </SafeAreaView>
  );
}

// shortcut: read-only preview until the CodeMirror editor lands in phase 2.
function FilePreview({ projectId, path }: { projectId: string; path: string }) {
  const colors = useTheme();
  const text = fileAt(projectId, path).textSync();

  return (
    <ScrollView contentContainerStyle={styles.preview}>
      <View>
        <Text selectable style={[styles.code, { color: colors.text }]}>
          {text}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  preview: { padding: space.lg },
  code: { fontFamily: font.code, fontSize: fontSize.small, lineHeight: 22 },
});
