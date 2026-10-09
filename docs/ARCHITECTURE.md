# Architecture

This page shows how the app is put together. Keep it updated whenever a folder or data flow changes.

## Folders

```
app/                     screens (expo-router: the file path is the route), kept thin
  _layout.tsx            root: fonts, theme, keyboard provider, stack
  index.tsx              home: list of projects
  welcome.tsx            first-launch setup (required; optional steps can be "Set up later")
  project/[id]/…         workspace with the bottom dock (code, git, run = terminal, agent)
modules/tarka-android/   small local Expo module in Kotlin: storage permission, Termux bridge
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
| Project files | `Documents/TARKA/<name>/` (needs "All files access") or, if chosen in setup, `Paths.document/projects/<name>/` | `expo-file-system` (`File`, `Directory`); each project record keeps its folder in `root` |
| List of projects, settings, usage memory | AsyncStorage | zustand `persist` |
| API keys, git tokens | Android Keystore | `expo-secure-store` |
| Terminal history | AsyncStorage | `historyStore` (newest commands, per app) |
| pip / npm packages | `requirements.txt` / `package.json` in the project | written by `pip install` / `npm install` |
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
  - The editor uses `command?.id`, `path` and `version`; the runner uses `command?.id`.
  - Wrap DOM components in `memo` on the native side.
- Key-row taps must not steal focus from the WebView, so the keyboard stays open. This is verified by an E2E test.
- **The WebView owns its keyboard.** `KeyboardController.dismiss()` and `Keyboard.dismiss()` only close it for React
  Native inputs. To close it from the native side, send the `hideKeyboard` command: it focuses and blurs a throwaway
  `<input inputmode="none">`, which is the one thing that makes Chrome drop the keyboard.
  The read lock needs this because Android brings the keyboard back by itself when a sheet closes.
- Ctrl+S is a CodeMirror keymap that calls the `onSave(path, text)` prop with the latest text.

## Git

`isomorphic-git` is a pure-JavaScript git implementation.
It needs a Node-like `fs` object, so `src/lib/gitFs.ts` adapts `expo-file-system` to that shape.
It must provide all 10 methods isomorphic-git binds, including `readlink` and `symlink`.

All git calls go through `src/features/git/gitService.ts` (local work) and `gitRemote.ts` (clone, pull, push),
which take `fs` as a parameter:

- The unit tests pass Node's real `fs` and run real git operations in a temp folder.
- `scripts/git-server.cjs` wraps `git http-backend`, so clone, pull and push are tested end to end in jest and on the emulator.

Speed (git was the big lag in v0.1; see PROGRESS.md for the numbers):

- **`gitCache.ts`:** every call passes isomorphic-git's `cache` for that folder, so packfiles and the index are
  parsed once instead of on every call. It is dropped when you leave the project and after any git error.
- **`gitFs.ts`** remembers answers about `.git/…` paths for one second (`shortMemo`), cleared on any write.
  One status check used to stat `.git/index` ~200 times.
- **`yieldToUi.ts`:** every fs call awaits a `setTimeout(0)` once 12 ms have passed, so long git work never
  freezes taps and animations.
- **`gitStatusStore.ts`** is the one shared picture of the open project's status (Git tab and explorer colors).
  Saves, file actions and git actions mark it stale; it is re-read 300 ms later, only while someone is looking
  (the Git tab is focused, or the explorer has finished opening). The old picture stays on screen meanwhile.

Safety rules:

- Pull and branch switch refuse while anything is uncommitted (`assertClean`).
- The token is sent only over HTTPS to github.com, gitlab.com and bitbucket.org (`canSendToken`).
- Every project path goes through `safeParts`, which refuses `..`.
- `.git` is hidden from the explorer.

Commit details (`commitDetail`) walk the commit's tree against its first parent's tree.
Clones are shallow (`depth: 1`), so the newest commit of a fresh clone has no parent on the phone; the screen says so.

## Running code: the terminal

The Run tab is a terminal (`src/features/terminal/`). The editor's **Run file** button saves the file, types
`run <file>` into it and opens the tab.

```
 TerminalInput ─► submitLine.ts ─► parseCommand ─► terminalStore.send(command) ─► TerminalBridge
   (prompt,           (works outside React,           (queue; one command at       (hidden 1×1 Runner.dom.tsx,
    chips)             so the editor can call it)      a time, acked by `handled`)   mounted in the workspace)
 TerminalView ◄──────────────── terminalStore.onEvent ◄──────── batched events (output, ask, done, session)
```

- **Commands:** `run`, `python` (no file = REPL), `node`, `pip install/list`, `npm install`, `ls`, `cat`,
  `termux …`, `clear`, `help`. Anything else is answered with a hint.
- **Python:** one long-lived module worker per project session, so Pyodide 314 loads once and pip installs stay.
  - `input()` pauses Python until you type a line, using JSPI (`run_sync`, Chrome 137+). Without JSPI, lines
    typed ahead are used, and an empty queue raises `EOFError` with a hint to update Android System WebView.
  - The REPL uses `codeop.compile_command` for multi-line input and keeps its variables.
  - `requirements.txt` is installed with micropip on the session's first run; `pip install x` adds to it.
- **JS/TS:** a fresh worker per run. Sucrase strips TS and turns `import` into `require`; bare package names
  load from esm.sh at the version in `package.json` (`jsModules.ts`). `await input(prompt)` reads a line.
- **HTML:** `run page.html` shows `HtmlPreview.dom.tsx` (sandboxed iframe, local CSS/JS inlined).
- **Limits:** no time limit (Stop is always on screen; it kills the worker, and Python starts a new session
  next time). More than 5000 output lines stops the run; the screen keeps the newest 5000.
- The session ends when you leave the project.

## Termux bridge

`termux <command>` runs a real Linux command in the Termux app (`src/features/termux/`):

1. `syncScript.ts` builds bash scripts that recreate the project under `~/tarka/<project>/` in Termux
   (base64 heredocs, so binaries and UTF-8 survive; 200k-character chunks; files over ~140 KB are skipped
   with a note). After the first sync only changed files go (`syncState.ts`); `termux sync` sends everything again.
   Files deleted in TARKA are not deleted in the copy.
2. `runInTermux.ts` sends each script through Termux's `RUN_COMMAND` intent (native module) and prints
   stdout, stderr and `[exit n]`. It stops at the first failure and gives up after 120 s.
3. `termuxHelp.ts` turns failures into next steps: install Termux, grant the permission, or add
   `allow-external-apps=true` to `~/.termux/termux.properties`.

Output comes back when the command ends (Termux limits it to about 100 KB), so live input isn't possible there.

## Native module (`modules/tarka-android`)

Kotlin, kept small. `index.ts` uses `requireOptionalNativeModule`, so jest and iOS get `null`.

- **Storage:** `hasAllFilesAccess`, `openAllFilesAccess`, `documentsPath`. It also registers a
  `FilePermissionService` that lets `expo-file-system` write under `Documents/TARKA` once access is granted
  (Expo refuses writes to new paths outside the app otherwise).
- **Termux:** `isTermuxInstalled`, `hasTermuxPermission`, `requestTermuxPermission`, `runInTermux(args, stdin,
  background)`. The result comes back through a `PendingIntent` to a receiver registered `RECEIVER_NOT_EXPORTED`.
- `app.plugin.js` adds `MANAGE_EXTERNAL_STORAGE`, `com.termux.permission.RUN_COMMAND` and the `<queries>` entry.

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
  - **Gemini** uses the same code with Google's OpenAI-compatible endpoint (`aiProviders.ts`, default model
    `gemini-3.8-flash`). The assistant's raw message is sent back unchanged, so Gemini's thought signatures
    (`extra_content`) survive tool calls. The model is saved per provider (`aiModels`).
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
  `useExpoModulesBridge`: code you run must not be able to call into the app. The runner's one callback
  (`onEvent`) only adds output lines and answers to the terminal; project files reach the worker as plain
  text inside the command.
- The WebView allows `file://` reads (Expo sets it), so the worker blocks `fetch` and XHR to anything
  but web addresses. See the `shortcut:` note in `workerSource.ts` for what is still open.
