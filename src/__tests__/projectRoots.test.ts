import { newProjectsRoot, projectDir } from '../features/projects/projectFolder';
import { useProjectStore } from '../features/projects/projectStore';
import { useSettings } from '../features/settings/settingsStore';

// A tiny Directory that only joins its parts into a URI.
jest.mock('expo-file-system', () => {
  class Directory {
    uri: string;
    constructor(...parts: (string | { uri: string })[]) {
      this.uri = parts.map((p) => (typeof p === 'string' ? p : p.uri)).join('/');
    }
  }
  return { Directory, File: Directory, Paths: { document: 'file:///app/files' } };
});
const mockAndroid = {
  hasAllFilesAccess: jest.fn(() => false),
  documentsPath: () => '/storage/emulated/0/Documents',
};
jest.mock('../../modules/tarka-android', () => ({
  get TarkaAndroid() {
    return mockAndroid;
  },
}));

const project = (id: string, root?: string) => ({ id, name: id, createdAt: 0, openedAt: 0, root });

test('projects from 0.1 (no root) stay inside the app; newer ones use their own folder', () => {
  useProjectStore.setState({
    projects: [project('old'), project('new', 'file:///storage/emulated/0/Documents/TARKA/new')],
  });
  expect(projectDir('old').uri).toBe('file:///app/files/projects/old');
  expect(projectDir('new').uri).toBe('file:///storage/emulated/0/Documents/TARKA/new');
});

test('new projects go to Documents/TARKA only once Android allows it', () => {
  useSettings.setState({ projectsLocation: 'documents' });
  expect(newProjectsRoot().uri).toBe('file:///app/files/projects');
  mockAndroid.hasAllFilesAccess.mockReturnValue(true);
  expect(newProjectsRoot().uri).toBe('file:///storage/emulated/0/Documents/TARKA');
  useSettings.setState({ projectsLocation: 'app' });
  expect(newProjectsRoot().uri).toBe('file:///app/files/projects');
});
