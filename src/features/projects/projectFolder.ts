import { Directory, File, Paths } from 'expo-file-system';

// Every project lives in its own folder: <app documents>/projects/<id>/
export function projectDir(id: string): Directory {
  return new Directory(Paths.document, 'projects', id);
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
