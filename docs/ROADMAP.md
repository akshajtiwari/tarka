# Roadmap

Check items off as they land (each must pass the definition of done in AGENTS.md).
`[x]` done and tested. `[~]` built and unit-tested, but the device (Maestro) test is still pending.

## Phase 0: repo and dev setup
- [x] Expo skeleton, commit hook, rules, and the docs skeleton
- [x] Android toolchain + emulator (`scripts/setup-android.sh`)
- [x] expo-router, eslint, prettier, jest, and the `npm run check` script
- [ ] Dev build installs on the emulator. The Maestro "app launches" flow plus a screenshot.
- [x] TESTING.md and DEV_SETUP.md written from what actually worked

## Phase 1: design system and shell
- [~] Theme tokens (dark/light) + fonts + `useTheme`
- [~] Shared components: Button, IconButton, ListRow, Chip, EmptyState, Header, TextField
- [~] Projects store + home screen (empty state, list)
- [~] Create a project from a template (JS, Python, Web); rename and delete
- [~] Workspace screen with the bottom dock (Code, Git, Run, Agent)
- [~] Explorer drawer with a file tree (read-only)
- [~] Settings screen skeleton (theme switch still to do: follows the phone for now)

## Phase 2: editor core
- [ ] Spike: CM6 DOM component + native key row. The keyboard stays open when tapping keys.
- [~] Languages + slate/chalk editor theme
- [~] Open, edit, save, dirty state, autosave
- [~] Tabs + tab sheet (header swipe still to do)
- [~] Key row: symbols per language, arrows, undo/redo
- [~] Trackpad caret movement on the key row
- [~] Suggestion chips + usage memory
- [~] Find and replace
- [~] Pinch zoom, read lock, go to line (hardware keyboard Ctrl+S still to do)
- [~] Large-file guard (over 2 MB opens read-only)

## Phase 3: explorer and search
- [ ] New, rename, delete and duplicate files and folders (long-press sheet)
- [ ] Git status colors on rows
- [ ] Fuzzy quick-open
- [ ] Project-wide text search

## Phase 4: Git
- [ ] Git identity in settings; init a repo
- [ ] Status list; stage and unstage
- [ ] Diff view
- [ ] Commit
- [ ] History + commit detail
- [ ] Branches: list, create, switch
- [ ] Clone, pull, push with a token
- [ ] Conflicted-files list

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
