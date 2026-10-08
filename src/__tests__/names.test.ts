import { copyName, joinPath, nameProblem, parentOf } from '../features/explorer/names';

test('parent folder and joining', () => {
  expect(parentOf('src/app/main.js')).toBe('src/app');
  expect(parentOf('main.js')).toBe('');
  expect(joinPath('', 'a.js')).toBe('a.js');
  expect(joinPath('src', 'a.js')).toBe('src/a.js');
});

test('rejects names that are not a single plain name', () => {
  expect(nameProblem('  ')).toBe('Type a name.');
  expect(nameProblem('a/b')).toBe('A name cannot contain "/".');
  expect(nameProblem('..')).toBe('That name is reserved.');
  expect(nameProblem('ok.py')).toBeNull();
});

test('copy names do not clash', () => {
  expect(copyName('main.py', [])).toBe('main copy.py');
  expect(copyName('main.py', ['main copy.py'])).toBe('main copy 2.py');
  expect(copyName('Makefile', [])).toBe('Makefile copy');
  expect(copyName('.env', [])).toBe('.env copy');
});
