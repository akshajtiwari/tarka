import { createShortMemo } from '../lib/shortMemo';

test('answers are reused for a short time, errors too, until cleared', () => {
  let clock = 0;
  const memo = createShortMemo(1000, () => clock);
  let calls = 0;
  const read = () => memo.read('a', () => ++calls);

  expect(read()).toBe(1);
  expect(read()).toBe(1); // remembered
  clock = 1500;
  expect(read()).toBe(2); // too old: asked again
  memo.clear();
  expect(read()).toBe(3); // forgotten

  const missing = () =>
    memo.read('b', () => {
      calls++;
      throw new Error('ENOENT');
    });
  expect(missing).toThrow('ENOENT');
  expect(missing).toThrow('ENOENT');
  expect(calls).toBe(4); // the failure was remembered, not retried
});
