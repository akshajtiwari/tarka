// Remembers words and commands you use, so they can be suggested again later.
// Things you use often and recently come first. No AI involved, just counting.

export type Usage = { count: number; lastUsed: number };
export type UsageMemory = Record<string, Usage>;

const DAY = 24 * 60 * 60 * 1000;
const MAX_ITEMS = 500; // keep storage small

export function remember(memory: UsageMemory, item: string, now = Date.now()): UsageMemory {
  const old = memory[item];
  const next = { ...memory, [item]: { count: (old?.count ?? 0) + 1, lastUsed: now } };
  return trim(next);
}

// Items that start with `prefix`, best first. The prefix itself is never suggested.
export function suggest(memory: UsageMemory, prefix: string, limit = 5, now = Date.now()): string[] {
  return Object.entries(memory)
    .filter(([item]) => item.startsWith(prefix) && item !== prefix)
    .sort(([, a], [, b]) => score(b, now) - score(a, now))
    .slice(0, limit)
    .map(([item]) => item);
}

// Each use counts less as it gets older (halves after about a day).
function score(usage: Usage, now: number): number {
  const days = (now - usage.lastUsed) / DAY;
  return usage.count / (1 + days);
}

function trim(memory: UsageMemory): UsageMemory {
  const items = Object.entries(memory);
  if (items.length <= MAX_ITEMS) return memory;
  const now = Date.now();
  items.sort(([, a], [, b]) => score(b, now) - score(a, now));
  return Object.fromEntries(items.slice(0, MAX_ITEMS));
}
