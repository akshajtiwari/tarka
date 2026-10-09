// Remembers answers (including errors) for a short time. `clear()` forgets everything at once.
export function createShortMemo(lifeMs: number, now = Date.now) {
  const saved = new Map<string, { at: number; value: unknown; failed: boolean }>();

  function read<T>(key: string, compute: () => T): T {
    const hit = saved.get(key);
    if (hit && now() - hit.at < lifeMs) {
      if (hit.failed) throw hit.value;
      return hit.value as T;
    }
    try {
      const value = compute();
      saved.set(key, { at: now(), value, failed: false });
      return value;
    } catch (error) {
      saved.set(key, { at: now(), value: error, failed: true });
      throw error;
    }
  }

  return { read, clear: () => saved.clear() };
}
