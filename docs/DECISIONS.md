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
