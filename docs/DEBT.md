# Shortcut ledger

Every `// shortcut:` comment in the code, gathered at the end of each phase (`/ponytail-debt`).
Each entry gives where it is, what was simplified, the limit, and when to upgrade it.

Last refreshed: 2026-10-09, after phases 4–6.

## app/
- `app/search.tsx:31`: search reads every file on the UI thread.
  - **Limit:** freezes on very large repos.
  - **Upgrade:** move the walk off the UI thread (clone has landed, so this can bite now).
- `app/quick-open.tsx:20`: quick-open walks the whole project on the UI thread.
  - **Limit:** slow on very large repos.
  - **Upgrade:** cache the file list or move the walk off the UI thread.

## src/
- `src/lib/gitFs.ts:83`: `lstat` is the same as `stat`.
  - **Limit:** no symlink support (expo-file-system has none).
  - **Upgrade:** if repos with symlinks matter.
- `src/features/git/gitService.ts:125`: there is no screen to add a remote.
  - **Limit:** only cloned projects can push and pull.
  - **Upgrade:** add a remote screen when needed.
- `src/features/agent/providers/openai.ts:17`: OpenAI-compatible replies are not streamed.
  - **Limit:** the whole reply arrives at once.
  - **Upgrade:** stream it if slow replies feel stuck.

5 markers, all with an upgrade trigger.
