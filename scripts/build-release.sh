#!/usr/bin/env bash
# Builds the signed release APK: phones (arm64-v8a) and the emulator (x86_64) in one file.
# The signing key lives outside the repo, see docs/RELEASE.md.
# Output: .artifacts/release/tarka-v<version>.apk
set -euo pipefail
cd "$(dirname "$0")/.."
source scripts/env.sh

keystore=${TARKA_KEYSTORE:-$HOME/.config/tarka/tarka-release.jks}
passfile=${TARKA_KEYSTORE_PASS:-$HOME/.config/tarka/keystore-password.txt}
version=$(node -p "require('./app.json').expo.version")
out=.artifacts/release/tarka-v$version.apk
apksigner=$ANDROID_HOME/build-tools/36.0.0/apksigner

# Gradle needs the memory the emulator would use.
adb emu kill > /dev/null 2>&1 || true
npx expo prebuild --platform android --no-install
(cd android && ./gradlew app:assembleRelease -x lint -x test --build-cache -PreactNativeArchitectures=arm64-v8a,x86_64)
(cd android && ./gradlew --stop > /dev/null)
pkill -f "[K]otlinCompileDaemon" || true

# The Expo template signs release builds with the debug key, so sign again with the real one.
mkdir -p .artifacts/release
"$apksigner" sign --ks "$keystore" --ks-pass "file:$passfile" --ks-key-alias tarka \
  --out "$out" android/app/build/outputs/apk/release/app-release.apk
"$apksigner" verify --print-certs "$out" | head -2
echo "== $out"
