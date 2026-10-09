import { Directory, File, Paths } from 'expo-file-system';

// Every project lives in its own folder: <app documents>/projects/<id>/
// Ids are made by makeProjectId (only a-z, 0-9 and "-"); anything else is refused.
export function projectDir(id: string): Directory {
  if (!/^[a-z0-9-]+$/.test(id)) throw new Error(`Not a project id: ${id}`);
  return new Directory(Paths.document, 'projects', id);
}

// Folder names already on disk, including leftovers from a project that failed to create.
export function existingProjectFolders(): string[] {
  const root = new Directory(Paths.document, 'projects');
  return root.exists ? root.list().map((item) => item.name) : [];
}

export function createProjectFolder(id: string, files: Record<string, string>) {
  const dir = projectDir(id);
  dir.create({ intermediates: true });
  for (const [path, contents] of Object.entries(files)) {
    const file = new File(dir, path);
    file.create({ intermediates: true });
    file.write(contents);
  }
}

export function deleteProjectFolder(id: string) {
  const dir = projectDir(id);
  if (dir.exists) dir.delete();
}
