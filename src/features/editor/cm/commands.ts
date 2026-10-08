import { cursorLineDown, cursorLineUp, redo, undo } from '@codemirror/commands';
import { gotoLine, openSearchPanel } from '@codemirror/search';
import type { EditorView } from '@codemirror/view';

import type { EditorCommand } from '../editorCommand';

// Runs a key-row or menu action inside CodeMirror.
export function runCommand(v: EditorView, command: EditorCommand) {
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
    case 'moveLines':
      for (let i = 0; i < Math.abs(command.by); i++) {
        if (command.by > 0) cursorLineDown(v);
        else cursorLineUp(v);
      }
      break;
    case 'undo':
      undo(v);
      break;
    case 'redo':
      redo(v);
      break;
    case 'find':
      openSearchPanel(v);
      return; // the search box takes the focus
    case 'gotoLine':
      gotoLine(v);
      return;
  }
  v.focus();
}
