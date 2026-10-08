export type SearchMatch = { path: string; line: number; text: string };

type Options = { caseSensitive: boolean; limit?: number };

// Finds every line containing `query` across the given files.
// `read` returns a file's text, or null to skip it (too big, binary, unreadable).
export function searchText(
  paths: string[],
  read: (path: string) => string | null,
  query: string,
  { caseSensitive, limit = 200 }: Options,
): SearchMatch[] {
  if (!query) return [];
  const needle = caseSensitive ? query : query.toLowerCase();
  const matches: SearchMatch[] = [];

  for (const path of paths) {
    const text = read(path);
    if (text === null) continue;
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = caseSensitive ? lines[i] : lines[i].toLowerCase();
      if (!line.includes(needle)) continue;
      matches.push({ path, line: i + 1, text: lines[i].trim() });
      if (matches.length >= limit) return matches;
    }
  }
  return matches;
}
