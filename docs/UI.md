# UI design rules

Every screen follows these rules. All values come from `src/theme/`, so never hard-code a color or size in a component.

## Idea

*Tarka* is Sanskrit for reasoning. The app should feel like a quiet slate you think on, not a dashboard.
The look is **slate and chalk with one brass accent**. Brass marks only where you are and what is happening:
the caret, the active line, the focused tab, a running state, and the main action on a screen.
Everything else stays calm and neutral.

The one memorable detail is the **brass caret and active-line bar** in the editor. Keep everything around it quiet.

## Color tokens

| Token | Dark ("Slate", the default) | Light ("Chalk") | Used for |
|---|---|---|---|
| `bg` | `#1B2124` | `#EEF1F0` | screen and editor background |
| `surface` | `#222A2D` | `#F8FAF9` | header, dock, drawer, sheets |
| `raised` | `#2B3437` | `#E3E8E6` | pressed rows, inputs, chips |
| `line` | `#38423F` | `#CBD3D0` | hairline borders and dividers |
| `text` | `#E6E1D3` | `#1D2528` | main text (chalk-white / ink) |
| `muted` | `#97A19E` | `#5E6966` | secondary text, icons, line numbers |
| `accent` | `#C9A227` | `#7C5F05` | brass: caret, active line, focus, primary button |
| `onAccent` | `#1B2124` | `#FFFFFF` | text on brass |

**Status colors**, one vocabulary shared by Git, Run and Agent:

| Status | Dark | Light |
|---|---|---|
| success | `#7FB685` | `#2F7A3A` |
| warning | `#E2B04A` | `#8F6200` |
| error | `#E5736A` | `#B3261E` |
| running | `#79A7D3` | `#2B5F91` |
| added (diff) | success at 14% alpha on bg | same |
| removed (diff) | error at 14% alpha on bg | same |

**Syntax colors (dark)**

| Token | Color |
|---|---|
| keyword | `#C8A2D8` |
| string | `#A7C796` |
| number / constant | `#E7A37E` |
| function | `#8DB6D9` |
| type | `#E2C27A` |
| property | `#B9D2CE` |
| comment | `#818D8A`, italic |
| tag | `#E7A37E` |
| invalid | `#E5736A` |

Light uses darker versions of the same hues (see `src/theme/colors.ts`).

## Type

- **Interface:** Atkinson Hyperlegible Next, 400 and 600. It was designed for legibility, which helps on small screens and in sunlight.
- **Code, paths, line numbers, diffs and console output:** JetBrains Mono, 400 and 600. It has a tall x-height and clear `0O1lI`.

| Size | Use |
|---|---|
| 12 | captions, line numbers, badges |
| 14 | secondary row text, chips, code (the default; the user can change it) |
| 16 | body and row titles |
| 20 | sheet and section titles |
| 28 | home screen title |

- Code line height is 1.6. UI line height is about 1.35.
- Sentence case everywhere. No all-caps labels and no decorative labels above headings.

## Space, size, shape

- **Spacing:** 4, 8, 12, 16, 24, 32. Screen padding is 16.
- **Touch targets:** at least 44×44.
- **Fixed heights:**
  - Header 48.
  - Row 48 (explorer rows 40, with a 44 hit area).
  - Dock 56 plus the safe area.
  - Key row 44.
  - Suggestion strip 40.
- **Radius ladder:**
  - 6 for chips, inputs and the active-line bar ends.
  - 10 for buttons and list groups.
  - 16 for the top corners of sheets.
- Borders are hairlines (`StyleSheet.hairlineWidth`) in `line`. No drop shadows. Elevation comes from `surface` and `raised` instead.

## Layout

```
┌──────────────────────────┐
│ ☰  App.tsx ● ▾     💾 ⋯ │  header 48: file pill, dirty dot, tab sheet
├──────────────────────────┤
│ 1 │import React from …   │  editor: slim gutter, brass active-line bar
│ 2▐│export default App()  │
│ 3 │                      │
├──────────────────────────┤
│  Code   Git   Run  Agent │  dock 56, hidden while the keyboard is up
└──────────────────────────┘

keyboard up:
│ [useState] [useEffect] […] │  suggestion chips (40)
│ ⇥ { } ( ) ; = " ← → ↶ ↷  │  key row (44), hold + slide = trackpad
│ [        keyboard        ] │
```

- Content is left-aligned. Lists are full width, with no cards inside cards.
- The explorer is a left drawer: 84% of the width, at most 360.
- Sheets (tabs, file actions, branch) slide up from the bottom, with their actions in thumb reach.
- At 768dp and wider the dock becomes a left rail (80 wide) that stays while typing. Each tab then pads its own bottom
  for the system nav bar. The explorer is still a drawer there (a pinned explorer is a later idea).
- **First launch:** a tips card on the home screen lists the phone-only tricks (edge swipe, trackpad, pinch, read lock,
  AI key) until "Got it".
- **Empty lists** get one quiet muted line (`Hint`) saying what shows up there; whole empty screens use `EmptyState`.

## Editor behavior

- Soft wrap is on by default. The gutter is slim, with no fold gutter on phones.
- **Read lock** (⋯ menu): taps don't place the caret, so scrolling never opens the keyboard. The find and go-to-line
  boxes still get the keyboard.
- **Swipe the header** left or right to move between open files (a light haptic tick). Ctrl+S saves on a hardware keyboard.
- Autosave runs after 1.5 seconds without typing, on tab switch, and when the app goes to the background.
  A dirty file shows a brass dot and a save icon in the header.
- Pinch to zoom the code font (10–24), and the size is remembered.
- **Key row keys:** Tab, symbols for the current language, ← →, undo, redo. Long-press a key for its pair, for example `(` → `()`.
- **Trackpad:** press and hold the key row, then slide. Sideways moves the caret by characters, up/down moves it by lines, with a light haptic tick for each step.
- **Suggestions** come from keywords, project words, snippets and usage memory. They show as chips; tap one to insert it.

## Motion

- Motion answers an action only: the drawer slides, sheets rise, the dock slides away with the keyboard animation. Duration is 200ms, ease-out.
- No entrance animations on screens and no decorative motion. When the system "reduce motion" setting is on, these become instant.
- Haptics are light: key-row taps, trackpad steps, and a successful commit or save.

## Writing

- Plain verbs that say exactly what happens: "New project", "Clone repository", "Save", "Commit 3 files", "Run", "Ask the agent".
- The same action keeps the same word all the way through: the "Commit" button leads to a "Committed" toast.
- **Errors** say what happened and what to do next, without apologizing. For example: "Push failed: the token was rejected. Add a new token in Settings → Git."
- **Empty states** invite an action. For example: "No projects yet. Create one from a template or clone a repository."

## Accessibility

- Every icon button has an `accessibilityLabel`. Maestro tests also use these labels.
- Text contrast is at least 4.5:1 against its background. Never rely on color alone: diff lines also show `+` and `-`, and status also shows an icon.
