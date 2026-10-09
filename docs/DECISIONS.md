# Decisions

Short records of why things are the way they are. Newest at the bottom. Each dependency gets one line here when it is added.

## Approach

- **Expo (React Native) over Flutter or native.** One TypeScript codebase for Android now and iOS later, the most common mobile stack for JS developers, and a fast reload loop on a real phone.
- **CodeMirror 6 for the editor.** It uses the phone's native text input, so selection handles, the IME and autocorrect behave like a normal text field. Monaco does not support phones. Writing our own editor (as NimoteCode did) would take months.
- **CM6 inside an Expo DOM component (`'use dom'`).** Expo bundles the web code itself and Fast Refresh works. No separate build step.
- **isomorphic-git for Git.** The well-known pure-JS git implementation. There is no maintained native git library for React Native.
- **Code runs on the device for v1 (JS, TS, HTML, Python).** Compiled languages are researched in COMPILERS.md.
- **Expo SDK 57.** The latest stable when the project started (2026-10-08). SDK 58 was still beta. Must stay on `expo >= 57.0.17`, which fixed a Hermes memory bug with Reanimated.
- **Bottom sheets use expo-router `formSheet` screens, not `@gorhom/bottom-sheet`.** That library needs a patch to work with Reanimated 4.

## Dependencies

| Package | Why |
|---|---|
| expo, react, react-native, expo-status-bar | from the Expo template |
| expo-router, expo-linking, expo-constants, react-native-screens, react-native-safe-area-context | file-based navigation (screens in `app/`) |
| react-native-reanimated, react-native-worklets, react-native-gesture-handler | drawer swipe, cursor trackpad, smooth sheets (standard Expo animation stack) |
| react-dom (pinned to the same version as react) | needed by DOM components; pinned because npm otherwise picks a newer react-dom that conflicts |
| eslint, eslint-config-expo | linting with Expo's recommended rules |
| jest, jest-expo, @types/jest, @testing-library/react-native | unit and component tests (Expo's standard test setup) |
| prettier | consistent formatting (`npm run format`) |
| expo-dev-client | our own dev build of the app (needed for native modules and Maestro tests) |
| expo-font, expo-asset, @expo-google-fonts/atkinson-hyperlegible-next, @expo-google-fonts/jetbrains-mono | the two app fonts (UI and code), see UI.md |
| @expo/vector-icons (Octicons set only) | icons; Octicons is GitHub's set and has every code/git icon we need |
| zustand, @react-native-async-storage/async-storage | small app state stores, saved between launches with zustand `persist` |
| expo-file-system | reading and writing project files (new `File` / `Directory` API) |
| react-native-drawer-layout | the swipe-in file explorer drawer (made by the React Navigation team) |
| codemirror, @codemirror/* (state, view, commands, language, autocomplete, search, lang-*), @lezer/highlight | the code editor (runs in a WebView via a DOM component) |
| react-native-web, @expo/metro-runtime | required by Expo DOM components (`'use dom'` files) |
| react-native-keyboard-controller | keyboard state + keyboard-aware layout so the key row sits right above the keyboard |
| expo-haptics | light ticks for the key-row trackpad |
| isomorphic-git, buffer | Git in pure JavaScript (no native code); buffer is the Node Buffer it expects |
| expo-secure-store | keeps the git access token in the Android Keystore, not in plain storage |
| diff (jsdiff) | line-by-line diffs for the Git diff view |
| sucrase | strips TypeScript types so .ts files can run in the on-device runner (small and fast) |
| ~~@anthropic-ai/sdk, openai~~ | removed: see "Agent decisions" |

## Phase 7 decisions
- **Read lock closes the keyboard from inside the WebView** (focus + blur a throwaway `inputmode="none"` input).
  Native dismiss calls only know React Native text inputs. Found by inspecting the WebView over Chrome DevTools.
- **The tablet rail uses React Navigation's `tabBarPosition: 'left'`** with the same `Dock` component, so no second tab bar.
- **Tips live in the settings store** (`tipsDone`), so clearing app data shows them again. No separate onboarding screens.

## Agent decisions
- **The agent loop is ours (`src/features/agent/loop.ts`), not the SDK's tool runner.** We need an approval gate before writes, loop detection and a step budget, and the same loop must also drive OpenAI-compatible servers.
- **No AI SDKs: both providers use plain `fetch`** (`src/features/agent/providers/http.ts`).
  - The official Anthropic SDK crashed the whole app at startup under React Native's bundler, with "Cannot read property 'BetaToolRunner' of undefined" (a circular import in its build). The OpenAI SDK was untested on the device.
  - Two direct HTTP calls of about 30 lines each are simpler to read and have no such risk.
  - Revisit if the SDK gains React Native support.
- **Replies are not streamed yet** (marked `shortcut:`). The answer appears when a turn finishes, and the tool rows show progress meanwhile.
- **Tool inputs are buffered, not streamed** (no `eager_input_streaming`), so the API checks the JSON for us. Phone-sized files make the latency fine. Inputs are still checked (`requireString`) because they come from the model.
- **Default model `claude-opus-5-5`** with adaptive thinking, `effort: 'high'`, and `fallbacks: 'default'` (server-side retry on a safety decline).
- **UI tests use a fake OpenAI-compatible server** (`scripts/fake-ai.cjs`) with a fixed script. The local `qwen2.5-coder:3b` returned tool calls as plain text, so it cannot test tools reliably.
