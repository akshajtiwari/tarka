import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { AiSettings } from '../features/settings/AiSettings';
import { getSecret, setSecret } from '../lib/secure';

jest.mock('../lib/secure', () => ({ getSecret: jest.fn(), setSecret: jest.fn() }));

test("saving waits until the provider's stored key has loaded", async () => {
  let answer: (key: string) => void = () => {};
  jest.mocked(getSecret).mockReturnValue(new Promise((resolve) => (answer = resolve)));
  const onSaved = jest.fn();
  await render(<AiSettings onSaved={onSaved} />);

  // Still loading: a save now would store "" and so erase the saved key.
  await fireEvent.press(screen.getByText('Save AI settings'));
  expect(setSecret).not.toHaveBeenCalled();

  await act(async () => answer('sk-saved'));
  await fireEvent.press(screen.getByText('Save AI settings'));
  expect(setSecret).toHaveBeenCalledWith('anthropic-key', 'sk-saved');
  expect(onSaved).toHaveBeenCalled();
});
