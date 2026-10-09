import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { TarkaAndroid } from '../../../modules/tarka-android';

// Whether Android lets TARKA use Documents/TARKA ("All files access"). Checked again when you
// come back from Android's settings page.
export function useFilesAccess() {
  const [granted, setGranted] = useState(() => !!TarkaAndroid?.hasAllFilesAccess());

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') setGranted(!!TarkaAndroid?.hasAllFilesAccess());
    });
    return () => sub.remove();
  }, []);

  return { granted, openSettings: () => TarkaAndroid?.openAllFilesAccess() };
}
