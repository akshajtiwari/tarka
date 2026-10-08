# Architecture

This page shows how the app is put together. Keep it updated whenever a folder or data flow changes.

## Folders

```
app/                     screens (expo-router: the file path is the route), kept thin
  _layout.tsx            root: fonts, theme, keyboard provider, stack
  index.tsx              home: list of projects
  project/[id]/…         workspace with the bottom dock (code, git, run, agent)
src/
  theme/                 colors, spacing, fonts; useTheme() picks dark or light
  components/            small shared UI pieces (Button, IconButton, ListRow, Chip, …)
  lib/                   plain helpers with no UI (file system, paths, fuzzy match, history)
  features/<name>/       everything for one feature: its components, store and logic
.maestro/                end-to-end UI tests
scripts/                 setup, emulator, phone and screenshot helpers
docs/                    you are here
```

Rule of thumb: a screen in `app/` puts together components from `src/features/…`, logic lives in plain functions,
and state lives in small zustand stores.

## Where data lives

| Data | Where | How |
|---|---|---|
| Project files | `Paths.document/projects/<name>/` | `expo-file-system` (`File`, `Directory`) |
| List of projects, settings, usage memory | AsyncStorage | zustand `persist` |
| API keys, git tokens | Android Keystore | `expo-secure-store` |
| Open tabs and unsaved text | memory (zustand) | flushed to disk by autosave |

## The editor (the important part)

CodeMirror 6 is a web editor, so it runs inside a WebView.
Expo **DOM components** make that simple: a file that starts with `'use dom'` is rendered in a WebView automatically.

```
 native side (React Native)                    web side (CodeEditor.dom.tsx, CodeMirror 6)
 ─────────────────────────                     ─────────────────────────────────────────
 code.tsx screen
   ├─ <CodeEditor text lang fontSize …/>  ───► props: the starting text, language, theme, settings
   │        onChange(text)            ◄─────── called (debounced) when the user types
   │        onSuggestions(list)       ◄─────── current completions, shown as native chips
   │        ref.run('insert', '{')    ───────► commands from the key row / chips / menu
   ├─ <KeyRow/> (sits above the keyboard)
   └─ <SuggestionStrip/>
```

- The **native side is the source of truth** for which files are open and whether they are saved.
  The web side owns the live document while you type.
- Functions passed as props are async, because the bridge is async. Never expect an instant return value from the web side.
- Key-row taps must not steal focus from the WebView, so the keyboard stays open. This is verified by an E2E test.

## Git

`isomorphic-git` is a pure-JavaScript git implementation.
It needs a Node-like `fs` object, so `src/lib/gitFs.ts` adapts `expo-file-system` to that shape.
All git calls go through `src/features/git/gitService.ts`. It takes `fs` as a parameter,
so the unit tests pass Node's real `fs` and run real git operations in a temp folder.

## Running code

`RunnerSandbox.dom.tsx` is a second, hidden DOM component. It runs user code inside a Web Worker or a sandboxed iframe,
so a crash or an infinite loop can be killed with a timeout. It also captures `console.log` and errors and sends them back.

- JS runs directly.
- TS is first stripped to JS with `sucrase`.
- HTML shows in a visible preview.
- Python uses Pyodide, loaded once from the CDN and cached.

## Agent

`src/features/agent/loop.ts` is a plain loop:

1. Send the conversation and tool list to the provider.
2. If the reply asks for tools, run them.
3. Stop on a final answer, the step budget, a repeated call, or a user stop.

- Tools that change files never run directly. They create an **approval card** with a diff, and the loop waits for Approve or Reject.
- Providers live in `providers/anthropic.ts` and `providers/openai.ts`, behind the same small interface.

*(Sections get filled in as each phase lands.)*
