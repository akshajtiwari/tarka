# Progress log

Newest session first. Each entry lists what was done, what's next, and known issues.

## Session 3: 2026-10-09 (night), v0.2

From the owner's phone test of v0.1.0. Everything below is device-verified on the emulator unless marked.

### Done
- **Git speed** (the big lag): isomorphic-git's cache, a one-second memo for `.git` paths, yielding every 12 ms,
  and one shared status store that reads only while someone is looking.
  - Emulator, dev build, an expressjs/express clone: a status read took **1.2–1.6 s of frozen UI** on every
    explorer open and Git tab visit. Now it takes **~0.7 s, once, in the background**; the longest UI stall
    during a read is ~230 ms, and switching tabs does no git work. Not measured in a release build yet.
- **Terminal** (the Run tab): run files, Python REPL, live `input()` (JSPI), `pip install`, `npm install`
  (packages from esm.sh), Stop, history, HTML preview. The editor has a **Run file** button.
- **Termux bridge:** `termux <command>` copies the project into Termux and runs the command there.
  Device-tested against the real Termux app (0.118.3) on the emulator: permission request, `termux ls`,
  `termux cat`, exit codes, and only changed files copied again.
- **Projects in Documents/TARKA** (or inside TARKA), chosen in setup; every project shows its folder.
- **Setup flow** (required; only Python is mandatory; git, AI and Termux can be "Set up later").
- **Gemini** API key, models saved per provider. **Home buttons** in every tab, keyboard-aware forms,
  GitHub-style diff colors and a GitHub-dark terminal, busy lines on every slow action.
- **Compiler research:** COMPILERS.md has the options and a recommended order.
- **Reviews:** code-simplifier pass; security review (3 findings, all fixed: git token through a proxy in
  `.git/config`, tokens in clone URLs, `import('file://…')` from code you run); Ponytail review (6 must-fix,
  7 should-fix and 3 nice-to-have, all fixed with tests).
- **Tests:** 131 unit tests, 16 Maestro flows (green), plus `perf/git-perf.yaml`, `termux/termux.yaml` and
  `release/smoke.yaml` outside the default run.
- **Release 0.2.0:** signed with the same key (updates 0.1.0 in place), 66 MB, arm64-v8a + x86_64.
  On the emulator, without Metro: the release smoke passed (setup, Documents/TARKA, terminal JS with
  `input()`, Python, `file://` blocked for fetch and `import()`), and installing it over 0.1.0 kept a 0.1
  project, which still opened and ran.

### Next up
1. Owner: try 0.2.0 on the phone (REVIEW.md).
2. Compilers, in the order in COMPILERS.md: C (xcc), then Lua and SQL, then Java (teavm-javac).
3. Measure git speed in a release build on the phone; native SHA-1 only if still slow.
4. Agent tools still missing: git diff and run. Streaming replies.

### Known issues / gotchas for the next agent
- **The emulator leaks memory** (guest GPU) and the OOM killer ends it near 8 GB. `e2e.sh` now restarts it
  before any flow once it passes 4.5 GB, and `emulator.sh` waits for network after boot (setup downloads
  Python right away). Don't run full jest next to the emulator: use `--maxWorkers=2`, or wait.
- **expo-file-system 57: `copy()`/`move()` are async** (`copySync`/`moveSync` are the sync ones). An
  un-awaited `copy()` made duplicates invisible until the next refresh. Nothing flags floating promises here.
- **Each DOM WebView sets Android's global WebView-debugging flag** from its own prop, so the hidden runner
  can't be inspected over DevTools unless it is given `webviewDebuggingEnabled`. To test what code you run can
  do, run the probe as user code instead (for example `import js; js.eval(...)` in the Python prompt).
- **In a dev build the runner page comes from Metro over http**, so `file://` is refused before the page's
  security policy is even checked. Only a release build (pages from `file://`) shows whether the policy works;
  `release/smoke.yaml` checks it. A temporary stricter policy confirmed that workers inherit it.
- **Hidden DOM components need `position: absolute`, 1×1, opacity 0.** Expo gives them `flex: 1`, and 0×0 views
  are never created on Android.
- **The "DomWebView.injectJavaScript has been rejected" dev toast** is a harmless mount race; it is muted with
  `LogBox.ignoreLogs` in `app/_layout.tsx`.
- **Module build output** (`modules/*/android/build/`) is gitignored; it was committed once by mistake.
- **A Python download that breaks halfway hangs** (Pyodide). Stop recovers; setup offers "Try again".
- **`adb emu kill` is a hard kill:** writes not yet flushed are lost (a Termux setting came back as NUL bytes).
  `e2e.sh` and `termux-setup.sh` run `adb shell sync` first.
- **Maestro's `clearState` also resets TARKA's Termux permission**, so the Termux flow taps Allow each time.
- **Termux creates its properties file with `# allow-external-apps = true` commented out**; match `^allow-…`.

## Session 2: 2026-10-09 (day)

### Done (device-verified on the emulator unless marked)
- **Review fixes** from the security review and the Phase 5–6 review, all fixed with tests:
  - The agent answers every tool call after Stop, stops when you leave the project, and a new approval card rejects an old one.
  - Agent file tools: no `..`, no `.git`, `./a.js` means `a.js`; a write never replaces unsaved edits or a file that
    changed while the card was open; delete only works on files; long output is cut with a note.
  - Switching AI provider mid-chat no longer sends empty assistant turns to Claude; the key field can't show the other provider's key.
  - Runner: stops after 5000 output lines, Stop always ends the run, Python gets 3 minutes, `./style.css` works in the
    preview, and code you run can't `fetch`/XHR `file://` (Expo's WebView allows file reads; `import()` still can, see DEBT.md).
- **Phase 7:**
  - Commit detail screen (History → tap a commit → its files → a file's diff). Shallow clones say the changes weren't downloaded.
  - Ctrl+S on hardware keyboards; swipe the editor header to switch open files.
  - Tablet side rail at 768 dp and wider; a first-launch tips card; empty-list hints; the HTML preview fills the screen.
  - **Read lock really keeps the keyboard down now.** Android re-shows the WebView's keyboard when a sheet closes;
    native dismiss calls can't close a WebView's keyboard, so the editor focuses and blurs a throwaway input
    (`hideKeyboard` command). Found by reading the editor's live state over Chrome DevTools (see TESTING.md).
- **End of phase:** `/ponytail-review` (5 findings, all fixed), code-simplifier pass, `/ponytail-debt` (7 markers).
- **Tests:** 86 unit tests, 13 Maestro flows (all green on the first try), plus `.maestro/release/smoke.yaml` for release builds.
- **Release v0.1.0:** signed APK (arm64-v8a + x86_64, Android 7.0+, 66 MB) built with `scripts/build-release.sh`,
  smoke-tested on the emulator without Metro (JS, Python, `file://` blocked), and attached to the GitHub release.
  The signing key is in `~/.config/tarka/` (see RELEASE.md), never in the repo.

### Next up
1. Owner: try the v0.1.0 APK on the phone (list in REVIEW.md) and add a Claude key for a live agent test.
2. Agent tools still missing: git diff and run.
3. Close the `import()` gap in the runner (DEBT.md): a runner WebView without file access.
4. Large-file performance measurements; restore unsaved buffers on launch.
5. Later phases in ROADMAP.md: compilers v2, Termux bridge, SSH + terminal.

### Known issues / gotchas for the next agent
- **Dev-only red toast "Call to function 'DomWebView.injectJavaScript' has been rejected".** Expo's DOM wrapper answers
  every WebView function call and re-sends props on every render through `injectJavaScript`; when that view's tag
  can't be resolved at that moment the promise rejects. Seen once in the run flow (passed on retry). Release builds
  show no toast. If it starts blocking flows, find which DOM component calls back while its tab is in the background.
- **isomorphic-git misses a same-size edit made within the same second** as staging (the "racy git" case): it trusts
  the file's size + mtime. Tests change the file size on purpose.
- **A freshly mounted tab can draw one frame with its header under the status bar** (native `SafeAreaView` measures
  after layout). Cosmetic.

## Session 1, part 2: 2026-10-09 (morning)

### Done (device-verified on the emulator unless marked)
- **Review fixes:**
  - The first `/ponytail-review` found 6 issues, including leaving a project within 1.5 seconds losing the edit. All are fixed.
  - The security review and the Phase 4 review found 14 more, including staged work lost on pull or branch switch, the token sent to any host, and `../` deep links. All are fixed.
- **Phase 3 complete:** file actions, git colors with a letter badge, quick-open, search.
- **Phase 4 complete:**
  - Settings: theme switch, git identity and token.
  - Git tab: init, stage, unstage, stage all, commit.
  - Diff view, history, branches.
  - Clone, pull and push, verified against a local git server: a push from the emulator really arrives.
  - Conflicts: a conflicting pull stops and names the files. There is no merge editor.
- **Phase 5 complete:** Run tab with JS, TS, Python (Pyodide) and HTML preview, with a Stop that kills endless loops.
- **Phase 6 (agent):** built and unit-tested.
  - The loop: step budget, loop detection, stop.
  - Tools: list, read, search, write, delete, git status. Writes and deletes need approval.
  - Providers: Anthropic and OpenAI-compatible.
  - Timeline UI and approval card with a diff.
  - The device flow (`.maestro/agent.yaml`, against `scripts/fake-ai.cjs`) is in the full-suite run in progress. See the next entry.
- **Tests:** 75 unit tests and 12 Maestro flows.

### Next up
1. Confirm the full suite run (12 flows incl. `agent`) and fix whatever fails.
2. End-of-phase checks for Phases 5 and 6:
   - `/ponytail-review` on the run and agent diff.
   - `security-review` on the agent: model-controlled tool input and keys.
3. Phase 7 polish:
   - Tablet rail layout.
   - Make the HTML preview fill the height.
   - Commit detail screen.
   - Swipe between tabs in the header; Ctrl+S on hardware keyboards.
   - Onboarding.
   - Release APK test run.
4. Live test with a real Claude key. The owner adds one in Settings → AI; the default model is `claude-opus-5-5`.

### Known issues / gotchas for the next agent
- **Messy commits:** two commits contain unrelated files.
  - `bba66bc` ("git tab: …") also added the first version of the Run feature files.
  - `5d1c823` ("commit hook …") also added the agent providers.
  - Both were already pushed, so they were left as they are (no force-push).
  - Lesson: run `git reset -q` before staging each commit, and never `git add -A` on `app` or `src` broadly.
- **The commit hook** blocks attribution lines only (Co-Authored-By, "Generated with", the Anthropic noreply address, "Claude Code"). It used to block the plain word "anthropic", which is a provider name in this app.
- **Don't edit files while `npm run e2e` runs.**
  - Metro hot-reloads mid-flow and bash reads `e2e.sh` as it goes.
  - For long runs, copy the script first: `cp scripts/e2e.sh scripts/.e2e-run.sh && bash scripts/.e2e-run.sh` (gitignored).
- **Back from Run, Git or Agent goes to the Code tab first** (React Navigation tabs), then home. Flows need two `back`s.
- **Android WebView workers:**
  - `importScripts()` from another site fails; `fetch` and `import()` work.
  - Pyodide 314 needs `new Worker(url, { type: 'module' })`.
- **DOM-component props are fresh JSON copies on every re-render.** Key effects on ids (`job?.id`, `command?.id`), never on objects.
- **Emulator memory:**
  - `-gpu guest` rendering; `e2e.sh` restarts the emulator above 4.5 GB.
  - `scripts/build-apk.sh` stops the emulator while Gradle runs. Both don't fit in 15 GB.
- **Maestro:**
  - Use `hideKeyboard` before tapping buttons in a sheet the keyboard pushed up.
  - Views behind sheets and drawers still match text, so use unique `accessibilityLabel`s.
  - WebView accessibility text only refreshes on a fresh load.
- **Gradle needs IPv4.** `scripts/env.sh` handles it.
- **Never run `pkill -f <text>`** when `<text>` also appears in your own shell command (it kills your shell). Use `kill $!` or the bracket trick, and keep it out of compound commands.

## Session 1: 2026-10-08 night
- Phase 0: repo, hooks, docs, the Android toolchain (`scripts/setup-android.sh`), and the dev build.
- Phase 1: slate/brass design system, projects home and templates, workspace dock, explorer drawer.
- Phase 2: CodeMirror 6 editor in a DOM component.
  - Key row that keeps the keyboard open, plus trackpad and suggestion chips with usage memory.
  - Autosave, tabs, find/replace, read lock, pinch zoom, large-file guard.
