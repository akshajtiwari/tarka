import { Directory, File } from 'expo-file-system';

import { projectDir } from '../features/projects/projectFolder';

// Paths inside a project are relative, with "/" between parts: "src/main.js". "" is the project root.

export type Entry = { name: string; isDir: boolean };

// Splits a project path into parts and refuses "." and ".." so no path can leave the project
// (a deep link like ?path=../.. must never reach other projects or app files).
export function safeParts(relPath: string): string[] {
  const parts = relPath.split('/').filter(Boolean);
  if (parts.some((part) => part === '.' || part === '..')) {
    throw new Error(`Not a path inside the project: ${relPath}`);
  }
  return parts;
}

export function dirAt(projectId: string, relPath: string): Directory {
  return new Directory(projectDir(projectId), ...safeParts(relPath));
}

// Folders first, then files, each sorted by name. The .git folder is hidden: it is git's
// own data, and deleting or editing it by hand would break the repository.
export function listEntries(projectId: string, relPath: string): Entry[] {
  const entries = dirAt(projectId, relPath)
    .list()
    .filter((item) => item.name !== '.git')
    .map((item) => ({ name: item.name, isDir: item instanceof Directory }));
  return entries.sort((a, b) => {
    if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

export function fileAt(projectId: string, relPath: string): File {
  return new File(projectDir(projectId), ...safeParts(relPath));
}

// Files we never try to read as text.
const BINARY = /\.(png|jpe?g|gif|webp|ico|pdf|zip|gz|jar|so|wasm|mp3|mp4|ttf|otf|woff2?)$/i;

// Text of a file for searching, or null if it is binary, too big (over 1 MB) or unreadable.
export function readForSearch(projectId: string, relPath: string): string | null {
  if (BINARY.test(relPath)) return null;
  try {
    const file = fileAt(projectId, relPath);
    if ((file.size ?? 0) > 1024 * 1024) return null;
    return file.textSync();
  } catch {
    return null;
  }
}
