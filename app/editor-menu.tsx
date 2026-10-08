import Octicons from '@expo/vector-icons/Octicons';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { IconButton } from '../src/components/IconButton';
import { ListRow } from '../src/components/ListRow';
import { useEditorCommands, type EditorAction } from '../src/features/editor/editorCommand';
import { useEditorSettings } from '../src/features/editor/editorSettingsStore';
import { font, fontSize as sizes } from '../src/theme/fonts';
import { space } from '../src/theme/spacing';
import { useTheme } from '../src/theme/useTheme';

// The ⋯ menu in the editor header.
export default function EditorMenuSheet() {
  const colors = useTheme();
  const send = useEditorCommands((s) => s.send);
  const { fontSize, wrap, readOnly, setFontSize, toggleWrap, toggleReadOnly } = useEditorSettings();

  function runAndClose(action: EditorAction) {
    router.back();
    send(action);
  }

  function checkMark(on: boolean) {
    if (!on) return null;
    return <Octicons name="check" size={18} color={colors.accent} />;
  }

  return (
    <View style={{ backgroundColor: colors.surface, paddingBottom: space.lg }}>
      <ListRow
        icon="search"
        title="Find and replace"
        onPress={() => runAndClose({ name: 'find' })}
      />
      <ListRow
        icon="list-ordered"
        title="Go to line"
        onPress={() => runAndClose({ name: 'gotoLine' })}
      />
      <ListRow icon="fold" title="Wrap long lines" right={checkMark(wrap)} onPress={toggleWrap} />
      <ListRow
        icon="lock"
        title="Read lock"
        subtitle="Tapping the code won't open the keyboard"
        right={checkMark(readOnly)}
        onPress={toggleReadOnly}
      />
      <View style={styles.fontRow}>
        <Text style={[styles.fontLabel, { color: colors.text }]}>Font size {fontSize}</Text>
        <IconButton icon="dash" label="Smaller text" onPress={() => setFontSize(fontSize - 1)} />
        <IconButton icon="plus" label="Bigger text" onPress={() => setFontSize(fontSize + 1)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fontRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: space.lg,
    paddingRight: space.sm,
  },
  fontLabel: { flex: 1, fontFamily: font.ui, fontSize: sizes.body },
});
