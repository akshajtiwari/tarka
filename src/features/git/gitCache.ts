// isomorphic-git keeps parsed pack files and the index in a `cache` object. Without one, every
// call re-reads and re-checks (SHA-1 in plain JS) the whole pack: over a second per status on
// a small repo. One cache per repo folder, kept while the project is open.
//
// Keeping it across commits, pulls and checkouts is safe: the index is re-read when its file
// changes, and pack files never change (new objects arrive in new packs).

const caches = new Map<string, object>();

export function cacheFor(dir: string): object {
  let cache = caches.get(dir);
  if (!cache) {
    cache = {};
    caches.set(dir, cache);
  }
  return cache;
}

// Frees the memory (a cache holds whole pack files). No folder = forget every repo.
export function dropGitCache(dir?: string) {
  if (dir === undefined) caches.clear();
  else caches.delete(dir);
}
