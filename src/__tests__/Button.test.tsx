import { fireEvent, render, screen } from '@testing-library/react-native';

import { Button } from '../components/Button';

test('calls onPress when tapped', async () => {
  const onPress = jest.fn();
  await render(<Button label="Save" onPress={onPress} />);
  await fireEvent.press(screen.getByText('Save'));
  expect(onPress).toHaveBeenCalledTimes(1);
});

test('does nothing when disabled', async () => {
  const onPress = jest.fn();
  await render(<Button label="Save" onPress={onPress} disabled />);
  await fireEvent.press(screen.getByText('Save'));
  expect(onPress).not.toHaveBeenCalled();
});
