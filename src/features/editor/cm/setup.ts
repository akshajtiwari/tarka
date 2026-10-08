import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
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
import { suggestionExtensions } from './suggestions';
import { editorTheme } from './theme';

// Like CodeMirror's basicSetup, but tuned for phones:
// no fold gutter, no custom-drawn selection (the phone's own selection handles work better),
// and soft wrap on so there is no sideways scrolling.
type Options = {
  path: string;
  colors: Colors;
  fontSize: number;
  dark: boolean;
  getMemoryWords: () => string[];
  onSuggestions: (labels: string[]) => void;
};

export function buildExtensions(o: Options): Extension {
  return [
    lineNumbers(),
    highlightActiveLine(),
    highlightActiveLineGutter(),
    history(),
    indentUnit.of('  '),
    indentOnInput(),
    bracketMatching(),
    closeBrackets(),
    suggestionExtensions(o.getMemoryWords, o.onSuggestions),
    search({ top: true }),
    highlightSelectionMatches(),
    EditorView.lineWrapping,
    keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap, ...searchKeymap]),
    languageFor(o.path),
    editorTheme(o.colors, o.fontSize, o.dark),
  ];
}
