import { Errors } from 'isomorphic-git';

import { gitErrorText } from '../features/git/gitErrors';

test('git failures say what to do next', () => {
  expect(gitErrorText(new Errors.HttpError(401, 'Unauthorized', ''))).toMatch(/token in Settings/);
  expect(gitErrorText(new Errors.HttpError(403, 'Forbidden', ''))).toMatch(/token in Settings/);
  expect(gitErrorText(new Errors.HttpError(404, 'Not Found', ''))).toMatch(/Check the URL/);
  expect(gitErrorText(new Errors.PushRejectedError('not-fast-forward'))).toMatch(/Pull first/);
  expect(gitErrorText(new TypeError('Network request failed'))).toMatch(/internet connection/);
});

test('other failures keep their own message', () => {
  expect(gitErrorText(new Error('Commit or stash your changes first.'))).toBe(
    'Commit or stash your changes first.',
  );
  expect(gitErrorText('plain text')).toBe('plain text');
});
