# Shortcut ledger

Every `// shortcut:` comment in the code, gathered at the end of each phase (`/ponytail-debt`).
Each entry gives where it is, what was simplified, the limit, and when to upgrade it.

Last refreshed: 2026-10-09, end of phases 1–3 (part).

## app/
- `app/search.tsx:31`: search reads every file on the UI thread.
  - **Limit:** freezes on very large repos.
  - **Upgrade:** once git clone lands, move the walk off the UI thread.
- `app/quick-open.tsx:20`: quick-open walks the whole project on the UI thread.
  - **Limit:** slow on very large repos.
  - **Upgrade:** once git clone lands, cache the file list or move the walk off the UI thread.

## src/
- `src/lib/gitFs.ts:83`: `lstat` is the same as `stat`.
  - **Limit:** no symlink support (expo-file-system has none).
  - **Upgrade:** if repos with symlinks matter.
- `src/features/workspace/PanelPlaceholder.tsx:12`: placeholder panels for Git, Run and Agent.
  - **Limit:** the panels don't exist yet.
  - **Upgrade:** delete as each panel is built.

4 markers, all with an upgrade trigger.
