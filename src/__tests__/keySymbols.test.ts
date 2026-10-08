import { symbolsFor } from '../features/editor/keySymbols';

test('python files get the colon first', () => {
  expect(symbolsFor('src/main.py')[0]).toBe(':');
});

test('typescript files get the arrow', () => {
  expect(symbolsFor('App.tsx')).toContain('=>');
});

test('unknown files fall back to the javascript set', () => {
  expect(symbolsFor('Makefile')).toEqual(symbolsFor('a.js'));
});
