import { gitFs } from '../lib/gitFs';

jest.mock('expo-file-system', () => ({}));

// isomorphic-git calls .bind() on each of these, so a missing one breaks every git action.
test('the adapter has every method isomorphic-git expects', () => {
  const required = [
    'readFile',
    'writeFile',
    'mkdir',
    'rmdir',
    'unlink',
    'stat',
    'lstat',
    'readdir',
    'readlink',
    'symlink',
  ];
  for (const name of required) {
    expect(typeof gitFs.promises[name as keyof typeof gitFs.promises]).toBe('function');
  }
});
