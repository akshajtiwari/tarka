import { renderHook } from '@testing-library/react-native';
import * as ReactNative from 'react-native';

import { useSettings } from '../features/settings/settingsStore';
import { dark, light } from '../theme/colors';
import { useTheme } from '../theme/useTheme';

beforeEach(() => useSettings.setState({ theme: 'system' }));

test('follows the phone when the setting is "system"', async () => {
  jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue('light');
  const { result } = await renderHook(() => useTheme());
  expect(result.current).toBe(light);
});

test('uses the dark palette when the phone is dark', async () => {
  jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue('dark');
  const { result } = await renderHook(() => useTheme());
  expect(result.current).toBe(dark);
});

test('a manual choice wins over the phone', async () => {
  jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue('light');
  useSettings.setState({ theme: 'dark' });
  const { result } = await renderHook(() => useTheme());
  expect(result.current).toBe(dark);
});
