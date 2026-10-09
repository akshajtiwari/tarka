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

// Never use a proxy from .git/config: the project may sit in shared storage, where another app
// could add one, and isomorphic-git would then send the token to it (it checks the real URL).
// '' (not undefined) stops isomorphic-git from reading the setting.
const NO_PROXY = '';

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
export async function clone(
  fs: Fs,
  dir: string,
  url: string,
  token?: string | null,
  onProgress?: git.ProgressCallback,
) {
  // "https://TOKEN@github.com/…" would skip the host check above, and the URL is saved in
  // .git/config, which other apps can read when the project is in shared storage.
  if (/^\w+:\/\/[^/]*@/.test(url)) {
    throw new Error('Put the token in Settings → Git, not in the URL.');
  }
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
      corsProxy: NO_PROXY,
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
      corsProxy: NO_PROXY,
      cache: cacheFor(dir),
    }),
  );
}

export function push(fs: Fs, dir: string, token?: string | null) {
  return dropCacheIfFails(dir, () =>
    git.push({ fs, http, dir, onAuth: auth(token), corsProxy: NO_PROXY, cache: cacheFor(dir) }),
  );
}
