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
   │        command={id, name, …}     ───────► the latest key-row / chip / menu action
   ├─ <KeyRow/> (sits above the keyboard)
   └─ <SuggestionStrip/>
```

- The **native side is the source of truth** for which files are open and whether they are saved.
  The web side owns the live document while you type.
- Functions passed as props are async, because the bridge is async. Never expect an instant return value from the web side.
- **Props arrive in the WebView as fresh JSON copies every time the parent re-renders.**
  - Never write `useEffect(…, [someObject])` in a DOM component. Key effects on an id or a string.
  - The editor uses `command?.id`, `path` and `version`; the runner uses `job?.id`.
  - Wrap DOM components in `memo` on the native side.
- Key-row taps must not steal focus from the WebView, so the keyboard stays open. This is verified by an E2E test.

## Git

`isomorphic-git` is a pure-JavaScript git implementation.
It needs a Node-like `fs` object, so `src/lib/gitFs.ts` adapts `expo-file-system` to that shape.
It must provide all 10 methods isomorphic-git binds, including `readlink` and `symlink`.

All git calls go through `src/features/git/gitService.ts`, which takes `fs` as a parameter:

- The unit tests pass Node's real `fs` and run real git operations in a temp folder.
- `scripts/git-server.cjs` wraps `git http-backend`, so clone, pull and push are tested end to end in jest and on the emulator.

Safety rules:

- Pull and branch switch refuse while anything is uncommitted (`assertClean`).
- The token is sent only over HTTPS to github.com, gitlab.com and bitbucket.org (`canSendToken`).
- Every project path goes through `safeParts`, which refuses `..`.
- `.git` is hidden from the explorer.

## Running code

`src/features/run/Runner.dom.tsx` is a hidden DOM component. Each run gets a fresh **module** Web Worker
(source in `workerSource.ts`), which is killed on Stop, on error and on timeout (10 s for JS, 60 s for Python).
`console.*` output comes back as messages.

- **JS:** runs directly. **TS:** stripped to JS with `sucrase` first.
- **Python:** Pyodide 314, loaded with `import()` of `pyodide.mjs` from jsDelivr.
  - Android's WebView refuses `importScripts()` from other sites inside a worker.
  - Pyodide 314 refuses classic workers, hence the module worker.
- **HTML:** `HtmlPreview.dom.tsx` shows the page in a sandboxed iframe. Local CSS/JS are copied in by `inlineAssets`.

## Agent

`src/features/agent/loop.ts` is a plain loop:

1. Send the conversation and tool list to the provider.
2. If the reply asks for tools, run them.
3. Stop on a final answer, a refusal, a cut-off reply, the 25-step budget, the same call 3 times, or a user stop.

The pieces around it:

- **History:** `types.ts` keeps it provider-neutral.
  - `providers/anthropic*.ts` handle Claude: the SDK, streaming through `expo/fetch`, `claude-opus-5-5`, adaptive thinking, effort high, `fallbacks: 'default'`.
  - `providers/openai*.ts` handle any OpenAI-compatible server.
  - Assistant turns keep the provider's raw content, so thinking blocks go back unchanged.
- **Tools:** `runTool.ts` runs them. `write_file` and `delete_file` wait on `approvalStore.ask()`; the UI shows an `ApprovalCard` with a diff and resolves the promise.
- **Stopping:** `repairHistory` answers open tool calls after a stop, so the next message is valid.
- **Tests:** UI tests talk to `scripts/fake-ai.cjs`, a fake OpenAI-compatible server with a fixed script.

- Tools that change files never run directly. They create an **approval card** with a diff, and the loop waits for Approve or Reject.
- Providers live in `providers/anthropic.ts` and `providers/openai.ts`, behind the same small interface.

