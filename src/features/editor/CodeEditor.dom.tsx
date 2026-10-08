'use dom';

// This file runs inside a WebView (an Expo "DOM component"), so it can use CodeMirror,
// which is a web editor. Props come in from the native side; function props are async calls back out.

import { redo, undo } from '@codemirror/commands';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import type { DOMProps } from 'expo/dom';
import { useEffect, useRef } from 'react';

import type { Colors } from '../../theme/colors';
import { buildExtensions } from './cm/setup';
import type { EditorCommand } from './editorCommand';

type Props = {
  path: string; // a different path means a different file: the editor starts fresh
  text: string; // the file's text when it was opened
  colors: Colors;
  dark: boolean;
  fontSize: number;
  command: EditorCommand | null; // the latest key-row / menu action
  onChange: (path: string, text: string) => Promise<void>;
  dom?: DOMProps;
};

export default function CodeEditor({
  path,
  text,
  colors,
  dark,
  fontSize,
  command,
  onChange,
}: Props) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);

  useEffect(() => {
    // Send the text back at most every 300ms while typing, and always before closing.
    let timer: ReturnType<typeof setTimeout> | undefined;
    const flush = (v: EditorView) => {
      clearTimeout(timer);
      timer = undefined;
      onChange(path, v.state.doc.toString());
    };

    const state = EditorState.create({
      doc: text,
      extensions: [
        buildExtensions(path, colors, fontSize, dark),
        EditorView.updateListener.of((update) => {
          if (!update.docChanged) return;
          clearTimeout(timer);
          timer = setTimeout(() => flush(update.view), 300);
        }),
      ],
    });
    const editor = new EditorView({ state, parent: host.current! });
    view.current = editor;

    // The app may be closed right after typing, so don't wait for the timer.
    const onHide = () => {
      if (document.hidden && timer) flush(editor);
    };
    document.addEventListener('visibilitychange', onHide);

    return () => {
      document.removeEventListener('visibilitychange', onHide);
      if (timer) flush(editor);
      editor.destroy();
    };
    // Only a new file (or look) rebuilds the editor; text changes come from typing inside it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, dark, fontSize]);

  // Each command has a new id, so the same key pressed twice still runs twice.
  useEffect(() => {
    const v = view.current;
    if (v && command) runCommand(v, command);
  }, [command]);

  return <div ref={host} style={{ height: '100vh', backgroundColor: colors.bg }} />;
}

function runCommand(v: EditorView, command: EditorCommand) {
  switch (command.name) {
    case 'insert':
      v.dispatch(v.state.replaceSelection(command.text), { scrollIntoView: true });
      break;
    case 'move': {
      const pos = v.state.selection.main.head + command.by;
      const clamped = Math.min(Math.max(pos, 0), v.state.doc.length);
      v.dispatch({ selection: { anchor: clamped }, scrollIntoView: true });
      break;
    }
    case 'undo':
      undo(v);
      break;
    case 'redo':
      redo(v);
      break;
  }
}
