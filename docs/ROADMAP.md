# Roadmap

Check items off as they land (each must pass the definition of done in [HANDOFF.md](HANDOFF.md#definition-of-done)).
`[x]` done and tested. `[~]` built and unit-tested, but the device (Maestro) test is still pending.

## Phase 0: repo and dev setup
- [x] Expo skeleton, commit hook, rules, and the docs skeleton
- [x] Android toolchain + emulator (`scripts/setup-android.sh`)
- [x] expo-router, eslint, prettier, jest, and the `npm run check` script
- [x] Dev build installs on the emulator. The Maestro "app launches" flow plus a screenshot.
- [x] TESTING.md and DEV_SETUP.md written from what actually worked

## Phase 1: design system and shell
- [x] Theme tokens (dark/light) + fonts + `useTheme`
- [x] Shared components: Button, IconButton, ListRow, Chip, EmptyState, Header, TextField
- [x] Projects store + home screen (empty state, list)
- [x] Create a project from a template (JS, Python, Web); rename and delete
- [x] Workspace screen with the bottom dock (Code, Git, Run, Agent)
- [x] Explorer drawer with a file tree (read-only)
- [x] Settings screen (theme switch, git identity and token)

## Phase 2: editor core
- [x] Spike: CM6 DOM component + native key row. The keyboard stays open when tapping keys.
- [x] Languages + slate/chalk editor theme
- [x] Open, edit, save, dirty state, autosave
- [x] Tabs + tab sheet + swipe the header to switch files
- [x] Key row: symbols per language, arrows, undo/redo
- [~] Trackpad caret movement on the key row
- [~] Suggestion chips + usage memory
- [x] Find and replace
- [~] Pinch zoom, read lock, go to line, Ctrl+S (read lock and Ctrl+S device-tested; pinch still to check)
- [~] Large-file guard (over 2 MB opens read-only)

## Phase 3: explorer and search
- [x] New, rename, delete and duplicate files and folders (long-press sheet)
- [x] Git status colors on rows
- [x] Fuzzy quick-open
- [x] Project-wide text search

## Phase 4: Git
- [x] Git identity in settings; init a repo
- [x] Status list; stage and unstage
- [x] Diff view
- [x] Commit
- [x] History + commit detail screen (files changed, diff per file)
- [x] Branches: list, create, switch
- [x] Clone, pull, push with a token
- [~] Conflicts: a pull that conflicts stops and names the files (isomorphic-git aborts the merge); no in-app merge editor yet

## Phase 5: run on the device
- [x] Sandbox DOM component with timeouts (module Web Worker, killed on stop/timeout)
- [x] JavaScript, TypeScript (sucrase)
- [x] HTML preview (local CSS/JS inlined, fills the screen)
- [x] Python (Pyodide 314.0.7 from jsDelivr, cached after the first run)
- [x] Console, stdin (run-history suggestions dropped: there is no command box on the phone yet)
- [x] COMPILERS.md research doc

## Phase 6: agent
- [x] Provider settings (Anthropic, OpenAI-compatible incl. Ollama), keys in secure storage
- [x] Agent loop with step budget, loop detection and stop
- [x] Tools: list, read, search, write and delete (with approval), git status
- [ ] Tools: git diff and run (not built yet)
- [x] Timeline UI + approval cards with diff + stop (device-tested against `scripts/fake-ai.cjs`)
- [ ] Live test with a real Claude key (needs the owner's key)

## Phase 7: polish
- [x] Tablet layout: side rail at 768 dp and wider (checked with `adb shell wm size 1600x2560` + `wm density 320`)
- [x] Onboarding: a tips card on the home screen until "Got it"
- [x] Empty states: hints for an empty console, file tree, quick-open and a clean Git tab
- [ ] Large-file performance: only the guard exists (over 2 MB opens read-only); no measurements yet
- [~] Unsaved edits when the app is killed: autosave runs when the app goes to the background, so only
      the last 1.5 s of typing before a crash can be lost. No restore-on-launch yet.
- [x] Release APK (signed, tested on the emulator, attached to the GitHub release)

## Later
- [ ] On-device compilers v2 (see COMPILERS.md)
- [ ] Termux bridge (Android)
- [ ] SSH workspaces + terminal (xterm.js)
- [ ] AI inline completions (opt-in)
- [ ] LSP diagnostics
- [ ] Local Linux (PRoot + Ubuntu)
- [ ] iOS build
