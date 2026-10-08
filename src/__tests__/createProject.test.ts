import { createProject } from '../features/projects/createProject';
import { createProjectFolder, existingProjectFolders } from '../features/projects/projectFolder';
import { useProjectStore } from '../features/projects/projectStore';

jest.mock('../features/projects/projectFolder', () => ({
  createProjectFolder: jest.fn(),
  existingProjectFolders: jest.fn(() => []),
}));

beforeEach(() => useProjectStore.setState({ projects: [] }));

test('writes the template files and lists the new project', () => {
  const id = createProject('Hello Py', 'python');

  expect(id).toBe('hello-py');
  expect(createProjectFolder).toHaveBeenCalledWith(
    'hello-py',
    expect.objectContaining({ 'main.py': expect.any(String) }),
  );
  expect(useProjectStore.getState().projects[0]).toMatchObject({
    id: 'hello-py',
    name: 'Hello Py',
  });
});

test('gives a second project with the same name its own folder', () => {
  createProject('demo', 'js');
  expect(createProject('demo', 'js')).toBe('demo-2');
});

test('a leftover folder on disk counts as taken', () => {
  jest.mocked(existingProjectFolders).mockReturnValueOnce(['demo']);
  expect(createProject('demo', 'js')).toBe('demo-2');
});
