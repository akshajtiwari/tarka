import { Directory } from 'expo-file-system';

import { folderPath } from '../features/projects/projectFolder';

jest.mock('expo-file-system', () => ({}));
jest.mock('../../modules/tarka-android', () => ({ TarkaAndroid: null }));

const dir = (uri: string) => ({ uri }) as Directory;

test('a project folder becomes the plain path git works with', () => {
  expect(folderPath(dir('file:///storage/emulated/0/Documents/TARKA/demo/'))).toBe(
    '/storage/emulated/0/Documents/TARKA/demo',
  );
  // Escaped characters in the URI come back as the real name.
  expect(folderPath(dir('file:///data/user/0/app/files/projects/my%20app%23v2'))).toBe(
    '/data/user/0/app/files/projects/my app#v2',
  );
});
