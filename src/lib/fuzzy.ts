// Fuzzy matching for quick-open: "mnjs" matches "src/main.js".
// The letters of the query must appear in order. Matches score higher when letters are
// next to each other, start a word (after / . - _), or fall in the file name.

export function fuzzyScore(query: string, text: string): number {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  const nameStart = t.lastIndexOf('/') + 1;
  let score = 0;
  let searchFrom = 0;
  let previous = -2; // so the first letter never counts as "next to" another

  for (const ch of q) {
    const found = t.indexOf(ch, searchFrom);
    if (found === -1) return -1; // a letter is missing: no match
    score += 1;
    if (found === previous + 1) score += 3; // letters next to each other
    if (found === 0 || '/.-_'.includes(t[found - 1])) score += 2; // start of a word
    if (found >= nameStart) score += 1; // inside the file name, not the folder
    previous = found;
    searchFrom = found + 1;
  }
  return score - text.length / 100; // prefer shorter paths when scores tie
}

// Best matches first. An empty query keeps the original order.
export function fuzzyFilter(query: string, items: string[], limit = 50): string[] {
  if (!query) return items.slice(0, limit);
  return items
    .map((item) => ({ item, score: fuzzyScore(query, item) }))
    .filter((m) => m.score >= 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((m) => m.item);
}
