import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { BusyLine } from '../../components/BusyLine';
import { IconButton } from '../../components/IconButton';
import { topItems } from '../../lib/usageMemory';
import { font, fontSize } from '../../theme/fonts';
import { radius, size, space } from '../../theme/spacing';
import { useTheme } from '../../theme/useTheme';
import { useHistoryStore } from './historyStore';
import { stop, submitLine } from './submitLine';
import { useTerminalStore, type Mode } from './terminalStore';

const hints: Record<Mode, string> = {
  shell: 'type a command, or help',
  repl: 'Python code',
  ask: 'your answer',
  busy: 'input for the program',
};

// The line you type into, with quick chips: Stop while something runs, Exit in the Python
// prompt, and recent commands otherwise.
export function TerminalInput({ projectId }: { projectId: string }) {
  const { term } = useTheme();
  const mode = useTerminalStore((s) => s.mode);
  const prompt = useTerminalStore((s) => s.prompt);
  const activity = useTerminalStore((s) => s.activity);
  const history = useHistoryStore((s) => s.commands);
  const [text, setText] = useState('');

  function submit() {
    setText('');
    submitLine(projectId, text);
  }

  const chip = (label: string, onPress: () => void, accent = false) => (
    <Pressable
      key={label}
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.chip, { borderColor: accent ? term.error : term.muted }]}
    >
      <Text numberOfLines={1} style={[styles.chipText, { color: accent ? term.error : term.text }]}>
        {label}
      </Text>
    </Pressable>
  );

  return (
    <View style={[styles.bar, { backgroundColor: term.bg, borderColor: `${term.muted}55` }]}>
      {mode === 'busy' && <BusyLine label={activity ?? 'Running…'} color={term.muted} />}
      <ScrollView
        horizontal
        keyboardShouldPersistTaps="always"
        contentContainerStyle={styles.chips}
      >
        {(mode === 'busy' || mode === 'ask') && chip('Stop', stop, true)}
        {mode === 'repl' && chip('Exit Python', () => useTerminalStore.getState().leaveRepl())}
        {mode === 'shell' && topItems(history, 6).map((c) => chip(c, () => setText(c)))}
      </ScrollView>
      <View style={styles.row}>
        <Text style={[styles.prompt, { color: term.prompt }]}>
          {mode === 'busy' ? '›' : prompt}
        </Text>
        <TextInput
          accessibilityLabel="Terminal input"
          value={text}
          onChangeText={setText}
          onSubmitEditing={submit}
          submitBehavior="submit"
          returnKeyType="send"
          placeholder={hints[mode]}
          placeholderTextColor={term.muted}
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          style={[styles.input, { color: term.text }]}
        />
        <IconButton icon="paper-airplane" label="Send" onPress={submit} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { borderTopWidth: StyleSheet.hairlineWidth },
  chips: { gap: space.sm, paddingHorizontal: space.md, paddingTop: space.sm },
  chip: {
    height: 32,
    paddingHorizontal: space.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    maxWidth: 220,
  },
  chipText: { fontFamily: font.code, fontSize: fontSize.small },
  row: { flexDirection: 'row', alignItems: 'center', paddingLeft: space.md, minHeight: size.touch },
  prompt: { fontFamily: font.codeBold, fontSize: fontSize.body, marginRight: space.sm },
  input: { flex: 1, fontFamily: font.code, fontSize: fontSize.body, paddingVertical: space.sm },
});
