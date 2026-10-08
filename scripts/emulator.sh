#!/usr/bin/env bash
# Starts the 'tarka' emulator and waits until Android has finished booting.
# Runs without a window (for automated tests). Pass --show to see it.
set -euo pipefail
cd "$(dirname "$0")/.."
source scripts/env.sh

if adb devices | grep -q '^emulator-'; then
  echo "emulator already running"
  exit 0
fi

window_flag="-no-window"
if [ "${1:-}" = "--show" ]; then window_flag=""; fi

mkdir -p .artifacts
nohup emulator -avd tarka $window_flag -no-audio -no-boot-anim -gpu swiftshader_indirect \
  > .artifacts/emulator.log 2>&1 &

adb wait-for-device
until [ "$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ]; do sleep 2; done
echo "emulator ready"
