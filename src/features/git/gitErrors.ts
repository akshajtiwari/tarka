// Turns a git failure into words that say what to do next.
// isomorphic-git's own messages ("HTTP Error: 401 Unauthorized", 'Use "force: true"') don't.

type GitFailure = { code?: string; message?: string; data?: { statusCode?: number } };

export function gitErrorText(e: unknown): string {
  const err = (e ?? {}) as GitFailure;
  const message = err.message ?? String(e);
  const status = err.code === 'HttpError' ? err.data?.statusCode : undefined;

  if (status === 401 || status === 403) {
    return 'The server refused access. Add or renew the token in Settings → Git (it needs access to this repository).';
  }
  if (status === 404) {
    return 'Repository not found. Check the URL. A private repository also needs a token in Settings → Git.';
  }
  if (err.code === 'PushRejectedError') {
    return 'The remote has commits you don’t have yet. Pull first, then push again.';
  }
  if (/network request failed|failed to fetch|timed? ?out/i.test(message)) {
    return 'Could not reach the server. Check your internet connection and try again.';
  }
  return message;
}
