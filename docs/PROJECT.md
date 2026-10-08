# TARKA: what we are building

A mobile IDE that feels clean while you write code on a phone. The editor comes first, and everything else stays one tap away.

## Goals

1. **Writing code on a phone should not feel clumsy.**
   - Big touch targets, and a key row with the symbols you need.
   - Drag the key row to move the cursor, and get suggestion chips above the keyboard.
   - No keyboard popping up while you scroll.
   - Autosave, so work is never lost.
2. **The whole loop happens in one app:** explore → edit → run → review the diff → commit → push.
3. **AI that works with you, not around you:** the agent proposes changes as diffs, and you approve every write.
4. **Code anyone can read:** short files, plain functions and few dependencies (see AGENTS.md).

## Feature list (v1)

| Area | What you can do |
|---|---|
| Projects | Create from a template (JS, Python, Web), clone from a git URL, open recent, rename, delete. |
| Explorer | Folder tree in a left drawer, new/rename/delete/duplicate files, git status colors, fuzzy quick-open, text search. |
| Editor | CodeMirror 6 with syntax highlighting for common languages, tabs, autosave, undo/redo, find/replace, go to line, soft wrap, pinch zoom, read lock, key row with cursor trackpad, suggestion chips with a local usage memory. |
| Git | Status, stage/unstage, colored diff, commit, history, branches, clone/pull/push over HTTPS with a personal access token. |
| Run | JavaScript, TypeScript, HTML preview and Python (Pyodide), all running on the phone in a sandbox. Console output, stdin, timeouts, and run history suggestions. |
| Agent | Bring your own key (Anthropic, any OpenAI-compatible endpoint, local Ollama). Tools to list, read, search, write, run and check git. Every write needs approval. Step budget and stop button. |
| Settings | Theme (dark/light), font size, line height, wrap, autosave, git identity and tokens, AI providers. |

## Not in v1 (see ROADMAP.md)

SSH workspaces and a terminal, compiled languages on the device (see COMPILERS.md), LSP, a debugger, iOS builds, tablet split panes.

## Platforms

Android first: the owner tests on an Android phone, and all automated tests run on an Android emulator.
The code stays cross-platform (Expo), so iOS can follow later.
