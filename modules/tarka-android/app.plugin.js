// Android settings TARKA's native module needs:
// - "All files access", for projects in Documents/TARKA;
// - permission to run commands in Termux, and seeing that Termux is installed (Android 11+).
const { withAndroidManifest, AndroidConfig } = require('expo/config-plugins');

module.exports = function withTarkaAndroid(config) {
  config = AndroidConfig.Permissions.withPermissions(config, [
    'android.permission.MANAGE_EXTERNAL_STORAGE',
    'com.termux.permission.RUN_COMMAND',
  ]);
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    manifest.queries = manifest.queries ?? [{}];
    const queries = manifest.queries[0];
    queries.package = queries.package ?? [];
    if (!queries.package.some((p) => p.$['android:name'] === 'com.termux')) {
      queries.package.push({ $: { 'android:name': 'com.termux' } });
    }
    return cfg;
  });
};
