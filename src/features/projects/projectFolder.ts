import { Directory, File, Paths } from 'expo-file-system';

import { TarkaAndroid } from '../../../modules/tarka-android';
import { useSettings } from '../settings/settingsStore';
import { useProjectStore } from './projectStore';

// Projects live in Documents/TARKA/<id>/ (visible in file managers and Termux; needs Android's
// "All files access") or inside the app at <app documents>/projects/<id>/ (private).
// Ids are made by makeProjectId (only a-z, 0-9 and "-"); anything else is refused.

const insideApp = () => new Directory(Paths.document, 'projects');

// Documents/TARKA, or null when Android doesn't let TARKA write there (yet).
export function documentsRoot(): Directory | null {
  if (!TarkaAndroid?.hasAllFilesAccess()) return null;
  return new Directory(`file://${TarkaAndroid.documentsPath()}`, 'TARKA');
}

// The folder a new project with this id goes into, following the setting in Settings.
export function newProjectDir(id: string): Directory {
  checkId(id);
  const documents = useSettings.getState().projectsLocation === 'documents' && documentsRoot();
  return new Directory(documents || insideApp(), id);
}

export function projectDir(id: string): Directory {
  checkId(id);
  const root = useProjectStore.getState().projects.find((p) => p.id === id)?.root;
  return root ? new Directory(root) : new Directory(insideApp(), id);
}

// A folder as a plain path, e.g. "/storage/emulated/0/Documents/TARKA/demo" (git uses these).
export function folderPath(dir: Directory): string {
  const path = dir.uri.replace(/^file:\/\//, '').replace(/\/$/, '');
  return path.split('/').map(decodeURIComponent).join('/');
}

// Folder names already on disk, including leftovers from a project that failed to create.
export function existingProjectFolders(): string[] {
  return [insideApp(), documentsRoot()].flatMap((root) =>
    root?.exists ? root.list().map((item) => item.name) : [],
  );
}

export function createProjectFolder(dir: Directory, files: Record<string, string>) {
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

function checkId(id: string) {
  if (!/^[a-z0-9-]+$/.test(id)) throw new Error(`Not a project id: ${id}`);
}
