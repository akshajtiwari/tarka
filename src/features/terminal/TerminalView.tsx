import { memo, useRef } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../components/Button';
import { font, fontSize } from '../../theme/fonts';
import { space } from '../../theme/spacing';
import { useTheme } from '../../theme/useTheme';
import HtmlPreviewView from '../run/HtmlPreview.dom';
import type { OutputLine } from './bridgeTypes';
import { TerminalInput } from './TerminalInput';
import { useTerminalStore } from './terminalStore';

const HtmlPreview = memo(HtmlPreviewView);
const fill = { style: { flex: 1 } };

// The terminal: output on GitHub-dark navy (errors red, what you typed in blue), and the input
// line at the bottom. `run page.html` shows the page instead, until you close it.
export function TerminalView({ projectId }: { projectId: string }) {
  const { term } = useTheme();
  const lines = useTerminalStore((s) => s.lines);
  const preview = useTerminalStore((s) => s.preview);
  const list = useRef<FlatList<OutputLine>>(null);
  const color = { stdout: term.text, stderr: term.error, info: term.muted, echo: term.prompt };

  if (preview !== null) {
    return (
      <View style={styles.fill}>
        <HtmlPreview html={preview} dom={fill} />
        <View style={[styles.previewBar, { backgroundColor: term.bg }]}>
          <Button
            label="Close preview"
            onPress={() => useTerminalStore.getState().setPreview(null)}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.fill, { backgroundColor: term.bg }]}>
      <FlatList
        ref={list}
        data={lines}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.content}
        onContentSizeChange={() => list.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <Text style={[styles.line, { color: term.muted }]}>
            Type help to see the commands, or tap Run file in the editor.
          </Text>
        }
        renderItem={({ item }) => (
          <Text selectable style={[styles.line, { color: color[item.stream] }]}>
            {item.text}
          </Text>
        )}
      />
      <TerminalInput projectId={projectId} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { padding: space.md },
  line: { fontFamily: font.code, fontSize: fontSize.small, lineHeight: 20 },
  previewBar: { padding: space.md },
});
