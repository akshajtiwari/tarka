import {
  acceptCompletion,
  autocompletion,
  completeAnyWord,
  currentCompletions,
  setSelectedCompletion,
  type CompletionSource,
} from '@codemirror/autocomplete';
import { EditorState, type Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';

// Completions are shown as native chips above the key row, not in CodeMirror's small popup.
// Sources: the language's own (keywords etc.), words already in the file, and the usage memory.
export function suggestionExtensions(
  getMemoryWords: () => string[],
  onList: (labels: string[]) => void,
): Extension {
  let lastSent = '';

  const memorySource: CompletionSource = (context) => {
    const word = context.matchBefore(/\w+/);
    if (!word || word.from === word.to) return null;
    return { from: word.from, options: getMemoryWords().map((label) => ({ label, boost: 5 })) };
  };

  return [
    // No default keymap: Enter on the phone keyboard must always mean "new line".
    autocompletion({ defaultKeymap: false, icons: false }),
    EditorState.languageData.of(() => [
      { autocomplete: completeAnyWord },
      { autocomplete: memorySource },
    ]),
    EditorView.updateListener.of((update) => {
      const labels = chips(update.state)
        .slice(0, 8)
        .map((c) => c.label);
      const key = labels.join('\n');
      if (key === lastSent) return;
      lastSent = key;
      onList(labels);
    }),
  ];
}

// Several sources can offer the same word (a keyword, a project word, memory): one chip each.
// `index` is the completion's place in CodeMirror's own list, used to accept it.
function chips(state: EditorState) {
  const seen = new Set<string>();
  const list: { label: string; index: number }[] = [];
  currentCompletions(state).forEach((c, index) => {
    if (seen.has(c.label)) return;
    seen.add(c.label);
    list.push({ label: c.label, index });
  });
  return list;
}

// Inserts the chip the user tapped. Returns its label, or null if the list changed meanwhile.
export function acceptSuggestion(view: EditorView, chipIndex: number): string | null {
  const chip = chips(view.state)[chipIndex];
  if (!chip) return null;
  view.dispatch({ effects: setSelectedCompletion(chip.index) });
  acceptCompletion(view);
  return chip.label;
}
