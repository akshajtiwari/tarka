import { Buffer } from 'buffer';
import { Directory, File, Paths } from 'expo-file-system';

import { createShortMemo } from './shortMemo';
import { maybeYield } from './yieldToUi';

// isomorphic-git expects Node's global Buffer, which React Native doesn't have.
const globals = globalThis as { Buffer?: typeof Buffer };
globals.Buffer ??= Buffer;

// isomorphic-git needs a Node-style `fs.promises` object. This maps it onto expo-file-system.
// Git paths are absolute inside the app's documents folder, e.g. "/projects/demo/.git/HEAD".

type Encoding = string | { encoding?: string } | undefined;

function uriFor(path: string): string {
  return Paths.join(Paths.document.uri, path);
}

// isomorphic-git checks `err.code` to tell "missing" apart from real failures.
function fsError(code: string, path: string) {
  return Object.assign(new Error(`${code}: ${path}`), { code });
}

function makeStat(isDir: boolean, size: number, mtimeMs: number) {
  return {
    type: isDir ? 'dir' : 'file',
    mode: isDir ? 0o40000 : 0o100644,
    size,
    ino: 0,
    mtimeMs,
    ctimeMs: mtimeMs,
    uid: 1,
    gid: 1,
    dev: 1,
    isFile: () => !isDir,
    isDirectory: () => isDir,
    isSymbolicLink: () => false,
  };
}

// isomorphic-git asks about the same .git paths hundreds of times in one status check (it
// re-checks .git/index once per file). Answers about .git are remembered for a moment; any
// write through this adapter forgets them, and the short life covers changes made elsewhere.
const gitMemo = createShortMemo(1000);
function memoized<T>(key: string, path: string, read: () => T): T {
  const inGitFolder = path.includes('/.git/') || path.endsWith('/.git');
  return inGitFolder ? gitMemo.read(key, read) : read();
}

async function stat(path: string) {
  await maybeYield();
  return memoized(`stat ${path}`, path, () => {
    const info = Paths.info(uriFor(path));
    if (!info.exists) throw fsError('ENOENT', path);
    if (info.isDirectory) return makeStat(true, 0, 0);
    const file = new File(uriFor(path));
    return makeStat(false, file.size, file.modificationTime ?? 0);
  });
}

export const gitFs = {
  promises: {
    async readFile(path: string, options?: Encoding) {
      await maybeYield(); // let the UI breathe during long git work
      const file = new File(uriFor(path));
      // Most .git reads are misses: git looks for a loose object before checking the pack.
      if (!memoized(`exists ${path}`, path, () => file.exists)) throw fsError('ENOENT', path);
      const encoding = typeof options === 'string' ? options : options?.encoding;
      if (encoding === 'utf8') return file.textSync();
      return Buffer.from(file.bytesSync());
    },
    async writeFile(path: string, data: string | Uint8Array) {
      await maybeYield();
      gitMemo.clear();
      const file = new File(uriFor(path));
      if (!file.exists) file.create({ intermediates: true });
      file.write(data);
    },
    async unlink(path: string) {
      await maybeYield();
      gitMemo.clear();
      const file = new File(uriFor(path));
      if (!file.exists) throw fsError('ENOENT', path);
      file.delete();
    },
    async readdir(path: string) {
      await maybeYield();
      return memoized(`readdir ${path}`, path, () => {
        const info = Paths.info(uriFor(path));
        if (!info.exists) throw fsError('ENOENT', path);
        if (!info.isDirectory) throw fsError('ENOTDIR', path);
        return new Directory(uriFor(path)).list().map((item) => item.name);
      });
    },
    async mkdir(path: string) {
      await maybeYield();
      gitMemo.clear();
      if (Paths.info(uriFor(path)).exists) throw fsError('EEXIST', path);
      new Directory(uriFor(path)).create({ intermediates: true });
    },
    async rmdir(path: string) {
      await maybeYield();
      gitMemo.clear();
      const dir = new Directory(uriFor(path));
      if (!dir.exists) throw fsError('ENOENT', path);
      if (dir.list().length > 0) throw fsError('ENOTEMPTY', path);
      dir.delete();
    },
    stat,
    lstat: stat, // shortcut: no symlink support, expo-file-system has none; upgrade if repos with symlinks matter
    // isomorphic-git expects these two even though phone storage has no symlinks.
    async readlink(path: string): Promise<string> {
      throw fsError('ENOSYS', `symlinks are not supported: ${path}`);
    },
    async symlink(_target: string, path: string): Promise<void> {
      throw fsError('ENOSYS', `symlinks are not supported: ${path}`);
    },
  },
};
