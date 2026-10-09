'use dom';

// This file runs inside a WebView (an Expo "DOM component"), so it can use CodeMirror,
// which is a web editor. Props come in from the native side; function props are async calls back out.

import { EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import type { DOMProps } from 'expo/dom';
import { useEffect, useRef } from 'react';

import { hideKeyboard, runCommand } from './cm/commands';
import { pinchZoom } from './cm/pinchZoom';
import { buildExtensions, lookCompartment, lookExtensions, type LookSettings } from './cm/setup';
import { acceptSuggestion } from './cm/suggestions';
import type { EditorCommand } from './editorCommand';

type Props = {
  path: string; // a different path means a different file: the editor starts fresh
  text: string; // the file's text when it was opened
  version: number; // goes up when the file was changed on disk: reload the text
  look: LookSettings;
  command: EditorCommand | null; // the latest key-row / menu action
  memoryWords: string[]; // words you used before, offered as suggestions
  onChange: (path: string, text: string) => Promise<void>;
  onSuggestions: (labels: string[]) => Promise<void>;
  onAccepted: (label: string) => Promise<void>;
  onFontSize: (size: number) => Promise<void>;
  onSave: (path: string, text: string) => Promise<void>; // Ctrl+S on a hardware keyboard
  dom?: DOMProps;
};

export default function CodeEditor(props: Props) {
  const { path, text, look, command } = props;
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  // Latest props for callbacks that live inside CodeMirror.
  const latest = useRef(props);
  useEffect(() => {
    latest.current = props;
  });

  // A new editor for each file.
  useEffect(() => {
    // Send the text back at most every 300ms while typing, and always before closing.
    let timer: ReturnType<typeof setTimeout> | undefined;
    const flush = (v: EditorView) => {
      clearTimeout(timer);
      timer = undefined;
      latest.current.onChange(path, v.state.doc.toString());
    };
    const previewFontSize = (v: EditorView, fontSize: number) =>
      v.dispatch({
        effects: lookCompartment.reconfigure(lookExtensions({ ...latest.current.look, fontSize })),
      });

    const editor: EditorView = new EditorView({
      parent: host.current!,
      state: EditorState.create({
        doc: text,
        extensions: [
          buildExtensions({
            path,
            look,
            getMemoryWords: () => latest.current.memoryWords,
            onSuggestions: (labels) => latest.current.onSuggestions(labels),
          }),
          pinchZoom(
            () => latest.current.look.fontSize,
            (size) => previewFontSize(editor, size),
            (size) => latest.current.onFontSize(size),
          ),
          keymap.of([
            {
              key: 'Mod-s',
              preventDefault: true,
              run: (v) => {
                clearTimeout(timer); // the save below carries the latest text
                timer = undefined;
                latest.current.onSave(path, v.state.doc.toString());
                return true;
              },
            },
          ]),
          EditorView.updateListener.of((update) => {
            if (!update.docChanged) return;
            clearTimeout(timer);
            timer = setTimeout(() => flush(update.view), 300);
          }),
        ],
      }),
    });
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
    // Only a new file (or a file changed on disk) rebuilds the editor; everything else
    // updates it in place.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, props.version]);

  // Theme, font size, wrap or read lock changed: update the open editor in place.
  // Props arrive as fresh copies after every re-render, so compare by content, not identity.
  const lookKey = JSON.stringify(look);
  useEffect(() => {
    view.current?.dispatch({ effects: lookCompartment.reconfigure(lookExtensions(look)) });
    if (look.readOnly) hideKeyboard(); // a locked editor has no use for the keyboard
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lookKey]);

  // Each command has a new id, so the same key pressed twice still runs twice, and a
  // re-sent copy of the same command (same id) never runs again.
  useEffect(() => {
    const v = view.current;
    if (!v || !command) return;
    if (command.name === 'accept') {
      const label = acceptSuggestion(v, command.index);
      if (label) latest.current.onAccepted(label);
      return;
    }
    runCommand(v, command);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [command?.id]);

  return <div ref={host} style={{ height: '100vh', backgroundColor: look.colors.bg }} />;
}
