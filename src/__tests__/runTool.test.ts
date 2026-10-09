import { useApprovalStore } from '../features/agent/approvalStore';
import { runTool } from '../features/agent/runTool';
import { useEditorStore } from '../features/editor/editorStore';

// A tiny in-memory project instead of the phone's file system.
const mockDisk = new Map<string, string>();
jest.mock('expo-file-system', () => ({}));
jest.mock('../lib/projectFs', () => ({
  ...jest.requireActual('../lib/projectFs'),
  fileAt: (_id: string, path: string) => ({
    get exists() {
      return mockDisk.has(path);
    },
    textSync: () => mockDisk.get(path),
    create: () => mockDisk.set(path, ''),
    write: (text: string) => mockDisk.set(path, text),
    delete: () => mockDisk.delete(path),
  }),
  readForSearch: (_id: string, path: string) => mockDisk.get(path) ?? null,
}));

const call = (name: string, input: Record<string, unknown>) =>
  runTool('demo', { id: '1', name, input });

// The user approves every card; `beforeYes` runs while the card is open.
function approveAll(beforeYes = () => {}) {
  return useApprovalStore.subscribe((s) => {
    if (!s.pending) return;
    beforeYes();
    s.respond(true);
  });
}

beforeEach(() => {
  mockDisk.clear();
  mockDisk.set('a.js', 'old');
  useEditorStore.setState({ projectId: 'demo', files: [], activePath: null });
});

test('paths are checked and spelled one way', async () => {
  expect((await call('read_file', { path: './a.js' })).output).toBe('old');
  expect((await call('read_file', { path: '../other/a.js' })).isError).toBe(true);
  expect((await call('read_file', { path: '.git/config' })).isError).toBe(true);
  expect((await call('read_file', { path: '' })).isError).toBe(true);
});

test('a write never replaces unsaved edits in an open tab', async () => {
  useEditorStore.setState({ files: [{ path: 'a.js', text: 'typing…', savedText: 'old' }] });
  const stop = approveAll();
  const result = await call('write_file', { path: 'a.js', content: 'new' });
  stop();
  expect(result.isError).toBe(true);
  expect(mockDisk.get('a.js')).toBe('old');
});

test('a write stops if the file changed while the card was open', async () => {
  const stop = approveAll(() => mockDisk.set('a.js', 'autosaved'));
  const result = await call('write_file', { path: 'a.js', content: 'new' });
  stop();
  expect(result.isError).toBe(true);
  expect(mockDisk.get('a.js')).toBe('autosaved');
});

test('an approved write lands and updates the open tab', async () => {
  useEditorStore.setState({ files: [{ path: 'a.js', text: 'old', savedText: 'old' }] });
  const stop = approveAll();
  const result = await call('write_file', { path: './a.js', content: 'new' });
  stop();
  expect(result).toEqual({ id: '1', output: 'Wrote a.js.', isError: false });
  expect(mockDisk.get('a.js')).toBe('new');
  expect(useEditorStore.getState().files[0].savedText).toBe('new');
});

test('delete only works on a file that exists', async () => {
  expect(await call('delete_file', { path: 'missing.js' })).toMatchObject({ isError: true });
});

test('long output is cut with a note', async () => {
  mockDisk.set('big.txt', 'x'.repeat(30_000));
  const { output } = await call('read_file', { path: 'big.txt' });
  expect(output.endsWith('[cut after 20000 characters]')).toBe(true);
});
