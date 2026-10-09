#!/usr/bin/env bash
# Installs and prepares the official Termux app on the emulator, to test TARKA's `termux` command.
# Termux v0.118.3, GitHub build for x86_64, from github.com/termux/termux-app/releases.
set -euo pipefail
cd "$(dirname "$0")/.."
source scripts/env.sh
export ANDROID_SERIAL=$(adb devices | awk '/^emulator-/ {print $1; exit}')

url='https://github.com/termux/termux-app/releases/download/v0.118.3/termux-app_v0.118.3%2Bgithub-debug_x86_64.apk'
apk=.artifacts/termux/termux-x86_64.apk
if [ ! -f "$apk" ]; then
  mkdir -p .artifacts/termux
  curl -sSL -o "$apk" "$url"
fi
adb install -r "$apk" > /dev/null

# The first start unpacks Termux's Linux system (needs internet). Wait until bash is there.
adb shell am start -n com.termux/.app.TermuxActivity > /dev/null
for _ in $(seq 1 60); do
  if adb shell run-as com.termux test -x files/usr/bin/bash; then break; fi
  sleep 5
done

# Let other apps (TARKA) send commands, then restart Termux so it reads the setting.
adb shell run-as com.termux sh -c \
  'mkdir -p files/home/.termux && grep -q allow-external-apps files/home/.termux/termux.properties 2>/dev/null || echo allow-external-apps=true >> files/home/.termux/termux.properties'
adb shell am force-stop com.termux
adb shell pm grant com.akshajtiwari.tarka com.termux.permission.RUN_COMMAND
echo "Termux is ready"
