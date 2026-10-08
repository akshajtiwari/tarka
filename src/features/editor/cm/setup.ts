import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { bracketMatching, indentOnInput, indentUnit } from '@codemirror/language';
import { highlightSelectionMatches, search, searchKeymap } from '@codemirror/search';
import { Compartment, type Extension } from '@codemirror/state';
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

// Things the user can change while a file is open. They live in a "compartment",
// so changing them updates the editor without losing undo history or the cursor.
export type LookSettings = {
  colors: Colors;
  dark: boolean;
  fontSize: number;
  wrap: boolean;
  readOnly: boolean; // "read lock": tapping does not open the keyboard
};

export const lookCompartment = new Compartment();

export function lookExtensions(s: LookSettings): Extension {
  return [
    editorTheme(s.colors, s.fontSize, s.dark),
    s.wrap ? EditorView.lineWrapping : [],
    EditorView.editable.of(!s.readOnly),
  ];
}

type Options = {
  path: string;
  look: LookSettings;
  getMemoryWords: () => string[];
  onSuggestions: (labels: string[]) => void;
};

// Like CodeMirror's basicSetup, but tuned for phones:
// no fold gutter and no custom-drawn selection (the phone's own selection handles work better).
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
    keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap, ...searchKeymap]),
    languageFor(o.path),
    lookCompartment.of(lookExtensions(o.look)),
  ];
}
