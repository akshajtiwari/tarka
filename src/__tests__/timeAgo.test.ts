import { timeAgo } from '../lib/timeAgo';

const now = 1_000_000_000;
const minute = 60_000;

test('describes how long ago something happened', () => {
  expect(timeAgo(now - 10_000, now)).toBe('just now');
  expect(timeAgo(now - minute, now)).toBe('1 minute ago');
  expect(timeAgo(now - 5 * minute, now)).toBe('5 minutes ago');
  expect(timeAgo(now - 3 * 60 * minute, now)).toBe('3 hours ago');
  expect(timeAgo(now - 2 * 24 * 60 * minute, now)).toBe('2 days ago');
});
