import { router, useLocalSearchParams } from 'expo-router';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { useColorScheme } from 'react-native';
import { KeyboardAvoidingView, useKeyboardState } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../../src/components/Button';
import { EmptyState } from '../../../src/components/EmptyState';
import CodeEditorView from '../../../src/features/editor/CodeEditor.dom';
import type { EditorAction, EditorCommand } from '../../../src/features/editor/editorCommand';
import { EditorHeader } from '../../../src/features/editor/EditorHeader';
import { isDirty, useEditorStore } from '../../../src/features/editor/editorStore';
import { saveFile } from '../../../src/features/editor/fileActions';
import { KeyRow } from '../../../src/features/editor/KeyRow';
import { useMemoryStore } from '../../../src/features/editor/memoryStore';
import { SuggestionStrip } from '../../../src/features/editor/SuggestionStrip';
import { useAutosave } from '../../../src/features/editor/useAutosave';
import { useWorkspaceStore } from '../../../src/features/workspace/workspaceStore';
import { topItems } from '../../../src/lib/usageMemory';
import { useTheme } from '../../../src/theme/useTheme';

// Only re-render the WebView when its props really change (not on every keystroke).
const CodeEditor = memo(CodeEditorView);

export default function CodeScreen() {
  const colors = useTheme();
  const dark = useColorScheme() !== 'light';
  const { id } = useLocalSearchParams<{ id: string }>();
  const setExplorerOpen = useWorkspaceStore((s) => s.setExplorerOpen);
  const file = useEditorStore((s) => s.files.find((f) => f.path === s.activePath));
  const tabCount = useEditorStore((s) => s.files.length);
  const keyboardOpen = useKeyboardState((s) => s.isVisible);
  const [command, setCommand] = useState<EditorCommand | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const memory = useMemoryStore((s) => s.words);
  const memoryWords = useMemo(() => topItems(memory, 200), [memory]);
  const nextId = useRef(1);
  useAutosave(id);

  // The text the editor starts with; only changes when another file is opened.
  const startText = useMemo(() => file?.text ?? '', [file?.path]); // eslint-disable-line react-hooks/exhaustive-deps
  const onChange = useCallback(async (path: string, text: string) => {
    useEditorStore.getState().updateText(path, text);
  }, []);
  const onSuggestions = useCallback(async (labels: string[]) => setSuggestions(labels), []);
  const onAccepted = useCallback(async (label: string) => {
    useMemoryStore.getState().useWord(label);
  }, []);
  const domProps = useMemo(() => ({ style: { flex: 1 } }), []);

  const showFiles = () => setExplorerOpen(true);
  const send = useCallback((action: EditorAction) => {
    setCommand({ ...action, id: nextId.current++ });
  }, []);
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

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <EditorHeader
        fileName={file ? file.path.split('/').pop()! : null}
        dirty={!!file && isDirty(file)}
        tabCount={tabCount}
        onShowFiles={showFiles}
        onShowTabs={() => router.push({ pathname: '/open-files', params: { projectId: id } })}
        onSave={() => file && saveFile(id, file.path)}
      />
      {file ? (
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
          <CodeEditor
            path={file.path}
            text={startText}
            colors={colors}
            dark={dark}
            fontSize={14}
            command={command}
            memoryWords={memoryWords}
            onChange={onChange}
            onSuggestions={onSuggestions}
            onAccepted={onAccepted}
            dom={domProps}
          />
          {keyboardOpen && (
            <SuggestionStrip
              labels={suggestions}
              onPick={(index) => send({ name: 'accept', index })}
            />
          )}
          {keyboardOpen && <KeyRow path={file.path} {...keys} />}
        </KeyboardAvoidingView>
      ) : (
        <EmptyState
          title="Open a file"
          body="Pick a file from the explorer to start reading or editing."
        >
          <Button label="Show files" variant="primary" onPress={showFiles} />
        </EmptyState>
      )}
    </SafeAreaView>
  );
}
