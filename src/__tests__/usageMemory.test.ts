import { remember, topItems, type UsageMemory } from '../lib/usageMemory';

const now = 10 * 24 * 60 * 60 * 1000;
const day = 24 * 60 * 60 * 1000;

test('counts every use', () => {
  let memory: UsageMemory = {};
  memory = remember(memory, 'console', now);
  memory = remember(memory, 'console', now);
  expect(memory.console).toEqual({ count: 2, lastUsed: now });
});

test('most used items come first', () => {
  let memory: UsageMemory = {};
  memory = remember(memory, 'const', now);
  memory = remember(memory, 'console', now);
  memory = remember(memory, 'console', now);
  expect(topItems(memory, 5, now)).toEqual(['console', 'const']);
});

test('recent use beats old use with the same count', () => {
  const memory: UsageMemory = {
    'git status': { count: 3, lastUsed: now - 5 * day },
    'git stash': { count: 3, lastUsed: now },
  };
  expect(topItems(memory, 5, now)).toEqual(['git stash', 'git status']);
});
