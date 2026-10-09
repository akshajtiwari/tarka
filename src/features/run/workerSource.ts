// The code that runs inside a Web Worker ("module" type, which Pyodide needs).
// A worker can be killed at any time, so an endless loop never freezes the app.
// console output is sent back as messages.
export const WORKER_SOURCE = `
const send = (stream, text) => postMessage({ type: 'out', stream, text });
const show = (value) => {
  if (typeof value === 'string') return value;
  try { return JSON.stringify(value); } catch { return String(value); }
};
console.log = console.info = (...args) => send('stdout', args.map(show).join(' '));
console.warn = console.error = (...args) => send('stderr', args.map(show).join(' '));

// The WebView can read the app's own files (file://). Code you run gets the web only.
// shortcut: import() can still load file:// modules; a runner WebView without file access fixes that.
const webOnly = (url) => {
  const { protocol } = new URL(url, 'https://relative.invalid/');
  if (!['http:', 'https:', 'data:', 'blob:'].includes(protocol))
    throw new TypeError('Only web addresses can be loaded: ' + url);
};
const realFetch = fetch;
self.fetch = (input, init) => {
  try {
    webOnly(input instanceof Request ? input.url : String(input));
  } catch (error) {
    return Promise.reject(error);
  }
  return realFetch(input, init);
};
const realOpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function (method, url, ...rest) {
  webOnly(String(url));
  return realOpen.call(this, method, url, ...rest);
};
self.Worker = undefined; // a nested worker would get an unguarded fetch

async function runPython({ code, stdin, pyodideUrl }) {
  send('info', 'Loading Python (the first run downloads about 10 MB)...');
  const { loadPyodide } = await import(pyodideUrl + 'pyodide.mjs'); // needs a "module" worker
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
