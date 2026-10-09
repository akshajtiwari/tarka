#!/usr/bin/env bash
# Runs the Maestro UI tests on the emulator.
# Usage: scripts/e2e.sh                 (all flows in .maestro/)
#        scripts/e2e.sh .maestro/x.yaml (one flow)
set -euo pipefail
cd "$(dirname "$0")/.."
source scripts/env.sh

# Start the emulator, restarting it first if it has grown too big: its GPU renderer leaks memory,
# and past ~8 GB the out-of-memory killer ends it mid-flow. Checked before every flow.
fresh_emulator() {
  rss_kb=$(ps -o rss= -C qemu-system-x86_64-headless | head -1 || true) # empty when no emulator
  if [ "${rss_kb:-0}" -gt 4500000 ]; then
    echo "== emulator uses $((rss_kb / 1024)) MB, restarting it"
    adb shell sync > /dev/null 2>&1 || true # a hard kill loses writes not on disk yet
    adb emu kill > /dev/null 2>&1 || true
    sleep 8
  fi
  scripts/emulator.sh > /dev/null
  ANDROID_SERIAL=$(adb devices | awk '/^emulator-/ {print $1; exit}')
  export ANDROID_SERIAL
}
fresh_emulator

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

# The emulator's WebView (Chrome 133) has JSPI behind a flag; phones (Chrome 137+) have it on.
# The terminal needs it for live Python input().
adb shell "echo '_ --js-flags=--experimental-wasm-jspi --enable-features=WebAssemblyJSPromiseIntegration' > /data/local/tmp/webview-command-line" || true

# clearState doesn't reach shared storage: start every run without old Documents/TARKA projects.
adb shell rm -rf /storage/emulated/0/Documents/TARKA > /dev/null 2>&1 || true

# A throwaway git server for the clone/push flow: http://10.0.2.2:8090/demo.git from the emulator.
remote=.artifacts/git-remote
rm -rf "$remote" && mkdir -p "$remote"
git init -q -b main "$remote/seed"
echo hello > "$remote/seed/a.txt"
git -C "$remote/seed" add . && git -C "$remote/seed" -c user.name=t -c user.email=t@t commit -qm "first commit"
git clone -q --bare "$remote/seed" "$remote/demo.git" && git -C "$remote/demo.git" config http.receivepack true
node scripts/git-server.cjs "$PWD/$remote" 8090 > .artifacts/git-server.log 2>&1 &
server_pid=$!
# A fake AI server with a fixed script, for the agent flow (no key, no cost, same every time).
node scripts/fake-ai.cjs 8091 > .artifacts/fake-ai.log 2>&1 &
ai_pid=$!
trap 'kill $server_pid $ai_pid 2> /dev/null || true' EXIT

run_dir=".artifacts/maestro/$(date +%Y%m%d-%H%M%S)"
mkdir -p .artifacts/screens
flows=("$@")
if [ ${#flows[@]} -eq 0 ]; then flows=(.maestro/*.yaml); fi

# Run each flow on its own. On this laptop Maestro sometimes dies mid-step when memory
# is tight, so a failed flow gets one retry. A real bug fails twice and is reported.
failed=()
for flow in "${flows[@]}"; do
  name=$(basename "$flow" .yaml)
  fresh_emulator
  if ! maestro --device "$ANDROID_SERIAL" test --test-output-dir "$run_dir/$name" "$flow"; then
    echo "== $name failed, retrying once"
    fresh_emulator # in case the emulator itself went away
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
