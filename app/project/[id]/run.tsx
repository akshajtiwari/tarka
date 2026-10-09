import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../../src/components/Button';
import { EmptyState } from '../../../src/components/EmptyState';
import { Header } from '../../../src/components/Header';
import { TextField } from '../../../src/components/TextField';
import { useEditorStore } from '../../../src/features/editor/editorStore';
import { useWorkspaceStore } from '../../../src/features/workspace/workspaceStore';
import { saveAllDirty } from '../../../src/features/editor/fileActions';
import HtmlPreview from '../../../src/features/run/HtmlPreview.dom';
import { inlineAssets } from '../../../src/features/run/inlineAssets';
import { OutputConsole } from '../../../src/features/run/OutputConsole';
import { pickRunTarget } from '../../../src/features/run/pickRunTarget';
import Runner from '../../../src/features/run/Runner.dom';
import { runKindFor } from '../../../src/features/run/runKind';
import { useRunner } from '../../../src/features/run/useRunner';
import { listEntries, readForSearch } from '../../../src/lib/projectFs';
import { font, fontSize } from '../../../src/theme/fonts';
import { space } from '../../../src/theme/spacing';
import { useTheme } from '../../../src/theme/useTheme';

const hidden = { style: { height: 0 } };
const fill = { style: { flex: 1 } };

export default function RunScreen() {
  const colors = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const activePath = useEditorStore((s) => s.activePath);
  const runner = useRunner();
  const [stdin, setStdin] = useState('');
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  const treeVersion = useWorkspaceStore((s) => s.treeVersion);
  // Read the folder only when files change, not on every line of output.
  const rootFiles = useMemo(
    () =>
      listEntries(id, '')
        .filter((e) => !e.isDir)
        .map((e) => e.name),
    [id, treeVersion], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const target = pickRunTarget(activePath, rootFiles);
  const kind = target ? runKindFor(target) : null;

  function run() {
    if (!target || !kind) return;
    saveAllDirty(id); // run what you see in the editor
    const code = readForSearch(id, target) ?? '';
    if (kind === 'html') {
      const folder = target.includes('/') ? target.slice(0, target.lastIndexOf('/') + 1) : '';
      setPreviewHtml(inlineAssets(code, (path) => readForSearch(id, folder + path)));
      return;
    }
    setPreviewHtml(null);
    runner.start(kind, code, stdin);
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title="Run" />
      {!target && (
        <EmptyState
          title="Nothing to run here"
          body="Open a .js, .ts, .py or .html file, then come back."
        />
      )}
      {target && (
        <View style={[styles.controls, { borderColor: colors.line }]}>
          <Text style={[styles.target, { color: colors.muted }]}>{target}</Text>
          {kind === 'py' && (
            <TextField
              label="Input (one line per input() call)"
              value={stdin}
              onChangeText={setStdin}
              mono
            />
          )}
          {runner.running ? (
            <Button label="Stop" onPress={runner.stop} />
          ) : (
            <Button
              label={kind === 'html' ? `Preview ${target}` : `Run ${target}`}
              variant="primary"
              onPress={run}
            />
          )}
        </View>
      )}
      {previewHtml !== null ? (
        <HtmlPreview html={previewHtml} dom={fill} />
      ) : (
        <OutputConsole lines={runner.lines} />
      )}
      <Runner
        job={runner.job}
        stopId={runner.stopId}
        onOutput={runner.onOutput}
        onDone={runner.onDone}
        dom={hidden}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  controls: { padding: space.lg, gap: space.md, borderBottomWidth: StyleSheet.hairlineWidth },
  target: { fontFamily: font.code, fontSize: fontSize.small },
});
