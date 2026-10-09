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
- **Real tools inside jest where it matters:**
  - Git runs real isomorphic-git against Node's `fs` and a local `git http-backend` server.
  - The terminal worker test runs the worker body with a fake Pyodide, and checks the Python it generates with
    the real `python3` (syntax), which caught an escaping bug in `workerSource.ts`.
  - The Termux sync scripts run in real `bash` with `HOME` set to a temp folder, and the files must come out
    byte-identical (UTF-8 and binary).
- Run jest with `--maxWorkers=2` while the emulator is up: a full parallel jest run next to the emulator got the
  emulator killed by the Linux out-of-memory killer (15 GB laptop).

## 2. `npm run e2e`: Maestro on the emulator

`scripts/e2e.sh` does everything:

1. Boots the headless emulator (`scripts/emulator.sh`).
2. Installs the dev app if it is missing.
3. Starts Metro if needed.
4. Runs every flow in `.maestro/`, or only the one you pass: `npm run e2e -- .maestro/launch.yaml`.

Each flow:

- starts with `launchApp: clearState: true`, then
- opens Metro with `openLink: exp+tarka://expo-development-client/?url=http%3A%2F%2F10.0.2.2%3A8081&disableOnboarding=1`. `10.0.2.2` is the laptop as seen from the emulator.
- `common/start-app.yaml` stops at the setup screen; `common/open-app.yaml` walks setup the quick way (Inside
  TARKA, wait for "Python is ready", "Set up later" on the optional steps) and lands on Projects.
- finds things by **visible text** or by **accessibilityLabel**. Give every icon button a label.
- ends with `takeScreenshot: .artifacts/screens/<flow-name>`.

Results go to `.artifacts/maestro/` and screenshots to `.artifacts/screens/`. Both folders are gitignored.

`e2e.sh` also:

- removes `/storage/emulated/0/Documents/TARKA` (clearState doesn't reach shared storage);
- turns on **JSPI** in the emulator's WebView (Chrome 133) with the flag file
  `/data/local/tmp/webview-command-line` (`_ --js-flags=--experimental-wasm-jspi --enable-features=WebAssemblyJSPromiseIntegration`).
  Phones with Chrome 137+ have it on; the terminal needs it for live Python `input()`;
- gives a failed flow one retry (Maestro sometimes dies before the first step when memory is tight).

Flows outside the default run:

- `.maestro/perf/git-perf.yaml`: opens the explorer and the Git tab on a cloned real repo (expressjs/express)
  three times. Read the timings with `adb logcat -s ReactNativeJS`.
- `.maestro/termux/termux.yaml`: the `termux` command against the real Termux app. Run
  `scripts/termux-setup.sh` once first: it installs Termux v0.118.3 (x86_64, GitHub build), waits for its
  first-time setup, sets `allow-external-apps` and grants the RUN_COMMAND permission. The flow taps Allow on
  TARKA's permission request, because `clearState` resets that permission.
- `.maestro/release/smoke.yaml`: for release builds (no Metro).
- **Projects in Documents/TARKA:** grant "All files access" without the settings page:
  `adb shell appops set --uid com.akshajtiwari.tarka MANAGE_EXTERNAL_STORAGE allow`.

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
- **Claude and Gemini:** unit tests check the request shape (thinking blocks and Gemini thought signatures go back
  unchanged). A live run needs a key in `~/.config/tarka/anthropic-key.txt` or `gemini-key.txt`; never commit or print it.
