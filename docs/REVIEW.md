# Morning review checklist

What the owner should look at after an unattended session. Newest first.
Screenshots live in `.artifacts/screens/`. That folder is not committed; regenerate it with `npm run e2e`.

## Session 1: 2026-10-08

### Decisions made without you
- **Look:** the "slate and brass" theme, with Atkinson Hyperlegible Next for the UI and JetBrains Mono for code. See `docs/UI.md`. Tell me if you want a different accent or font.
- **Removed the Expo template's `LICENSE` file**, because it named Expo as the copyright holder. **Pick a license** if you want one.
- **The GitHub repo `akshajtiwari/tarka` was created as private.** Make it public if you like.
- **The trackpad gesture is "press and hold the key row, then slide"**, rather than a plain slide, so that sliding still scrolls the symbol keys.
- **Suggestions are learned only from chips you tap**, not from every word you type. That keeps the memory clean.
- **The editor sends commands with a `command` prop** rather than Expo's alpha `useDOMImperativeHandle`. It is stable and simpler to read.
- **Git storage (planned):** isomorphic-git will run on top of expo-file-system through a small adapter. There is no symlink support, because the phone's file system has none.

### Things to try on your phone (once `scripts/phone.sh` works)
1. Create a project and open `main.py`. Does typing feel smooth? Does the keyboard stay open when you tap the key-row symbols?
2. Press and hold the key row, then slide left and right. Does the cursor follow your finger at a good speed? (The speed is set by `CHAR_STEP` in `src/features/editor/useTrackpad.ts`.)
3. Type `pri` in a Python file. Do suggestion chips show up above the keys?
4. Pinch the code to zoom. Turn on read lock in the ⋯ menu, then scroll: the keyboard should not pop up.

### Blockers
- The first dev build was slow. The laptop ran low on memory (15 GB total, with the emulator, Gradle and the browser all open).
  I stopped the emulator while Gradle compiled.
