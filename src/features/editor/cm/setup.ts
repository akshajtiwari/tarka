import { autocompletion, closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { bracketMatching, indentOnInput, indentUnit } from '@codemirror/language';
import { highlightSelectionMatches, search, searchKeymap } from '@codemirror/search';
import type { Extension } from '@codemirror/state';
import {
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
} from '@codemirror/view';

import type { Colors } from '../../../theme/colors';
import { languageFor } from './languages';
import { editorTheme } from './theme';

// Like CodeMirror's basicSetup, but tuned for phones:
// no fold gutter, no custom-drawn selection (the phone's own selection handles work better),
// and soft wrap on so there is no sideways scrolling.
export function buildExtensions(
  path: string,
  colors: Colors,
  fontSize: number,
  dark: boolean,
): Extension {
  return [
    lineNumbers(),
    highlightActiveLine(),
    highlightActiveLineGutter(),
    history(),
    indentUnit.of('  '),
    indentOnInput(),
    bracketMatching(),
    closeBrackets(),
    autocompletion(),
    search({ top: true }),
    highlightSelectionMatches(),
    EditorView.lineWrapping,
    keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap, ...searchKeymap]),
    languageFor(path),
    editorTheme(colors, fontSize, dark),
  ];
}
