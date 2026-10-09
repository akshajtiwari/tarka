import { useIsFocused, useLocalSearchParams } from 'expo-router';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { KeyboardAvoidingView, useKeyboardState } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../../src/components/Button';
import { EmptyState } from '../../../src/components/EmptyState';
import CodeEditorView from '../../../src/features/editor/CodeEditor.dom';
import { useEditorCommands } from '../../../src/features/editor/editorCommand';
import { EditorHeader } from '../../../src/features/editor/EditorHeader';
import { useEditorSettings } from '../../../src/features/editor/editorSettingsStore';
import { isDirty, useEditorStore } from '../../../src/features/editor/editorStore';
import { saveFile } from '../../../src/features/editor/fileActions';
import { KeyRow } from '../../../src/features/editor/KeyRow';
import { useMemoryStore } from '../../../src/features/editor/memoryStore';
import { SuggestionStrip } from '../../../src/features/editor/SuggestionStrip';
import { useEditorActions } from '../../../src/features/editor/useEditorActions';
import { useAutosave } from '../../../src/features/editor/useAutosave';
import { topItems } from '../../../src/lib/usageMemory';
import { dark as darkColors } from '../../../src/theme/colors';
import { useTheme } from '../../../src/theme/useTheme';

// Only re-render the WebView when its props really change (not on every keystroke).
const CodeEditor = memo(CodeEditorView);

export default function CodeScreen() {
  const colors = useTheme();
  const dark = colors === darkColors;
  const { id } = useLocalSearchParams<{ id: string }>();
  const file = useEditorStore((s) => s.files.find((f) => f.path === s.activePath));
  const tabCount = useEditorStore((s) => s.files.length);
  const reloads = useEditorStore((s) => s.reloads);
  const keyboardOpen = useKeyboardState((s) => s.isVisible);
  const { command, send } = useEditorCommands();
  const { fontSize, wrap, readOnly, setFontSize } = useEditorSettings();
  const memory = useMemoryStore((s) => s.words);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const actions = useEditorActions(id);
  useAutosave(id);

  const locked = !!file?.locked;
  const look = useMemo(
    () => ({ colors, dark, fontSize, wrap, readOnly: readOnly || locked }),
    [colors, dark, fontSize, wrap, readOnly, locked],
  );
  // Read lock means no keyboard here, but Android brings it back by itself when a sheet closes
  // over an editor that had it open. Only while this tab is on screen: other tabs and sheets
  // have their own text fields.
  const focused = useIsFocused();
  useEffect(() => {
    if (focused && look.readOnly && keyboardOpen) send({ name: 'hideKeyboard' });
  }, [focused, look.readOnly, keyboardOpen, send]);
  const memoryWords = useMemo(() => topItems(memory, 200), [memory]);
  // The text the editor starts with; only changes when another file is opened.
  const startText = useMemo(() => file?.text ?? '', [file?.path, reloads]); // eslint-disable-line react-hooks/exhaustive-deps
  const domProps = useMemo(() => ({ style: { flex: 1 } }), []);

  const onChange = useCallback(async (path: string, text: string) => {
    useEditorStore.getState().updateText(path, text);
  }, []);
  // The editor sends a list on almost every keystroke; only a different list redraws.
  const onSuggestions = useCallback(async (labels: string[]) => {
    setSuggestions((old) => (old.join('\n') === labels.join('\n') ? old : labels));
  }, []);
  const onAccepted = useCallback(async (label: string) => {
    useMemoryStore.getState().useWord(label);
  }, []);
  const onFontSize = useCallback(async (size: number) => setFontSize(size), [setFontSize]);
  const onSave = useCallback(
    async (path: string, text: string) => {
      useEditorStore.getState().updateText(path, text);
      const error = saveFile(id, path);
      if (error) Alert.alert('Could not save', error);
    },
    [id],
  );

  // Stable handlers, so the key row's trackpad gesture is not rebuilt mid-drag.
  const keys = useMemo(
    () => ({
      onInsert: (text: string) => send({ name: 'insert', text }),
      onMove: (by: number) => send({ name: 'move', by }),
      onMoveLines: (by: number) => send({ name: 'moveLines', by }),
      onUndo: () => send({ name: 'undo' }),
      onRedo: () => send({ name: 'redo' }),
    }),
    [send],
  );
  const pickSuggestion = useCallback((index: number) => send({ name: 'accept', index }), [send]);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <EditorHeader
        fileName={file ? file.path.split('/').pop()! : null}
        dirty={!!file && isDirty(file)}
        tabCount={tabCount}
        onShowFiles={actions.showFiles}
        onShowTabs={actions.showTabs}
        onShowMenu={actions.showMenu}
        onSave={actions.save}
        onSwipe={actions.switchTab}
      />
      {file ? (
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
          <CodeEditor
            path={file.path}
            text={startText}
            version={reloads}
            look={look}
            command={command}
            memoryWords={memoryWords}
            onChange={onChange}
            onSuggestions={onSuggestions}
            onAccepted={onAccepted}
            onFontSize={onFontSize}
            onSave={onSave}
            dom={domProps}
          />
          {keyboardOpen && <SuggestionStrip labels={suggestions} onPick={pickSuggestion} />}
          {keyboardOpen && <KeyRow path={file.path} {...keys} />}
        </KeyboardAvoidingView>
      ) : (
        <EmptyState
          title="Open a file"
          body="Pick a file from the explorer to start reading or editing."
        >
          <Button label="Show files" variant="primary" onPress={actions.showFiles} />
        </EmptyState>
      )}
    </SafeAreaView>
  );
}
