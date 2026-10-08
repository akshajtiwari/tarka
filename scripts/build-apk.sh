#!/usr/bin/env bash
# Rebuilds the dev app after a native change (a new Expo module or an app.json plugin)
# and installs it on the emulator. The emulator is stopped while Gradle runs:
# both together do not fit in this laptop's 15 GB of memory.
set -euo pipefail
cd "$(dirname "$0")/.."
source scripts/env.sh

adb emu kill > /dev/null 2>&1 || true
npx expo prebuild --platform android --no-install
(cd android && ./gradlew app:assembleDebug -x lint -x test --build-cache -PreactNativeArchitectures=x86_64)

# Free the ~4 GB the Gradle and Kotlin daemons keep after a build.
(cd android && ./gradlew --stop > /dev/null)
pkill -f "[K]otlinCompileDaemon" || true

scripts/emulator.sh
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
