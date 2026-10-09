# Roadmap

Check items off as they land (each must pass the definition of done in AGENTS.md).
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
- [x] Tabs + tab sheet (header swipe still to do)
- [x] Key row: symbols per language, arrows, undo/redo
- [~] Trackpad caret movement on the key row
- [~] Suggestion chips + usage memory
- [x] Find and replace
- [~] Pinch zoom, read lock, go to line (read lock device-tested; pinch and Ctrl+S still to check)
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
- [x] History (commit detail screen still to do)
- [x] Branches: list, create, switch
- [x] Clone, pull, push with a token
- [~] Conflicts: a pull that conflicts stops and names the files (isomorphic-git aborts the merge); no in-app merge editor yet

## Phase 5: run on the device
- [ ] Sandbox DOM component with timeouts
- [ ] JavaScript, TypeScript (sucrase)
- [ ] HTML preview
- [ ] Python (Pyodide)
- [ ] Console, stdin, run-history suggestions
- [ ] COMPILERS.md research doc

## Phase 6: agent
- [ ] Provider settings (Anthropic, OpenAI-compatible, Ollama), keys in secure storage
- [ ] Agent loop with step budget and loop detection
- [ ] Tools: list, read, search, write and delete (with approval), git status and diff, run
- [ ] Timeline UI + approval cards with diff + stop

## Phase 7: polish
- [ ] Tablet layout (side rail)
- [ ] Onboarding, empty states, error messages pass
- [ ] Large-file performance
- [ ] Restore unsaved buffers after the app is killed
- [ ] Release APK

## Later
- [ ] On-device compilers v2 (see COMPILERS.md)
- [ ] Termux bridge (Android)
- [ ] SSH workspaces + terminal (xterm.js)
- [ ] AI inline completions (opt-in)
- [ ] LSP diagnostics
- [ ] Local Linux (PRoot + Ubuntu)
- [ ] iOS build
