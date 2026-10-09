import { useSyncExternalStore } from 'react';

import { useSettings } from './settingsStore';

// Settings are loaded from storage after the first render. Until then, "not onboarded" only
// means "not loaded yet", so the home screen waits instead of sending everyone to setup.
// useSyncExternalStore checks again after subscribing, so loading that ends in between is seen.
export function useSettingsReady() {
  return useSyncExternalStore(
    (onChange) => useSettings.persist.onFinishHydration(onChange),
    () => useSettings.persist.hasHydrated(),
  );
}
