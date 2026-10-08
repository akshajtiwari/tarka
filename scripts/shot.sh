#!/usr/bin/env bash
# Saves a screenshot of the connected emulator or phone.
# Usage: scripts/shot.sh <name>   ->   .artifacts/screens/<name>.png
set -euo pipefail
cd "$(dirname "$0")/.."
source scripts/env.sh

name=${1:?usage: scripts/shot.sh <name>}
mkdir -p .artifacts/screens
adb exec-out screencap -p > ".artifacts/screens/$name.png"
echo ".artifacts/screens/$name.png"
