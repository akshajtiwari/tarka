// The Python part of the Web Worker (joined with the rest in workerSource.ts). Like the rest,
// it is a string: it uses `send`, `ask`, `typed` and `importModule` from the worker itself.

// One Python (Pyodide) per session: loaded once, packages stay installed until Stop.
export const WORKER_PYTHON = `
let py = null;
const PROJECT = '/home/pyodide/project';

const HELPERS = \`
import builtins, codeop, os, shutil, sys

def _tarka_put_project(files):
    shutil.rmtree('\${PROJECT}', ignore_errors=True)
    for path, text in files.items():
        full = os.path.join('\${PROJECT}', path)
        os.makedirs(os.path.dirname(full), exist_ok=True)
        with open(full, 'w') as f:
            f.write(text)
    os.chdir('\${PROJECT}')
    if '' not in sys.path:
        sys.path.insert(0, '')
    # Forget project modules from the last run, so edited files are imported again.
    for name, module in list(sys.modules.items()):
        if (getattr(module, '__file__', None) or '').startswith('\${PROJECT}'):
            del sys.modules[name]

def _tarka_run(code, filename):
    scope = {'__name__': '__main__', '__file__': filename}
    try:
        exec(compile(code, filename, 'exec'), scope)
    except SystemExit as e:
        if e.code not in (None, 0):
            raise

_tarka_lines = []
_tarka_scope = {'__name__': '__console__'}

def _tarka_repl(line):
    _tarka_lines.append(line)
    source = '\\\\n'.join(_tarka_lines)
    try:
        code = codeop.compile_command(source, '<stdin>', 'single')
    except SyntaxError:
        _tarka_lines.clear()
        raise
    if code is None:
        return True
    _tarka_lines.clear()
    exec(code, _tarka_scope)
    return False
\`;

// input() pauses Python until you type a line. That needs JSPI (Chrome 137+); older WebViews
// only get lines typed ahead.
const LIVE_INPUT = \`
from pyodide.ffi import run_sync
def _tarka_input(prompt=''):
    return run_sync(_tarka_ask(str(prompt)))
builtins.input = _tarka_input
\`;

async function startPython(data) {
  send('info', 'Starting Python (the first time downloads about 10 MB)...');
  const { loadPyodide } = await importModule(data.pyodideUrl + 'pyodide.mjs');
  py = await loadPyodide({ indexURL: data.pyodideUrl });
  py.setStdout({ batched: (text) => send('stdout', text) });
  py.setStderr({ batched: (text) => send('stderr', text) });
  await py.runPythonAsync(HELPERS);
  const jspi = typeof WebAssembly.Suspending === 'function';
  py.globals.set('_tarka_ask', ask);
  if (jspi) await py.runPythonAsync(LIVE_INPUT);
  else py.setStdin({ stdin: () => (typed.length ? typed.shift() : null) });
  postMessage({ type: 'session', jspi });
  // A package that can't install (no Pyodide build) is reported once; the run goes on.
  if (data.requirements.length) {
    await pip('install', data.requirements).catch((e) => send('stderr', 'requirements.txt: ' + e.message));
  }
}

async function pip(action, packages) {
  await py.loadPackage('micropip', { messageCallback: () => {} });
  if (action === 'list') {
    await py.runPythonAsync('import micropip\\nfor p in sorted(micropip.list().values(), key=lambda p: p.name): print(p.name, p.version)');
    return;
  }
  send('info', 'Installing ' + packages.join(', ') + '...');
  py.globals.set('_tarka_packages', py.toPy(packages));
  await py.runPythonAsync('import micropip\\nawait micropip.install(_tarka_packages)');
  send('info', 'Installed ' + packages.join(', '));
}

async function python(data) {
  if (!py) await startPython(data);
  if (data.type === 'pip') return pip(data.action, data.packages);
  if (data.type === 'repl') {
    py.globals.set('_tarka_line', data.line);
    return py.runPythonAsync('_tarka_repl(_tarka_line)');
  }
  py.globals.set('_tarka_files', py.toPy(data.files));
  await py.runPythonAsync('_tarka_put_project(_tarka_files)');
  const code = data.files[data.file];
  await py.loadPackagesFromImports(code, { messageCallback: (m) => send('info', m) });
  py.globals.set('_tarka_code', code);
  py.globals.set('_tarka_file', data.file);
  await py.runPythonAsync('_tarka_run(_tarka_code, _tarka_file)');
}
`;
