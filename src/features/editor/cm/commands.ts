import { insertBracket } from '@codemirror/autocomplete';
import { cursorLineDown, cursorLineUp, redo, undo } from '@codemirror/commands';
import { gotoLine, openSearchPanel } from '@codemirror/search';
import type { EditorView } from '@codemirror/view';

import type { EditorCommand } from '../editorCommand';

// The WebView owns the keyboard, and Chrome only hides it when an editable element loses focus.
// So borrow one for a moment (inputmode "none" keeps it from showing the keyboard itself).
export function hideKeyboard() {
  const input = document.createElement('input');
  input.setAttribute('inputmode', 'none');
  input.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
  document.body.appendChild(input);
  input.focus({ preventScroll: true });
  input.blur();
  input.remove();
}

// Runs a key-row or menu action inside CodeMirror.
export function runCommand(v: EditorView, command: EditorCommand) {
  switch (command.name) {
    case 'insert': {
      // Brackets and quotes from the key row auto-close, just like typing them does.
      const bracket = insertBracket(v.state, command.text);
      if (bracket) v.dispatch(bracket, { scrollIntoView: true });
      else v.dispatch(v.state.replaceSelection(command.text), { scrollIntoView: true });
      break;
    }
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
    case 'jumpTo': {
      const line = v.state.doc.line(Math.min(Math.max(command.line, 1), v.state.doc.lines));
      v.dispatch({ selection: { anchor: line.from }, scrollIntoView: true });
      return; // just show the line, don't open the keyboard
    }
    case 'hideKeyboard':
      hideKeyboard();
      return;
  }
  v.focus();
}
