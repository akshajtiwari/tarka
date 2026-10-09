import { execSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

import * as gitRemote from '../features/git/gitRemote';
import * as gitService from '../features/git/gitService';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { startGitServer } = require('../../scripts/git-server.cjs');

const me = { name: 'Test', email: 'test@example.com' };
let root: string;
let server: { url: string; close: () => void };

// A bare repo with one commit, served over HTTP like GitHub would.
beforeAll(async () => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'tarka-remote-'));
  const seed = path.join(root, 'seed');
  execSync(
    `git init -q -b main ${seed} && cd ${seed} && echo hello > a.txt && git add . && ` +
      `git -c user.name=t -c user.email=t@t commit -qm init && ` +
      `git clone -q --bare ${seed} ${root}/demo.git && git -C ${root}/demo.git config http.receivepack true`,
  );
  server = await startGitServer(root);
});

afterAll(() => {
  server.close();
  fs.rmSync(root, { recursive: true, force: true });
});

test('clone, commit, push, and pull back into a second clone', async () => {
  const first = path.join(root, 'first');
  const second = path.join(root, 'second');
  const url = `${server.url}/demo.git`;

  await gitRemote.clone(fs, first, url);
  expect(fs.readFileSync(path.join(first, 'a.txt'), 'utf8')).toBe('hello\n');
  await gitRemote.clone(fs, second, url);

  fs.writeFileSync(path.join(first, 'b.txt'), 'new\n');
  await gitService.stage(fs, first, { path: 'b.txt', kind: 'untracked' });
  await gitService.commit(fs, first, 'add b', me);
  await gitRemote.push(fs, first);

  await gitRemote.pull(fs, second, me);
  expect(fs.readFileSync(path.join(second, 'b.txt'), 'utf8')).toBe('new\n');

  // A new clone has the newest commit but not its parent: what it changed is unknown.
  const third = path.join(root, 'third');
  await gitRemote.clone(fs, third, url);
  const [newest] = await gitService.history(fs, third);
  expect(await gitService.commitDetail(fs, third, newest.oid)).toMatchObject({
    message: 'add b',
    files: null,
  });
}, 30000);
