import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

import { buildScripts, shellQuote, type SyncFile } from '../features/termux/syncScript';
import { changedFiles, forgetSent, rememberSent } from '../features/termux/syncState';
import { explainTermux, isExternalAppsOff } from '../features/termux/termuxHelp';

// The same runner TARKA gives Termux: the script comes on stdin, saved to a temp file first.
const RUNNER = 'f=$(mktemp); cat > "$f"; bash "$f" </dev/null; s=$?; rm -f "$f"; exit $s';
const b64 = (data: string | Buffer) => Buffer.from(data).toString('base64');

test('the scripts recreate every file exactly, then run the command in the project folder', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'termux-home-'));
  const binary = Buffer.from([0, 255, 10, 13, 128, 39]);
  const files: SyncFile[] = [
    { path: 'main.c', base64: b64('#include <stdio.h>\nint main() { puts("héllo ✓"); }\n') },
    { path: "src/it's tricky/$file.txt", base64: b64('quotes "and" $vars') },
    { path: 'empty.txt', base64: '' },
    { path: 'data.bin', base64: b64(binary) },
  ];
  const scripts = buildScripts('demo', files, 'ls && cat main.c', 120); // tiny limit: several scripts
  expect(scripts.length).toBeGreaterThan(1);
  let out = '';
  for (const script of scripts) {
    out = execFileSync('bash', ['-c', RUNNER], {
      input: script,
      env: { ...process.env, HOME: home },
    }).toString();
  }
  const root = path.join(home, 'tarka', 'demo');
  expect(fs.readFileSync(path.join(root, 'main.c'), 'utf8')).toContain('héllo ✓');
  expect(fs.readFileSync(path.join(root, "src/it's tricky/$file.txt"), 'utf8')).toBe(
    'quotes "and" $vars',
  );
  expect(fs.readFileSync(path.join(root, 'empty.txt')).length).toBe(0);
  expect(fs.readFileSync(path.join(root, 'data.bin')).equals(binary)).toBe(true);
  expect(out).toContain('main.c'); // the command ran in the project folder
  fs.rmSync(home, { recursive: true, force: true });
});

test('shell quoting survives single quotes', () => {
  expect(execFileSync('bash', ['-c', `printf %s ${shellQuote("it's $HOME")}`]).toString()).toBe(
    "it's $HOME",
  );
});

test('only changed files are sent again', () => {
  forgetSent('p');
  expect(changedFiles('p', { a: '1:1', b: '2:2' })).toEqual(['a', 'b']);
  rememberSent('p', { a: '1:1', b: '2:2' });
  expect(changedFiles('p', { a: '1:1', b: '3:3', c: '1:1' })).toEqual(['b', 'c']);
});

test('Termux problems come with what to do next', () => {
  expect(explainTermux('not-installed').join(' ')).toContain('f-droid.org');
  expect(explainTermux('external-apps-off').join(' ')).toContain('allow-external-apps=true');
  expect(isExternalAppsOff('allow-external-apps property is not set to "true"')).toBe(true);
  expect(explainTermux('not-found', 'gcc')[0]).toContain('pkg install gcc');
});
