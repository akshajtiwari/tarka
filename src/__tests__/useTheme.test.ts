import { renderHook } from '@testing-library/react-native';
import * as ReactNative from 'react-native';

import { dark, light } from '../theme/colors';
import { useTheme } from '../theme/useTheme';

test('uses the light palette when the phone is in light mode', async () => {
  jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue('light');
  const { result } = await renderHook(() => useTheme());
  expect(result.current).toBe(light);
});

test('uses the dark palette otherwise', async () => {
  jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue('dark');
  const { result } = await renderHook(() => useTheme());
  expect(result.current).toBe(dark);
});
