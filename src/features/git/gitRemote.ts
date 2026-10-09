import * as git from 'isomorphic-git';
import http from 'isomorphic-git/http/web';

import { cacheFor, dropCacheIfFails, dropGitCache } from './gitCache';
import type { Author, Fs } from './gitService';

// Remote work (clone, pull, push). The token is sent as the password, which works for GitHub,
// GitLab and Bitbucket personal access tokens. It is only ever sent over HTTPS to those hosts,
// so a mistyped or unknown URL never receives it. No token = public repos only.
const TOKEN_HOSTS = ['github.com', 'gitlab.com', 'bitbucket.org'];

export function canSendToken(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url);
    return protocol === 'https:' && TOKEN_HOSTS.includes(hostname);
  } catch {
    return false;
  }
}

function auth(token?: string | null) {
  if (!token) return undefined;
  return (url: string) =>
    canSendToken(url) ? { username: 'x-access-token', password: token } : { cancel: true };
}

// shortcut: there is no screen to add a remote, so only cloned projects can push and pull; add one when needed.
export async function assertHasRemote(fs: Fs, dir: string) {
  if ((await git.listRemotes({ fs, dir })).length === 0) {
    throw new Error('This project has no remote. Only cloned projects can push and pull for now.');
  }
}

// Shallow, single-branch clone: much faster on a phone, and enough to edit and push.
export function clone(
  fs: Fs,
  dir: string,
  url: string,
  token?: string | null,
  onProgress?: git.ProgressCallback,
) {
  dropGitCache(dir); // a new repo in this folder: nothing old may be reused
  return dropCacheIfFails(dir, () =>
    git.clone({
      fs,
      http,
      dir,
      url,
      singleBranch: true,
      depth: 1,
      onAuth: auth(token),
      onProgress,
      cache: cacheFor(dir),
    }),
  );
}

export function pull(fs: Fs, dir: string, author: Author, token?: string | null) {
  return dropCacheIfFails(dir, () =>
    git.pull({
      fs,
      http,
      dir,
      author,
      singleBranch: true,
      onAuth: auth(token),
      cache: cacheFor(dir),
    }),
  );
}

export function push(fs: Fs, dir: string, token?: string | null) {
  return dropCacheIfFails(dir, () =>
    git.push({ fs, http, dir, onAuth: auth(token), cache: cacheFor(dir) }),
  );
}
