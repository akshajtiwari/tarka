import { render, screen } from '@testing-library/react-native';

import HomeScreen from '../../app/index';

test('home screen shows the app name', async () => {
  await render(<HomeScreen />);
  expect(screen.getByText('TARKA')).toBeTruthy();
});
