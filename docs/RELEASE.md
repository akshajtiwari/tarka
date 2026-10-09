# Releasing

How to build, test and publish a TARKA APK.

## The signing key

- The keystore lives **outside the repo**: `~/.config/tarka/tarka-release.jks` (alias `tarka`, RSA 4096,
  valid for 10,000 days).
- Its password is in `~/.config/tarka/keystore-password.txt`. Both files are `chmod 600`.
- **Back both files up somewhere safe.** Android only installs an update over an existing install when it is
  signed with the same key. A lost key means users must uninstall (and lose their projects) to update.
- On another machine, copy the two files there, or point the build at them with `TARKA_KEYSTORE` and
  `TARKA_KEYSTORE_PASS`.

## Steps

1. Bump `expo.version` (and `expo.android.versionCode` by one) in `app.json`, and commit.
2. `scripts/build-release.sh`:
   - stops the emulator (Gradle and the emulator don't both fit in 15 GB),
   - runs `expo prebuild` and `gradlew assembleRelease` for `arm64-v8a` (phones) and `x86_64` (the emulator),
   - signs the APK with the release key into `.artifacts/release/tarka-v<version>.apk`.
3. Test it on the emulator. The dev build has a different signature, so remove it first:
   ```sh
   scripts/emulator.sh
   adb uninstall com.akshajtiwari.tarka
   adb install .artifacts/release/tarka-v<version>.apk
   maestro test .maestro/release/smoke.yaml
   ```
   The smoke flow starts the app without Metro, runs JavaScript and Python, and checks that code you run
   can't read the app's files over `file://` (release pages load from `file://`).
4. Put the dev build back for `npm run e2e`: `adb uninstall com.akshajtiwari.tarka`, then
   `adb install .artifacts/dev-build.apk` (or let `scripts/e2e.sh` rebuild it).
5. Publish on `main`:
   ```sh
   gh release create v<version> .artifacts/release/tarka-v<version>.apk \
     --title "TARKA <version>" --notes-file <notes.md>
   ```
   The tag is made on the current `main` commit.

## Installing on a phone

Download the APK from the GitHub release on the phone, open it, and allow "Install unknown apps" for the
browser or file manager when Android asks.
