# Handoff: start here

This page is for anyone picking up TARKA, human or AI agent, with no other context.

## What TARKA is

TARKA is a mobile IDE for phones, Android first. It has a clean code editor, a file explorer, Git (status, diff, commit, push),
on-device code running, and an AI agent that edits code with your approval.
It is built with Expo (React Native), with CodeMirror 6 as the editor.
The full product description is in [PROJECT.md](PROJECT.md).

## Read in this order

1. [PROGRESS.md](PROGRESS.md): where the work stopped, what is next, and known issues.
2. [ROADMAP.md](ROADMAP.md): all phases with checkboxes.
3. [ARCHITECTURE.md](ARCHITECTURE.md): folders, data flow, and how the editor, git, runner and agent fit together.
4. [UI.md](UI.md): the design rules every screen follows.
5. [DEV_SETUP.md](DEV_SETUP.md) and [TESTING.md](TESTING.md): how to run, build and test.
6. [DECISIONS.md](DECISIONS.md): why each library or approach was chosen.
7. [DEBT.md](DEBT.md): known shortcuts and when to fix them.
8. [RELEASE.md](RELEASE.md): building, signing and publishing an APK (the key lives outside the repo).
9. [reference/nimotecode-notes.md](reference/nimotecode-notes.md): what we learned from NimoteCode, and which of its docs to re-read for each phase.

## How to continue

1. Run `git log --oneline | head -20` and read `PROGRESS.md` → **Next up**.
2. Run `source scripts/env.sh`, start the emulator with `scripts/emulator.sh`, and run `npm start`. Check that the current state is green with `npm run check` and `npm run e2e`.
3. Take the next unchecked item in `ROADMAP.md`. Work in small steps, and finish each one by the definition of done below.
4. Before you stop, update `PROGRESS.md` (done, next, issues) and `REVIEW.md` (what the owner should look at).

## Definition of done

A step is done only when all of these pass:

1. `npm run check` (typecheck, lint and unit tests).
2. Its Maestro flow on the emulator: `npm run e2e -- .maestro/<flow>.yaml`.
3. A screenshot of the changed screen has been taken (`scripts/shot.sh <name>`) and looked at.

New non-trivial logic (a branch, a loop, a parser, anything touching files, git or keys) gets at least one small test.
Keep code simple: short files, plain functions, common libraries only. Commit each green step on its own, authored
by the owner, and never leave `main` red. At the end of a phase, review the phase diff, refresh `DEBT.md`, and test
a release APK (`RELEASE.md`).

## Where the owner is

The owner (Akshaj) often runs long unattended sessions. Don't wait for answers.
Choose the simplest option, log it in `DECISIONS.md`, and flag it in `REVIEW.md`.
The owner tests on an Android phone. Use `scripts/phone.sh` when a phone is plugged in.
