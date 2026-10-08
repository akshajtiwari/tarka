#!/usr/bin/env bash
# One-time setup of everything needed to build and test the app on Android.
# Installs into your home folder only (no sudo). Safe to run again.
set -euo pipefail
cd "$(dirname "$0")"
source ./env.sh

# 1. JDK 17 (React Native 0.86 builds with JDK 17)
if [ ! -x "$JAVA_HOME/bin/javac" ]; then
  echo "== installing JDK 17"
  mkdir -p "$JAVA_HOME"
  curl -fsSL "https://api.adoptium.net/v3/binary/latest/17/ga/linux/x64/jdk/hotspot/normal/eclipse" \
    | tar -xz -C "$JAVA_HOME" --strip-components=1
fi

# 2. Android command line tools (the zip name changes, so read it from Google's index)
if [ ! -x "$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" ]; then
  echo "== installing android cmdline-tools"
  zip_name=$(curl -fsSL https://dl.google.com/android/repository/repository2-3.xml \
    | grep -oE 'commandlinetools-linux-[0-9]+_latest\.zip' | sort -V | tail -1)
  tmp=$(mktemp -d)
  curl -fsSL "https://dl.google.com/android/repository/$zip_name" -o "$tmp/tools.zip"
  unzip -q "$tmp/tools.zip" -d "$tmp"
  mkdir -p "$ANDROID_HOME/cmdline-tools"
  rm -rf "$ANDROID_HOME/cmdline-tools/latest"
  mv "$tmp/cmdline-tools" "$ANDROID_HOME/cmdline-tools/latest"
  rm -rf "$tmp"
fi

# 3. SDK packages (versions match react-native/gradle/libs.versions.toml)
echo "== installing sdk packages"
yes | sdkmanager --licenses > /dev/null || true
sdkmanager --install \
  "platform-tools" \
  "platforms;android-36" \
  "build-tools;36.0.0" \
  "ndk;27.1.12297006" \
  "cmake;3.22.1" \
  "emulator" \
  "system-images;android-36;google_apis;x86_64"

# 4. Emulator used for automated tests
if ! avdmanager list avd | grep -q "Name: tarka"; then
  echo "== creating emulator 'tarka'"
  echo no | avdmanager create avd -n tarka -k "system-images;android-36;google_apis;x86_64" -d pixel_7
fi

# 5. Maestro (UI test runner)
if [ ! -x "$HOME/.maestro/bin/maestro" ]; then
  echo "== installing maestro"
  curl -fsSL "https://get.maestro.mobile.dev" | bash
fi

echo "== done. java: $(java -version 2>&1 | head -1)"
