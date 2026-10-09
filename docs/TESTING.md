# Testing

Nothing is "done" until it passes the gates below (see the definition of done in [HANDOFF.md](HANDOFF.md#definition-of-done)). Everything runs without a human.

## 1. `npm run check`: fast, run it all the time

1. `tsc --noEmit`: types
2. `expo lint`: ESLint with Expo's rules (including the React Compiler rules)
3. `jest` with the `jest-expo` preset: unit and component tests in `src/__tests__/`

What gets unit tests:

- **Pure logic, always:** project ids, the tree builder, usage memory ranking, time formatting, store actions.
- **Components with behavior** use React Native Testing Library. `render` and `fireEvent` are **async** in v14, so always `await` them.
- **Code that touches native modules** is tested by mocking the boundary.
  Example: `createProject` mocks `projectFolder`. The real file writes are covered by the E2E flows.
- Native module mocks live in `jest.setup.js` (AsyncStorage so far).

## 2. `npm run e2e`: Maestro on the emulator

`scripts/e2e.sh` does everything:

1. Boots the headless emulator (`scripts/emulator.sh`).
2. Installs the dev app if it is missing.
3. Starts Metro if needed.
4. Runs every flow in `.maestro/`, or only the one you pass: `npm run e2e -- .maestro/launch.yaml`.

Each flow:

- starts with `launchApp: clearState: true`, then
- opens Metro with `openLink: exp+tarka://expo-development-client/?url=http%3A%2F%2F10.0.2.2%3A8081&disableOnboarding=1`. `10.0.2.2` is the laptop as seen from the emulator.
- finds things by **visible text** or by **accessibilityLabel**. Give every icon button a label.
- ends with `takeScreenshot: .artifacts/screens/<flow-name>`.

Results go to `.artifacts/maestro/` and screenshots to `.artifacts/screens/`. Both folders are gitignored.

**Looking inside a WebView** (the editor, the runner): dev builds allow Chrome DevTools.
`adb shell cat /proc/net/unix | grep webview_devtools_remote` gives the socket, then
`adb forward tcp:9222 localabstract:<socket>` and `curl localhost:9222/json` lists the pages.
Evaluate JavaScript in a page over its `webSocketDebuggerUrl` (`Runtime.evaluate`) to read the editor's real state,
or send keys with `Input.dispatchKeyEvent` (that is how Ctrl+S was checked: the file is on disk before autosave runs).
`adb shell dumpsys input_method | grep mInputShown` tells whether the keyboard is really up.

**Tablet layout:** `adb shell wm size 1600x2560 && adb shell wm density 320` (800 dp wide), then
`adb shell wm size reset && adb shell wm density reset` afterwards.

## 3. Look at the screenshots

After a UI change, open the PNGs in `.artifacts/screens/` and check them against `docs/UI.md`:
spacing, colors, nothing cut off, nothing hidden by the keyboard.
An AI agent can read the PNG files directly.

## 4. End of a phase

- Build a release APK (`npx expo run:android --variant release`) and run the flows against it.
  Release mode catches problems that only show up without Metro.
- Run `/ponytail-review` on the phase diff and `/ponytail-debt` to refresh `docs/DEBT.md`.
- On the morning after a night session, the owner tries the feel items in `docs/REVIEW.md` on a real phone.

## Agent tests (from phase 6)

- **Default:** a fake provider that returns scripted replies. Deterministic and free.
- **Live smoke test:** local Ollama (`qwen2.5-coder:3b`), reached from the emulator at `http://10.0.2.2:11434/v1`.
- **Claude API tests** only run when `ANTHROPIC_API_KEY` is set.
