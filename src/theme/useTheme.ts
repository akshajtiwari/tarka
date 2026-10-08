import { useColorScheme } from 'react-native';

import { dark, light, type Colors } from './colors';

// shortcut: follows the phone's dark/light setting only, add a manual override when Settings has a theme switch.
export function useTheme(): Colors {
  const scheme = useColorScheme();
  return scheme === 'light' ? light : dark;
}
