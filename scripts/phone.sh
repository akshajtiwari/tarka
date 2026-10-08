#!/usr/bin/env bash
# Run the app on your own phone with hot reload.
# 1. Turn on Developer options -> USB debugging (or Wireless debugging and `adb pair`).
# 2. Plug the phone in and run: scripts/phone.sh
set -euo pipefail
cd "$(dirname "$0")/.."
source scripts/env.sh

serial=$(adb devices | awk 'NR > 1 && $2 == "device" && $1 !~ /^emulator-/ {print $1; exit}')
if [ -z "$serial" ]; then
  echo "No phone found. Check 'adb devices' and accept the USB debugging prompt on the phone."
  exit 1
fi
export ANDROID_SERIAL=$serial

if ! adb shell pm list packages | grep -q com.akshajtiwari.tarka; then
  # First time: build and install the dev app (this also starts Metro).
  npx expo run:android --device "$serial"
  exit 0
fi

adb reverse tcp:8081 tcp:8081
adb shell am start -a android.intent.action.VIEW \
  -d "exp+tarka://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081" > /dev/null
npx expo start --dev-client
