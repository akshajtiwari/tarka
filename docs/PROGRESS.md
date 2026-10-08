# Progress log

Newest session first. Each entry lists what was done, what's next, and known issues.

## Session 1: 2026-10-08 night → 2026-10-09

### Done (verified on the emulator unless marked)
- **Phase 0:** repo, hooks (no attribution lines, auto push to the private repo `akshajtiwari/tarka`), docs, the Android toolchain, and the dev build.
- **Phase 1:**
  - Slate/brass theme, fonts and components.
  - Projects home and templates; rename/delete.
  - Workspace dock and explorer drawer.
- **Phase 2:**
  - CodeMirror 6 editor in a DOM component.
  - Key row that keeps the keyboard open; brackets auto-close.
  - Suggestion chips; autosave; save when leaving a project.
  - Tabs sheet; ⋯ menu with find/replace, read lock and font size.
- **Phase 3 (part):** quick-open, search in files, and new/rename/duplicate/delete files and folders.
- **Git layer (no UI yet):** `src/features/git/gitService.ts`, tested against real repos with Node `fs`. `src/lib/gitFs.ts` is the expo-file-system adapter, not yet run on a device.
- **Test suite:**
  - 45 unit tests.
  - 8 Maestro flows in `.maestro/`, all passing with `npm run e2e`.
- **First `/ponytail-review` done.** All 6 findings fixed, including a data-loss bug: leaving a project within 1.5 seconds of typing used to lose the edit.

### Next up
1. **Phase 4: Git UI.**
   - The Git tab: init, then a status list with stage/unstage.
   - Diff view, commit with identity in Settings, history, branches.
   - Clone, pull and push with a token.
   - Check `gitFs` on the emulator first, with a flow that inits a repo and commits.
2. Phase 3 leftover: git status colors on explorer rows (needs Phase 4).
3. Phase 2 leftovers: swipe between tabs in the header, and Ctrl+S on hardware keyboards.

### Known issues / gotchas for the next agent
- **Emulator memory:** the renderer leaks memory (it reached 10 GB with `swiftshader_indirect`).
  `scripts/emulator.sh` now uses `-gpu guest`, and `scripts/e2e.sh` restarts the emulator above 6 GB. Host GPU mode crashed.
- **Maestro taps in sheets:** while the keyboard has pushed a sheet up, Maestro aims taps wrongly. Use `hideKeyboard` before tapping a sheet's buttons.
  Also, views behind sheets and drawers still match text, so give rows unique `accessibilityLabel`s (e.g. "File main.py").
- **WebView accessibility text** only refreshes on a fresh load. Check editor text after reopening the file, with a `(?s)` regex.
- **Maestro sometimes dies mid-step** under memory pressure. `e2e.sh` retries each failed flow once.
- **Gradle needs IPv4.** `scripts/env.sh` sets `JAVA_TOOL_OPTIONS=-Djava.net.preferIPv4Stack=true`.
- **Never run `pkill -f <name>`** where `<name>` also appears in your own command line. Use the `"[K]otlin…"` bracket trick.
