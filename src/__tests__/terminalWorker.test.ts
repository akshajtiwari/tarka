import { execFileSync } from 'child_process';

import { WORKER_BODY } from '../features/run/workerSource';

// Runs the worker code with fake browser parts and a fake Pyodide, and records what it does.
// User code is built with `new Function`, so it sees the global console: in a real worker that is
// the one the worker rewires; here the test swaps in one shared object.
const fakeConsole: Record<string, unknown> = {};
const realConsole = global.console;
beforeEach(() => (global.console = fakeConsole as unknown as Console));
afterEach(() => (global.console = realConsole));

function startWorker(opts: { jspi: boolean; offline?: boolean; pipFails?: boolean }) {
  const posted: { type: string; [k: string]: unknown }[] = [];
  const pythonRun: string[] = [];
  const globals = new Map<string, unknown>();
  const fakePyodide = {
    setStdout() {},
    setStderr() {},
    setStdin() {},
    globals: { set: (k: string, v: unknown) => globals.set(k, v) },
    toPy: (v: unknown) => v,
    loadPackage: async () => {},
    loadPackagesFromImports: async () => {},
    runPythonAsync: async (code: string) => {
      if (opts.pipFails && code.includes('micropip.install'))
        throw new Error('no wheel for tensorflow');
      pythonRun.push(code);
      return code.includes('_tarka_repl') ? true : undefined;
    },
  };
  const importModule = async (url: string) => {
    if (url.endsWith('pyodide.mjs')) return { loadPyodide: async () => fakePyodide };
    if (opts.offline) throw new Error('offline');
    return { default: (x: number) => x * 2, triple: (x: number) => x * 3 };
  };
  const scope: { onmessage?: (e: { data: unknown }) => Promise<void> } = {};
  const wasm = opts.jspi ? { Suspending: function () {} } : {};
  const names = [
    'importModule',
    'postMessage',
    'self',
    'fetch',
    'XMLHttpRequest',
    'Request',
    'console',
    'WebAssembly',
    'scope',
  ];
  const body = WORKER_BODY.replace('onmessage = async', 'scope.onmessage = async');
  new Function(...names, body)(
    importModule,
    (m: { type: string }) => posted.push(m),
    {},
    async () => null,
    class {
      open() {}
    },
    class {},
    fakeConsole,
    wasm,
    scope,
  );
  const send = (data: object) => scope.onmessage!({ data });
  return { posted, pythonRun, globals, send };
}

const settle = () => new Promise((r) => setTimeout(r, 0));

test('the Python helpers the worker sends are valid Python', async () => {
  const w = startWorker({ jspi: true });
  await w.send({ type: 'repl', line: '1 + 1', requirements: [], pyodideUrl: 'https://cdn/' });
  const python = w.pythonRun.join('\n\n# ---\n\n');
  // Real Python checks the syntax of every snippet (nothing is run).
  execFileSync(
    'python3',
    ['-c', 'import sys; [compile(s, "<w>", "exec") for s in sys.stdin.read().split("# ---")]'],
    { input: python },
  );
  expect(python).toContain('builtins.input = _tarka_input'); // live input with JSPI
  expect(w.posted).toContainEqual({ type: 'session', jspi: true });
  expect(w.posted.at(-1)).toEqual({ type: 'done', ok: true, more: true }); // REPL asks for more
});

test('pip install and pip list send runnable Python', async () => {
  const w = startWorker({ jspi: false });
  await w.send({
    type: 'pip',
    action: 'install',
    packages: ['rich'],
    requirements: [],
    pyodideUrl: 'https://cdn/',
  });
  await w.send({
    type: 'pip',
    action: 'list',
    packages: [],
    requirements: [],
    pyodideUrl: 'https://cdn/',
  });
  const pip = w.pythonRun.filter((c) => c.includes('micropip'));
  execFileSync(
    'python3',
    [
      '-c',
      'import ast, sys; [ast.parse(s.replace("await ", "")) for s in sys.stdin.read().split("# ---")]',
    ],
    { input: pip.join('\n# ---\n') },
  );
  expect(w.globals.get('_tarka_packages')).toEqual(['rich']);
  expect(w.posted).toContainEqual({ type: 'session', jspi: false });
});

test('JavaScript can import packages and local files, and wait for input', async () => {
  const w = startWorker({ jspi: false });
  const files = {
    'main.js':
      'const util = require("./util"); const dbl = require("dbl"); const name = await input("Name? "); console.log(dbl.default(util.n), dbl.triple(1), name);',
    'util.js': 'exports.n = 21;',
  };
  const running = w.send({
    type: 'run-js',
    file: 'main.js',
    files,
    modules: { dbl: 'https://esm.sh/dbl' },
  });
  await settle();
  await settle();
  expect(w.posted).toContainEqual({ type: 'ask', prompt: 'Name? ' });
  await w.send({ type: 'input', text: 'Ada' });
  await running;
  expect(w.posted).toContainEqual({ type: 'out', stream: 'stdout', text: '42 3 Ada' });
  expect(w.posted.at(-1)).toEqual({ type: 'done', ok: true, more: false });
});

test('Node-only modules get a clear hint', async () => {
  const w = startWorker({ jspi: false });
  await w.send({ type: 'run-js', file: 'a.js', files: { 'a.js': 'require("fs")' }, modules: {} });
  expect(w.posted).toContainEqual(
    expect.objectContaining({
      stream: 'stderr',
      text: expect.stringContaining('termux node a.js'),
    }),
  );
});

test('lines typed for an earlier program are not given to the next one', async () => {
  const w = startWorker({ jspi: false });
  await w.send({ type: 'input', text: 'stale' }); // typed while nothing was asking
  const running = w.send({
    type: 'run-js',
    file: 'a.js',
    files: { 'a.js': 'console.log(await input("Age? "))' },
    modules: {},
  });
  await settle();
  await settle();
  expect(w.posted).toContainEqual({ type: 'ask', prompt: 'Age? ' });
  await w.send({ type: 'input', text: '7' });
  await running;
  expect(w.posted).toContainEqual({ type: 'out', stream: 'stdout', text: '7' });
});

test('a package that fails to load only matters when the code requires it', async () => {
  const w = startWorker({ jspi: false, offline: true });
  await w.send({
    type: 'run-js',
    file: 'a.js',
    files: { 'a.js': 'console.log("ran"); require("gone")' },
    modules: { gone: 'https://esm.sh/gone' },
  });
  expect(w.posted).toContainEqual({ type: 'out', stream: 'stdout', text: 'ran' });
  expect(w.posted).toContainEqual(
    expect.objectContaining({ stream: 'stderr', text: expect.stringContaining('"gone"') }),
  );
});

test('a requirement that cannot install is reported, and the program still runs', async () => {
  const w = startWorker({ jspi: true, pipFails: true });
  await w.send({
    type: 'run-python',
    file: 'main.py',
    files: { 'main.py': 'print(1)' },
    requirements: ['tensorflow'],
    pyodideUrl: 'https://cdn/',
  });
  expect(w.posted).toContainEqual(
    expect.objectContaining({
      stream: 'stderr',
      text: 'requirements.txt: no wheel for tensorflow',
    }),
  );
  expect(w.pythonRun.some((code) => code.includes('_tarka_run'))).toBe(true);
  expect(w.posted.at(-1)).toEqual({ type: 'done', ok: true, more: false });
});
