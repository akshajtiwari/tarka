# Progress log

Newest session first. Each entry lists what was done, what's next, and known issues.

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
