// The code that runs inside a Web Worker ("module" type, which Pyodide needs). A worker can be
// killed at any time, so an endless loop never freezes the app. It lives in strings because it
// runs inside the WebView, outside the app's own JavaScript. `importModule` is a seam for tests.

import { NODE_ONLY } from '../terminal/jsModules';
import { WORKER_PYTHON } from './workerPython';

// Network guard, console capture, and input() answers.
const WORKER_IO = `
const send = (stream, text) => postMessage({ type: 'out', stream, text });
const show = (value) => {
  if (typeof value === 'string') return value;
  try { return JSON.stringify(value); } catch { return String(value); }
};
console.log = console.info = (...args) => send('stdout', args.map(show).join(' '));
console.warn = console.error = (...args) => send('stderr', args.map(show).join(' '));

// The WebView can read the app's own files (file://). Code you run gets the web only: this guard
// gives a clear error for fetch and XHR, and the runner page's security policy also blocks import().
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

// Lines typed before a program asks are kept; asking waits for the next line otherwise.
const typed = [];
let answer = null;
const ask = (prompt) => {
  if (typed.length) return Promise.resolve(typed.shift());
  postMessage({ type: 'ask', prompt: String(prompt ?? '') });
  return new Promise((resolve) => (answer = resolve));
};
const giveInput = (text) => {
  if (!answer) return typed.push(text);
  const resolve = answer;
  answer = null;
  resolve(text);
};
`;

// JavaScript and TypeScript (already turned into CommonJS by the runner): a tiny module loader.
const WORKER_JS = `
const AsyncFunction = (async () => {}).constructor;
const NODE_ONLY = ${JSON.stringify(NODE_ONLY)};

function resolveLocal(from, spec, files) {
  const parts = from.split('/').slice(0, -1);
  for (const p of spec.split('/')) {
    if (p === '..') parts.pop();
    else if (p && p !== '.') parts.push(p);
  }
  const base = parts.join('/');
  return [base, base + '.js', base + '.ts', base + '.mjs', base + '/index.js', base + '/index.ts']
    .find((path) => path in files);
}

async function runJs(data) {
  // All packages load at once. One that fails only matters if the code really requires it.
  const packages = {};
  const failed = {};
  await Promise.all(Object.entries(data.modules).map(async ([spec, url]) => {
    try { packages[spec] = await importModule(url); } catch (error) { failed[spec] = error; }
  }));
  const cache = {};
  const makeRequire = (from) => (spec) => {
    if (spec in failed) throw new Error('Could not load "' + spec + '" from esm.sh: ' + failed[spec].message);
    if (spec in packages) return { __esModule: true, ...packages[spec] };
    if (spec.startsWith('node:') || NODE_ONLY.includes(spec))
      throw new Error('"' + spec + '" only exists in Node.js. Try: termux node ' + data.file);
    const path = resolveLocal(from, spec, data.files);
    if (!path) throw new Error('Cannot find "' + spec + '" from ' + from);
    if (!cache[path]) {
      cache[path] = { exports: {} };
      new Function('exports', 'require', 'module', data.files[path])(cache[path].exports, makeRequire(path), cache[path]);
    }
    return cache[path].exports;
  };
  const main = { exports: {} };
  // "await input('Name? ')" works at the top level of the file you run.
  await new AsyncFunction('exports', 'require', 'module', 'input', data.files[data.file])(main.exports, makeRequire(data.file), main, ask);
}
`;

const WORKER_MAIN = `
onmessage = async ({ data }) => {
  if (data.type === 'input') return giveInput(data.text);
  typed.length = 0; // lines typed for an earlier program are not answers for this one
  try {
    const result = data.type === 'run-js' ? await runJs(data) : await python(data);
    postMessage({ type: 'done', ok: true, more: result === true });
  } catch (error) {
    send('stderr', String((error && error.message) || error));
    postMessage({ type: 'done', ok: false });
  }
};
`;

export const WORKER_BODY = WORKER_IO + WORKER_PYTHON + WORKER_JS + WORKER_MAIN;
export const WORKER_SOURCE = 'const importModule = (url) => import(url);\n' + WORKER_BODY;
