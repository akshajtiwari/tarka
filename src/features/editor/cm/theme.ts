import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import type { Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { tags as t } from '@lezer/highlight';

import type { Colors } from '../../../theme/colors';

// The slate/chalk editor look from docs/UI.md, built from the same color tokens as the app.
export function editorTheme(colors: Colors, fontSize: number, dark: boolean): Extension {
  const s = colors.syntax;

  const look = EditorView.theme(
    {
      '&': {
        height: '100%',
        color: colors.text,
        backgroundColor: colors.bg,
        fontSize: `${fontSize}px`,
      },
      '&.cm-focused': { outline: 'none' },
      '.cm-scroller': { fontFamily: 'JetBrains Mono, monospace', lineHeight: '1.6' },
      '.cm-content': { caretColor: colors.accent, paddingBottom: '40vh' },
      '.cm-cursor': { borderLeftColor: colors.accent, borderLeftWidth: '2px' },
      '.cm-gutters': { backgroundColor: colors.bg, color: colors.muted, border: 'none' },
      '.cm-lineNumbers .cm-gutterElement': { padding: '0 10px 0 8px', minWidth: '24px' },
      // The brass bar next to the current line is the editor's one bold detail.
      '.cm-activeLineGutter': {
        backgroundColor: 'transparent',
        color: colors.text,
        boxShadow: `inset -2px 0 0 ${colors.accent}`,
      },
      '.cm-activeLine': { backgroundColor: 'transparent' },
      '.cm-matchingBracket': {
        backgroundColor: colors.raised,
        outline: `1px solid ${colors.line}`,
      },
      '.cm-selectionMatch': { backgroundColor: colors.raised },
      '.cm-searchMatch': { backgroundColor: colors.raised, outline: `1px solid ${colors.accent}` },
      // Find/replace and go-to-line panels, sized for fingers.
      '.cm-panels': { backgroundColor: colors.surface, color: colors.text, borderColor: colors.line },
      '.cm-panel': { padding: '8px', fontFamily: 'sans-serif', fontSize: '15px' },
      '.cm-textfield': {
        minHeight: '36px',
        padding: '0 8px',
        fontSize: '15px',
        color: colors.text,
        backgroundColor: colors.raised,
        border: `1px solid ${colors.line}`,
        borderRadius: '6px',
      },
      '.cm-button': {
        minHeight: '36px',
        padding: '0 12px',
        fontSize: '14px',
        color: colors.text,
        backgroundImage: 'none',
        backgroundColor: colors.raised,
        border: `1px solid ${colors.line}`,
        borderRadius: '6px',
      },
      '.cm-panel button[name=close]': { fontSize: '22px', padding: '4px 8px', color: colors.muted },
      // Suggestions are shown as native chips instead (see SuggestionStrip).
      '.cm-tooltip-autocomplete': { display: 'none' },
    },
    { dark },
  );

  const highlight = HighlightStyle.define([
    { tag: [t.keyword, t.controlKeyword, t.moduleKeyword, t.operatorKeyword], color: s.keyword },
    { tag: [t.string, t.special(t.string), t.regexp], color: s.string },
    { tag: [t.number, t.bool, t.null, t.atom], color: s.number },
    { tag: [t.function(t.variableName), t.function(t.propertyName)], color: s.function },
    { tag: [t.typeName, t.className, t.namespace], color: s.type },
    { tag: [t.propertyName, t.attributeName], color: s.property },
    { tag: [t.tagName, t.heading], color: s.number },
    { tag: t.comment, color: s.comment, fontStyle: 'italic' },
    { tag: t.link, color: s.function, textDecoration: 'underline' },
    { tag: t.invalid, color: s.invalid },
  ]);

  return [look, syntaxHighlighting(highlight)];
}
