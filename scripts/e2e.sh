#!/usr/bin/env bash
# Runs the Maestro UI tests on the emulator.
# Usage: scripts/e2e.sh                 (all flows in .maestro/)
#        scripts/e2e.sh .maestro/x.yaml (one flow)
set -euo pipefail
cd "$(dirname "$0")/.."
source scripts/env.sh

scripts/emulator.sh
export ANDROID_SERIAL=$(adb devices | awk '/^emulator-/ {print $1; exit}')

# The dev build must be installed once (and again after native changes).
if ! adb shell pm list packages | grep -q com.akshajtiwari.tarka; then
  npx expo run:android --no-bundler
  # The Gradle and Kotlin daemons keep ~4 GB after a build; free it for the emulator.
  (cd android && ./gradlew --stop > /dev/null)
  pkill -f "[K]otlinCompileDaemon" || true
fi

# The dev build loads JavaScript from Metro, so make sure Metro is running.
mkdir -p .artifacts
if ! curl -s localhost:8081/status | grep -q running; then
  nohup npx expo start --dev-client --port 8081 > .artifacts/metro.log 2>&1 &
  until curl -s localhost:8081/status | grep -q running; do sleep 2; done
fi

run_dir=".artifacts/maestro/$(date +%Y%m%d-%H%M%S)"
status=0
maestro --device "$ANDROID_SERIAL" test --test-output-dir "$run_dir" "${@:-.maestro}" || status=$?

# Collect the screenshots the flows took (takeScreenshot: <name>) in one place.
mkdir -p .artifacts/screens
find "$run_dir" -path '*takeScreenshot*' -name '*.png' -exec cp {} .artifacts/screens/ \;
exit $status
