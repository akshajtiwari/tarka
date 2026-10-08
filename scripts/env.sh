# Paths for the Android toolchain. Every script sources this file,
# so nothing needs to be added to your shell profile.
export JAVA_HOME="$HOME/.local/jdk-17"
export ANDROID_HOME="$HOME/Android/Sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$HOME/.maestro/bin:$PATH"
# Java tries IPv6 first and does not fall back to IPv4 like curl does; on some networks
# (VPNs, WARP) that makes Gradle downloads fail with "Network is unreachable".
export JAVA_TOOL_OPTIONS="-Djava.net.preferIPv4Stack=true"
