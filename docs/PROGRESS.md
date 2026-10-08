# Progress log

Newest session first. Each entry lists what was done, what's next, and known issues.

## Session 1: 2026-10-08 (night)

### Done
- **Phase 0:**
  - Repo from the Expo blank-typescript template (SDK 57.0.27, RN 0.86.3).
  - Commit hooks: no attribution lines, auto push to the private GitHub repo `akshajtiwari/tarka`.
  - AGENTS.md and all docs.
  - Android toolchain installed by `scripts/setup-android.sh`: JDK 17, SDK 36, NDK 27.1, AVD `tarka`, Maestro 2.11.
  - expo-router, eslint, prettier, jest (28 tests).
- **Phase 1 (built, device test pending):**
  - Slate/brass theme tokens and fonts (Atkinson Hyperlegible Next and JetBrains Mono).
  - Shared components.
  - Projects home, plus new-project and rename/delete sheets with three templates.
  - Workspace with the bottom dock and the explorer drawer.
  - Settings stub.
- **Phase 2 (built, device test pending):**
  - CodeMirror 6 in an Expo DOM component (`src/features/editor/CodeEditor.dom.tsx`).
  - Open files, dirty dot, Save, autosave after 1.5 seconds and on app background.
  - Tabs sheet.
  - Key row: language-aware symbols, arrows, undo/redo, hold-and-slide trackpad.
  - Suggestion chips with usage memory.
  - Editor menu: find/replace, go to line, wrap, read lock, font size.
  - Pinch zoom and the large-file guard.

### Next up
1. Get the first dev build onto the emulator (`npm run android`). The first try failed on a network drop; the retry is in progress.
2. Run `npm run e2e`: the flows `launch`, `projects` and `editor` in `.maestro/`. Fix whatever breaks.
   Look at the screenshots, then turn the `[~]` items in ROADMAP.md into `[x]`.
3. The most important thing to prove: **tapping a key-row button keeps the keyboard open** (see the `editor.yaml` flow).
   If it doesn't, fall back to rendering the key row inside the WebView (see the "Risks" section of the plan in DECISIONS.md).
4. Then do the rest of Phase 2 (header swipe between tabs, Ctrl+S), then Phase 3.

### Known issues
- The theme follows the phone's dark/light setting only. A manual switch in Settings is still to do.
- Not verified yet: whether `@expo/dom-webview` loads the JetBrains Mono font inside the editor.
  CSS asks for `JetBrains Mono, monospace`, so the fallback is the system monospace font.
