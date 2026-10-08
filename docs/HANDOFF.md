# Handoff: start here

This page is for anyone picking up TARKA, human or AI agent, with no other context.

## What TARKA is

TARKA is a mobile IDE for phones, Android first. It has a clean code editor, a file explorer, Git (status, diff, commit, push),
on-device code running, and an AI agent that edits code with your approval.
It is built with Expo (React Native), with CodeMirror 6 as the editor.
The full product description is in [PROJECT.md](PROJECT.md).

## Read in this order

1. [../AGENTS.md](../AGENTS.md): the rules (commits, code style, libraries, definition of done). **Mandatory.**
2. [PROGRESS.md](PROGRESS.md): where the work stopped, what is next, and known issues.
3. [ROADMAP.md](ROADMAP.md): all phases with checkboxes.
4. [ARCHITECTURE.md](ARCHITECTURE.md): folders, data flow, and how the editor, git, runner and agent fit together.
5. [UI.md](UI.md): the design rules every screen follows.
6. [DEV_SETUP.md](DEV_SETUP.md) and [TESTING.md](TESTING.md): how to run, build and test.
7. [DECISIONS.md](DECISIONS.md): why each library or approach was chosen.
8. [DEBT.md](DEBT.md): known shortcuts and when to fix them.
9. [reference/nimotecode-notes.md](reference/nimotecode-notes.md): what we learned from NimoteCode, and which of its docs to re-read for each phase.

## How to continue

1. Run `git log --oneline | head -20` and read `PROGRESS.md` → **Next up**.
2. Run `source scripts/env.sh`, start the emulator with `scripts/emulator.sh`, and run `npm start`. Check that the current state is green with `npm run check` and `npm run e2e`.
3. Take the next unchecked item in `ROADMAP.md`. Work in small steps and follow AGENTS.md section 5 for each one.
4. Before you stop, update `PROGRESS.md` (done, next, issues) and `REVIEW.md` (what the owner should look at).

## Where the owner is

The owner (Akshaj) often runs long unattended sessions. Don't wait for answers.
Choose the simplest option, log it in `DECISIONS.md`, and flag it in `REVIEW.md`.
The owner tests on an Android phone. Use `scripts/phone.sh` when a phone is plugged in.
