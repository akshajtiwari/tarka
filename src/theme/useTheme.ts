import { useColorScheme } from 'react-native';

import { useSettings } from '../features/settings/settingsStore';
import { dark, light, type Colors } from './colors';

// The chosen theme from Settings, or the phone's own dark/light setting when it is "system".
export function useTheme(): Colors {
  const scheme = useColorScheme();
  const choice = useSettings((s) => s.theme);
  const mode = choice === 'system' ? scheme : choice;
  return mode === 'light' ? light : dark;
}
