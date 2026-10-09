import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { GitSettings } from '../features/settings/GitSettings';
import { getGitToken, setGitToken } from '../lib/secure';

jest.mock('../lib/secure', () => ({ getGitToken: jest.fn(), setGitToken: jest.fn() }));

test('saving waits until the stored token has loaded', async () => {
  let answer: (token: string) => void = () => {};
  jest.mocked(getGitToken).mockReturnValue(new Promise((resolve) => (answer = resolve)));
  await render(<GitSettings onSaved={jest.fn()} />);

  // Still loading: a save now would store "" and so erase the saved token.
  await fireEvent.press(screen.getByText('Save git settings'));
  expect(setGitToken).not.toHaveBeenCalled();

  await act(async () => answer('ghp_saved'));
  await fireEvent.press(screen.getByText('Save git settings'));
  expect(setGitToken).toHaveBeenCalledWith('ghp_saved');
});
