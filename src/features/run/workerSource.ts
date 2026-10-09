// The code that runs inside a Web Worker. A worker can be killed at any time,
// so an endless loop never freezes the app. console output is sent back as messages.
export const WORKER_SOURCE = `
const send = (stream, text) => postMessage({ type: 'out', stream, text });
const show = (value) => {
  if (typeof value === 'string') return value;
  try { return JSON.stringify(value); } catch { return String(value); }
};
console.log = console.info = (...args) => send('stdout', args.map(show).join(' '));
console.warn = console.error = (...args) => send('stderr', args.map(show).join(' '));

async function runPython({ code, stdin, pyodideUrl }) {
  send('info', 'Loading Python (the first run downloads about 10 MB)...');
  importScripts(pyodideUrl + 'pyodide.js');
  const py = await loadPyodide({ indexURL: pyodideUrl });
  py.setStdout({ batched: (text) => send('stdout', text) });
  py.setStderr({ batched: (text) => send('stderr', text) });
  const lines = stdin ? stdin.split('\\n') : [];
  py.setStdin({ stdin: () => (lines.length ? lines.shift() : null) });
  await py.runPythonAsync(code);
}

onmessage = async ({ data }) => {
  try {
    if (data.kind === 'py') await runPython(data);
    else await new (async () => {}).constructor(data.code)(); // runs the code; "await" works at the top
    postMessage({ type: 'done', ok: true });
  } catch (error) {
    send('stderr', String((error && error.stack) || error));
    postMessage({ type: 'done', ok: false });
  }
};
`;
