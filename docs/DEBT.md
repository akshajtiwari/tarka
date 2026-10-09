# Shortcut ledger

Every `// shortcut:` comment in the code, gathered at the end of each phase (`/ponytail-debt`).
Each entry gives where it is, what was simplified, the limit, and when to upgrade it.

Last refreshed: 2026-10-09, before the 0.2.0 release.

## app/
- `app/search.tsx:36`: search reads every file on the UI thread (it now shows "Searching…" while it works).
  - **Limit:** slow on very large repos.
  - **Upgrade:** move the walk off the UI thread when that bites.
- `app/quick-open.tsx:28`: quick-open walks the whole project on the UI thread ("Listing files…" meanwhile).
  - **Limit:** slow on very large repos.
  - **Upgrade:** cache the file list or move the walk off the UI thread.

## src/
- `src/lib/gitFs.ts:112`: `lstat` is the same as `stat`.
  - **Limit:** no symlink support (expo-file-system has none).
  - **Upgrade:** if repos with symlinks matter.
- `src/features/git/gitRemote.ts:32`: there is no screen to add a remote.
  - **Limit:** only cloned projects can push and pull.
  - **Upgrade:** add a remote screen when needed.
- `src/features/termux/syncState.ts:3`: files deleted in TARKA stay in the Termux copy.
  - **Limit:** a build in Termux can still see a deleted file (even after `termux sync`, which only re-sends
    every file); `termux rm <file>` removes it there.
  - **Upgrade:** delete removed files during the copy if stale files start to confuse builds.
- `src/features/agent/providers/anthropic.ts:17`: Claude replies are not streamed.
  - **Limit:** the answer appears only when the turn is complete (the tool rows show progress meanwhile).
  - **Upgrade:** stream it (server-sent events) if turns feel slow.
- `src/features/agent/providers/openai.ts:10`: OpenAI-compatible (and Gemini) replies are not streamed.
  - **Limit:** the whole reply arrives at once.
  - **Upgrade:** stream it if slow replies feel stuck.

7 markers, all with an upgrade trigger.

## Known limits that aren't shortcuts
- **A Python download that breaks halfway hangs** (Pyodide's `loadPyodide` never settles). The terminal shows
  "Running…" until Stop; setup offers "Try again" after a minute, which replaces the stuck worker.
- **Termux output arrives when the command ends** (about 100 KB at most), and it can't take live input:
  that is how Termux's `RUN_COMMAND` works. `termux -i` would need a foreground session (not built).
