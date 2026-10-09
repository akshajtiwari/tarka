import { safeParts } from '../lib/projectFs';

jest.mock('expo-file-system', () => ({}));

test('normal paths are split into parts', () => {
  expect(safeParts('src/app/main.js')).toEqual(['src', 'app', 'main.js']);
  expect(safeParts('')).toEqual([]);
});

test('paths that try to leave the project are refused', () => {
  expect(() => safeParts('../other/main.js')).toThrow('Not a path inside the project');
  expect(() => safeParts('src/../../x')).toThrow();
  expect(() => safeParts('./a')).toThrow();
});
