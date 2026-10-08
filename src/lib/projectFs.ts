import { Directory, File } from 'expo-file-system';

import { projectDir } from '../features/projects/projectFolder';

// Paths inside a project are relative, with "/" between parts: "src/main.js". "" is the project root.

export type Entry = { name: string; isDir: boolean };

function dirAt(projectId: string, relPath: string): Directory {
  const parts = relPath.split('/').filter(Boolean);
  return new Directory(projectDir(projectId), ...parts);
}

// Folders first, then files, each sorted by name.
export function listEntries(projectId: string, relPath: string): Entry[] {
  const entries = dirAt(projectId, relPath)
    .list()
    .map((item) => ({ name: item.name, isDir: item instanceof Directory }));
  return entries.sort((a, b) => {
    if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

export function fileAt(projectId: string, relPath: string): File {
  return new File(projectDir(projectId), ...relPath.split('/').filter(Boolean));
}
