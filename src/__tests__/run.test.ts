import { inlineAssets } from '../features/run/inlineAssets';
import { pickRunTarget } from '../features/run/pickRunTarget';
import { runKindFor } from '../features/run/runKind';
import { WORKER_SOURCE } from '../features/run/workerSource';

test('picks how to run a file from its extension', () => {
  expect(runKindFor('main.py')).toBe('py');
  expect(runKindFor('src/app.ts')).toBe('ts');
  expect(runKindFor('index.html')).toBe('html');
  expect(runKindFor('a.mjs')).toBe('js');
  expect(runKindFor('notes.md')).toBeNull();
});

test('copies local css and js into the page, keeps remote ones', () => {
  const files: Record<string, string> = { 'style.css': 'h1 { color: red; }', 'app.js': 'go();' };
  const html =
    '<link rel="stylesheet" href="style.css" />' +
    '<link rel="stylesheet" href="https://cdn.example.com/x.css">' +
    '<script src="app.js"></script><script src="missing.js"></script>';
  const out = inlineAssets(html, (p) => files[p] ?? null);
  expect(out).toContain('<style>\nh1 { color: red; }\n</style>');
  expect(out).toContain('<script>\ngo();\n</script>');
  expect(out).toContain('href="https://cdn.example.com/x.css"'); // remote: untouched
  expect(out).toContain('<script src="missing.js"></script>'); // unreadable: untouched
});

test('runs the open file when it can, otherwise a usual entry file', () => {
  expect(pickRunTarget('src/app.ts', ['main.py'])).toBe('src/app.ts');
  expect(pickRunTarget('README.md', ['README.md', 'main.py'])).toBe('main.py');
  expect(pickRunTarget(null, ['notes.md', 'tool.py'])).toBe('tool.py');
  expect(pickRunTarget(null, ['notes.md'])).toBeNull();
});

test('the worker code is valid JavaScript (it lives in a string, so the compiler cannot check it)', () => {
  expect(() => new Function(WORKER_SOURCE)).not.toThrow();
});

test('code you run can fetch from the web but not read the app files', async () => {
  const webFetch = jest.fn(async () => 'web');
  class FakeXHR {
    open(_method: string, _url: string) {}
  }
  const self: Record<string, unknown> = { Worker: class {} };
  const names = [
    'self',
    'fetch',
    'XMLHttpRequest',
    'Request',
    'postMessage',
    'console',
    'onmessage',
  ];
  new Function(...names, WORKER_SOURCE)(self, webFetch, FakeXHR, class {}, () => {}, {}, null);

  const guarded = self.fetch as (url: string) => Promise<unknown>;
  await expect(guarded('file:///data/user/0/app/files/x')).rejects.toThrow('Only web addresses');
  await expect(guarded('https://example.com/data.json')).resolves.toBe('web');
  expect(() => new FakeXHR().open('GET', 'file:///etc/hosts')).toThrow('Only web addresses');
  expect(self.Worker).toBeUndefined();
});
