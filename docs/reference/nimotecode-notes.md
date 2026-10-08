# Notes from NimoteCode (reference only)

NimoteCode is a commercial, closed-source mobile IDE built with Flutter and Rust. Its public docs and website
live at `~/Projects/nimotecode`. **That folder is read-only for us: never edit it or touch its git state.**
These notes are our own summary. Go back to the original files for detail.

## Which files to re-read for each phase

| Our phase | Re-read in `~/Projects/nimotecode` |
|---|---|
| 1 Design system and shell | `docs/releases/index.md` (1.1.9: the design system rebuild), `docs/docs/settings.md` |
| 2 Editor | `docs/docs/editor.md`, `docs/blog/why-existing-flutter-code-editors-broke-down-when-i-built-a-mobile-ide.md`, `docs/releases/index.md` (1.2.0) |
| 3 Explorer and search | `docs/docs/search.md`, `docs/docs/ssh.md` |
| 4 Git | `docs/docs/source-control.md` |
| 5 Run | `docs/docs/tasks.md`, `docs/docs/terminal.md`, `docs/docs/local-linux*.md` |
| 6 Agent | `docs/docs/ai.md`, `docs/docs/configuration.md`, `docs/docs/security.md`, `docs/blog/agent-design-is-bounded-optimization-not-intelligence.md` |
| Later: SSH / terminal | `docs/docs/ssh.md`, `docs/docs/terminal.md`, `examples/*/README.md`, `resources/*.md` |

## What they have (feature inventory)

**Workspaces**
- Local project, SSH remote, or Android "Local Linux" (Ubuntu through PRoot, no root, ARM64 and x86_64).
- You can switch directories and return to recent folders.

**Editor**
- Phones use their own "Nimote Editor". Tablets and desktop get Monaco.
- Tabs, two split panes, and a media preview for images, audio and video.
- Copy, cut, paste, select all, undo and redo. Line and column display, and an outline.
- A monospace font by default. Symbol actions are grouped under **More**, plus an optional AI tools bar.
- Lots of fixes for hardware keyboards, CJK/IME input, duplicate input, and touch selection handles.

**Explorer**
- A 44px row "touch band". Font size 11–20 and row height 28–48 are configurable.
- The active file stays highlighted, and rows show Git status colors.

**Git**
- Status (staged, unstaged, conflicted), diffs, history, commit detail and branches.
- Commit, push, pull and stash. Git AI helps explain a change or draft a commit message.

**Terminal**
- Runs commands in the workspace, with output search, quick commands, clickable links and multiple terminals.
- One shared SSH login environment is used by every tool.

**AI**
- Bring your own key, with 14 provider templates. The model list is read from `/models` (OpenAI-compatible) or `/api/tags` (Ollama).
- AI Chat is for quick answers. The AI Agent handles multi-step work: inspect → plan → execute → verify → preview.
- External ACP agents (Claude Code, Codex) and `/` slash commands.

**Preview**
- An in-app browser, plus an HTML snapshot preview that includes unsaved changes.

**Other**
- Tasks (saved commands), LSP diagnostics, a debugger (PHP via Xdebug), and sync/cache between local and remote.

## Design lessons worth copying

- **The layout follows the available space, not the orientation.** A phone gets a single-surface shell with bottom navigation. A wide screen gets a rail and resizable panels.
- **One density scale, one control size, and one status vocabulary:** running, waiting, success, warning, error, cancelled.
- Neutral grays, with the **accent color reserved for state**. One radius and hairline ladder.
- One menu style shared by popups and bottom sheets. A menu "hugs its widest entry".
- The phone "more" menus stay usable while the soft keyboard is up.
- An interface-scale setting (100–150%).
- **The agent timeline is not chat bubbles.**
  - The user prompt is a quote block, and plan steps carry state.
  - Each tool call is one compact row with a monospace command and `+n −m` per file.
  - A change review shows one row per file.
- A small global indicator shows when an agent is running.

## Engineering lessons from their blog

- **Treat the editor as infrastructure, not a widget.** One document model is the source of truth, and Git diff, LSP and the panels all read from it.
- Mobile selection and scrolling need their own design. Desktop behavior can't just be shrunk down.
- **Agents are "bounded optimization over partial information".**
  - Typical failures: repeated file reads, redundant tool calls, over-exploration and loops that never end.
  - The fixes: exploration budgets, loop detection, phases (analysis → plan → execute) and early stopping.
- Even with heavy AI help, the hard parts are architecture, correctness across features, and testing real behavior.

## Where we deliberately differ

- We use React Native and Expo, with CodeMirror 6 in a WebView, rather than Flutter with a custom editor. CM6 already solves mobile selection and IME well.
- v1 runs code **on the device** (JS, TS, HTML, Python in a sandbox). SSH and Local Linux come later.
- The key row has a cursor trackpad, and the suggestion chips sit above it. A **read lock** stops the keyboard popping up while you scroll.
- Every agent write needs explicit approval, shown as a diff card.
