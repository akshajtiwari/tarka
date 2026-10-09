import { runInTermux } from '../features/termux/runInTermux';
import { forgetSent } from '../features/termux/syncState';
import { useTerminalStore } from '../features/terminal/terminalStore';

const mockTermux = {
  isTermuxInstalled: jest.fn(() => true),
  hasTermuxPermission: jest.fn(() => true),
  requestTermuxPermission: jest.fn(async () => ({ granted: false })),
  runInTermux: jest.fn(async (_args: string[], _stdin: string, _bg: boolean) => ({
    stdout: 'hello from C\n',
    stderr: '',
    exitCode: 0,
    err: -1,
    errmsg: '',
    stdoutOriginalLength: '13',
  })),
};
jest.mock('expo-file-system', () => ({}));
// A getter: jest hoists this above the constant, so read it only when the code asks.
jest.mock('../../modules/tarka-android', () => ({
  get TarkaAndroid() {
    return mockTermux;
  },
}));
jest.mock('../lib/projectFs', () => ({
  listEntries: () => [{ name: 'main.c', isDir: false }],
  fileAt: () => ({ size: 10, modificationTime: 1, base64Sync: () => 'aGk=' }),
}));

const printed = () => useTerminalStore.getState().lines.map((l) => l.text);

beforeEach(() => {
  useTerminalStore.setState({ projectId: null });
  useTerminalStore.getState().enterProject('demo');
  forgetSent('demo');
  jest.clearAllMocks();
});

test('runs the command and shows its output and exit code', async () => {
  await runInTermux('demo', 'gcc main.c && ./a.out');
  const [args, script, background] = mockTermux.runInTermux.mock.calls[0];
  expect(args[0]).toBe('-c');
  expect(background).toBe(true);
  expect(script).toContain('main.c');
  expect(script).toContain('gcc main.c && ./a.out');
  expect(printed()).toEqual(expect.arrayContaining(['hello from C', '[exit 0]']));
  expect(useTerminalStore.getState().mode).toBe('shell');

  await runInTermux('demo', 'ls'); // nothing changed: no files are sent again
  expect(mockTermux.runInTermux.mock.calls[1][1]).not.toContain('base64 -d');
});

test('explains what to do when Termux is missing or not allowed', async () => {
  mockTermux.isTermuxInstalled.mockReturnValueOnce(false);
  await runInTermux('demo', 'ls');
  expect(printed().join(' ')).toContain('f-droid.org');

  mockTermux.hasTermuxPermission.mockReturnValueOnce(false);
  await runInTermux('demo', 'ls');
  expect(mockTermux.requestTermuxPermission).toHaveBeenCalled();
  expect(printed().join(' ')).toContain('Run commands in Termux');
  expect(mockTermux.runInTermux).not.toHaveBeenCalled();
});

test('tells you to allow external apps when Termux blocks TARKA', async () => {
  mockTermux.runInTermux.mockResolvedValueOnce({
    stdout: '',
    stderr: '',
    exitCode: -1,
    err: 2,
    errmsg: 'RUN_COMMAND requires allow-external-apps property to be set to "true"',
    stdoutOriginalLength: '0',
  });
  await runInTermux('demo', 'ls');
  expect(printed().join(' ')).toContain('allow-external-apps=true');
});
