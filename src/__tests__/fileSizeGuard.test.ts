import { openModeFor } from '../features/editor/fileSizeGuard';

const MB = 1024 * 1024;

test('small files can be edited, big ones are read-only, huge ones are refused', () => {
  expect(openModeFor(10_000)).toBe('edit');
  expect(openModeFor(3 * MB)).toBe('read');
  expect(openModeFor(20 * MB)).toBe('refuse');
});
