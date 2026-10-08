import { fuzzyFilter, fuzzyScore } from '../lib/fuzzy';

test('letters must appear in order', () => {
  expect(fuzzyScore('mnjs', 'src/main.js')).toBeGreaterThan(0);
  expect(fuzzyScore('jsm', 'src/main.js')).toBe(-1);
});

test('file name matches beat folder matches', () => {
  const files = ['main/other.py', 'src/main.py'];
  expect(fuzzyFilter('main', files)[0]).toBe('src/main.py');
});

test('empty query keeps everything in order', () => {
  expect(fuzzyFilter('', ['b', 'a'])).toEqual(['b', 'a']);
});

test('non-matching files are dropped', () => {
  expect(fuzzyFilter('xyz', ['main.js', 'app.py'])).toEqual([]);
});
