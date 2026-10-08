import { sortByRecent, useProjectStore, type Project } from '../features/projects/projectStore';

const demo: Project = { id: 'demo', name: 'Demo', createdAt: 1, openedAt: 1 };

beforeEach(() => useProjectStore.setState({ projects: [] }));

test('adds, renames and removes a project', () => {
  const store = useProjectStore.getState();
  store.addProject(demo);
  store.renameProject('demo', 'Renamed');
  expect(useProjectStore.getState().projects).toEqual([{ ...demo, name: 'Renamed' }]);

  store.removeProject('demo');
  expect(useProjectStore.getState().projects).toEqual([]);
});

test('sorts the most recently opened project first', () => {
  const old = { ...demo, id: 'old', openedAt: 1 };
  const recent = { ...demo, id: 'recent', openedAt: 5 };
  expect(sortByRecent([old, recent]).map((p) => p.id)).toEqual(['recent', 'old']);
});
