#!/usr/bin/env bash
# Runs the Maestro UI tests on the emulator.
# Usage: scripts/e2e.sh                 (all flows in .maestro/)
#        scripts/e2e.sh .maestro/x.yaml (one flow)
set -euo pipefail
cd "$(dirname "$0")/.."
source scripts/env.sh

# Restart the emulator if it has grown too big (its GPU renderer can leak memory over time).
rss_kb=$(ps -o rss= -C qemu-system-x86_64-headless | head -1 || true) # empty when no emulator
if [ "${rss_kb:-0}" -gt 4500000 ]; then
  echo "== emulator uses $((rss_kb / 1024)) MB, restarting it"
  adb emu kill > /dev/null 2>&1 || true
  sleep 8
fi
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
mkdir -p .artifacts/screens
flows=("$@")
if [ ${#flows[@]} -eq 0 ]; then flows=(.maestro/*.yaml); fi

# Run each flow on its own. On this laptop Maestro sometimes dies mid-step when memory
# is tight, so a failed flow gets one retry. A real bug fails twice and is reported.
failed=()
for flow in "${flows[@]}"; do
  name=$(basename "$flow" .yaml)
  if ! maestro --device "$ANDROID_SERIAL" test --test-output-dir "$run_dir/$name" "$flow"; then
    echo "== $name failed, retrying once"
    maestro --device "$ANDROID_SERIAL" test --test-output-dir "$run_dir/$name-retry" "$flow" || failed+=("$name")
  fi
done

# Collect the screenshots the flows took (takeScreenshot: <name>) in one place.
find "$run_dir" -path '*takeScreenshot*' -name '*.png' -exec cp {} .artifacts/screens/ \;

if [ ${#failed[@]} -gt 0 ]; then
  echo "== FAILED: ${failed[*]}"
  exit 1
fi
echo "== all flows passed"
