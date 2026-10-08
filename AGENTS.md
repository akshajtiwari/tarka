# Rules for anyone (human or AI agent) working on TARKA

TARKA is a mobile IDE for Android (iOS later) built with Expo / React Native.
Start with `docs/HANDOFF.md`. It tells you what to read, where the work stopped and how to continue.

## 1. Commits

- Every commit is authored by **Akshaj Tiwari <akshajtiwari9a@gmail.com>** and nobody else.
- **Never** add `Co-Authored-By`, "Generated with …", or any mention of an AI tool to a commit, a PR or a file.
  `.githooks/commit-msg` rejects these. Run `git config core.hooksPath .githooks` after cloning (`npm install` does it for you).
- Messages are short, casual and lowercase, the way a person writes them:
  `created the expo skeleton`, `file tree opens folders now`, `fixed save button not showing`.
  A `fix:` or `feat:` prefix is optional, not required.
- Keep commits small and realistic: one step each, roughly 30–300 lines of diff. No giant dumps.
- Only commit when the step passes its checks (see section 4).

## 2. Code style (keep it readable for a normal developer)

- Use `function` components and helpers, with an explicit `Props` type for each component.
- Use early returns. No nested ternaries. Use clear names: `openFile`, `isDirty`, `projectPath`.
- Put `try/catch` only where we touch files, network or git, and show a readable error message.
- Files stay short, about 150 lines max, with one component per file.
- Comments explain *why*, not *what*. Skip them when the code is obvious.
- Use TypeScript lightly. No clever generics or type gymnastics.
- When you cut a deliberate corner, leave `// shortcut: <the limit>, <when to upgrade>`.
  These are collected into `docs/DEBT.md`.

## 3. Libraries

- Prefer what already exists: React Native built-ins (FlatList, Modal, fetch), Expo modules, and code already in this repo.
- Only add a dependency that is common (a typical Expo developer would know it) or truly necessary.
  Never add one to save a few lines.
- Add a dependency in the same commit that first uses it, with one line in `docs/DECISIONS.md` saying why.
- Install Expo-related packages with `npx expo install <pkg>` so the versions match the SDK.

## 4. Definition of done (nothing is done until it is tested)

A step is done only when all of these pass:

1. `npm run check`, which runs typecheck, lint and unit tests.
2. Its Maestro flow passes on the emulator: `npm run e2e` or `npm run e2e -- .maestro/<flow>.yaml`.
3. A screenshot of the changed screen has been taken (`scripts/shot.sh <name>`) and looked at.

Every new piece of non-trivial logic (a branch, a loop, a parser, anything touching files, git or keys) gets at least one small test.
Never leave the repo on a red commit.

## 5. Workflow per step

1. Read the matching NimoteCode reference docs. The phase → file map is in `docs/reference/nimotecode-notes.md`.
2. Pick the smallest complete solution: does it need to exist? → already in the repo? → built-in or Expo? → installed dependency? → one line? → otherwise the minimum code.
3. Before new screens or visual work, use the frontend-design skill. Before AI/agent code, use the claude-api skill.
4. Write the code and its test, then run the checks from section 4.
5. Run the code-simplifier agent on the changed files (fall back to the `simplify` skill), then re-run the checks.
6. Commit.
7. At the end of a phase:
   - Run `/ponytail-review` on the phase diff and fix the Must-fix items.
   - Run `/ponytail-debt` to refresh `docs/DEBT.md`.
   - After the Git and Agent phases, also run `security-review`.
   - Do a release APK test run.

If these tools' default styles disagree with this file, this file wins.

## 6. Working without a human (night sessions)

- Never stop to wait for an answer. If something is unclear, choose the simplest option that fits `docs/UI.md`.
  Write it in `docs/DECISIONS.md` and flag it in `docs/REVIEW.md`.
- If a step still fails after 3 different attempts:
  - Revert the uncommitted changes.
  - Write the blocker in `docs/PROGRESS.md` and `docs/REVIEW.md`.
  - Move to the next independent step.
- Before stopping, update `docs/PROGRESS.md` with what was done, what's next and known issues.
  Also update `docs/REVIEW.md` with what the owner should look at in the morning.

## 7. Reference material

`~/Projects/nimotecode` holds the public docs of NimoteCode, a commercial mobile IDE we learn from.
It is **read-only**: never edit it or change its git state. Re-read the relevant files at the start of each phase.
