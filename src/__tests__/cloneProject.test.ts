import { nameFromUrl } from '../features/projects/cloneProject';

jest.mock('expo-secure-store', () => ({}));
jest.mock('expo-file-system', () => ({}));

test('takes the project name from the repository url', () => {
  expect(nameFromUrl('https://github.com/user/my-app.git')).toBe('my-app');
  expect(nameFromUrl('https://gitlab.com/group/tool/')).toBe('tool');
  expect(nameFromUrl('  ')).toBe('');
});
