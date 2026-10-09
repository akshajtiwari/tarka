import { useEffect, useState } from 'react';

import { useSettings } from './settingsStore';

// Settings are loaded from storage after the first render. Until then, "not onboarded" only
// means "not loaded yet", so the home screen waits instead of sending everyone to setup.
export function useSettingsReady() {
  const [ready, setReady] = useState(() => useSettings.persist.hasHydrated());
  useEffect(() => useSettings.persist.onFinishHydration(() => setReady(true)), []);
  return ready;
}
