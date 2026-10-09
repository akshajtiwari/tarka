import { useGitStatusStore } from '../features/git/gitStatusStore';

// A fake repo whose status reads finish only when the test says so.
const mockReads: { resolve: (v: unknown) => void }[] = [];
let mockModified = ['a.js'];
jest.mock('expo-file-system', () => ({}));
jest.mock('../features/git/repo', () => ({ repoDir: (id: string) => `/projects/${id}` }));
jest.mock('../features/git/gitService', () => ({
  isRepo: async () => true,
  currentBranch: async () => 'main',
  getChanges: () =>
    new Promise((resolve) => mockReads.push({ resolve })).then(() => ({
      staged: [],
      unstaged: mockModified.map((path) => ({ path, kind: 'modified' })),
    })),
}));

const flush = () => new Promise((r) => setTimeout(r, 0));
const store = () => useGitStatusStore.getState();

beforeEach(() => {
  mockReads.length = 0;
  mockModified = ['a.js'];
  useGitStatusStore.setState({ projectId: null, snap: null, stale: true, error: null });
  store().enterProject('demo');
});

test('a change during a read runs one more read, not one per ask', async () => {
  const done = store().refresh();
  store().markStale();
  store().refresh();
  store().markStale();
  store().refresh();
  await flush();
  mockReads[0].resolve(null);
  await flush();
  expect(mockReads).toHaveLength(2); // the first read + one more for the asks during it
  mockReads[1].resolve(null);
  await done;
  expect(store().snap?.kinds).toEqual({ 'a.js': 'modified' });
  expect(store().stale).toBe(false);
});

test('an unchanged result keeps the same objects, so rows do not redraw', async () => {
  let done = store().refresh();
  await flush();
  mockReads[0].resolve(null);
  await done;
  const first = store().snap;

  done = store().refresh();
  await flush();
  mockReads[1].resolve(null);
  await done;
  expect(store().snap).toBe(first);

  mockModified = ['a.js', 'b.js'];
  done = store().refresh();
  await flush();
  mockReads[2].resolve(null);
  await done;
  expect(store().snap?.kinds).toEqual({ 'a.js': 'modified', 'b.js': 'modified' });
});

test('opening another project during a read reads that project too', async () => {
  const done = store().refresh();
  await flush();
  store().enterProject('other'); // left demo while its read was running
  store().refresh();
  mockReads[0].resolve(null); // demo's read ends: its result is dropped
  await flush();
  expect(mockReads).toHaveLength(2); // and other's read starts
  expect(store().snap).toBeNull();
  mockReads[1].resolve(null);
  await done;
  expect(store()).toMatchObject({ projectId: 'other', stale: false });
  expect(store().snap?.kinds).toEqual({ 'a.js': 'modified' });
});

test('two views asking at the same moment read only once', async () => {
  const done = store().refresh(); // Git tab
  store().refresh(); // explorer, same tick: nothing changed in between
  await flush();
  mockReads[0].resolve(null);
  await done;
  expect(mockReads).toHaveLength(1);
});
