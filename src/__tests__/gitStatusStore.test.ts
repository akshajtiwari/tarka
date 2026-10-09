import { useGitStatusStore } from '../features/git/gitStatusStore';

// A fake repo whose status reads finish only when the test says so.
const mockReads: { resolve: (v: unknown) => void }[] = [];
let mockModified = ['a.js'];
jest.mock('expo-file-system', () => ({}));
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
  useGitStatusStore.setState({ projectId: null, snap: null, stale: true, error: null });
  store().enterProject('demo');
});

test('asking again during a read runs one more read, not one per ask', async () => {
  const done = store().refresh('demo');
  store().refresh('demo');
  store().refresh('demo');
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
  let done = store().refresh('demo');
  await flush();
  mockReads[0].resolve(null);
  await done;
  const first = store().snap;

  done = store().refresh('demo');
  await flush();
  mockReads[1].resolve(null);
  await done;
  expect(store().snap).toBe(first);

  mockModified = ['a.js', 'b.js'];
  done = store().refresh('demo');
  await flush();
  mockReads[2].resolve(null);
  await done;
  expect(store().snap?.kinds).toEqual({ 'a.js': 'modified', 'b.js': 'modified' });
});

test('a read that finishes after leaving the project is thrown away', async () => {
  const done = store().refresh('demo');
  await flush();
  store().enterProject('other');
  mockReads[0].resolve(null);
  await done;
  expect(store().snap).toBeNull();
});
