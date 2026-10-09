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
(source in `workerSource.ts`), which is killed on Stop, on error and on timeout (10 s for JS, 180 s for Python, or 5000 lines of output).
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
  - `providers/anthropic*.ts` handle Claude with plain `fetch` (no SDK, not streamed): `claude-opus-5-5`,
    adaptive thinking, effort high, `fallbacks: 'default'`. The SDK crashed the app on Hermes, see DECISIONS.md.
  - `providers/openai*.ts` handle any OpenAI-compatible server (`chat/completions`, also plain `fetch`).
  - Assistant turns keep Claude's raw content, so thinking blocks go back unchanged.
    A turn from the other provider is rebuilt from its text and tool calls.
- **Tools:** `runTool.ts` runs them. Every path from the model goes through `projectPath` (no `..`, no `.git`).
  - `write_file` and `delete_file` wait on `approvalStore.ask()`; the UI shows an `ApprovalCard` with a diff.
  - After Approve, a write is refused if the open tab has unsaved edits or the file changed while the card was open.
- **Stopping:** Stop, or leaving the project, aborts the loop and rejects a waiting card.
  Calls not run yet are answered "Stopped before this ran.", and `repairHistory` fixes anything left open.
- **Tests:** UI tests talk to `scripts/fake-ai.cjs`, a fake OpenAI-compatible server with a fixed script.

## Rules for DOM components that run user code

- `Runner.dom.tsx` and `HtmlPreview.dom.tsx` get **no function props that touch files or keys**, and never
  `useExpoModulesBridge`: code you run must not be able to call into the app.
- The WebView allows `file://` reads (Expo sets it), so the worker blocks `fetch` and XHR to anything
  but web addresses. See the `shortcut:` note in `workerSource.ts` for what is still open.
