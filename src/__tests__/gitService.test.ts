import fs from 'fs';
import os from 'os';
import path from 'path';

import * as gitService from '../features/git/gitService';

const me = { name: 'Test', email: 'test@example.com' };
let dir: string;

beforeEach(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tarka-git-'));
  await gitService.initRepo(fs, dir);
});

afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

test('a new file shows up, can be staged and committed', async () => {
  fs.writeFileSync(path.join(dir, 'main.js'), 'console.log(1)\n');
  expect((await gitService.getChanges(fs, dir)).unstaged).toEqual([
    { path: 'main.js', kind: 'untracked' },
  ]);

  await gitService.stage(fs, dir, { path: 'main.js', kind: 'untracked' });
  expect((await gitService.getChanges(fs, dir)).staged).toEqual([
    { path: 'main.js', kind: 'added' },
  ]);

  await gitService.commit(fs, dir, 'first commit', me);
  expect(await gitService.getChanges(fs, dir)).toEqual({ staged: [], unstaged: [] });
  expect((await gitService.history(fs, dir))[0]).toMatchObject({
    message: 'first commit',
    author: 'Test',
  });
});

test('edits, unstaging and the committed text', async () => {
  fs.writeFileSync(path.join(dir, 'a.txt'), 'one\n');
  await gitService.stage(fs, dir, { path: 'a.txt', kind: 'untracked' });
  await gitService.commit(fs, dir, 'add a', me);

  fs.writeFileSync(path.join(dir, 'a.txt'), 'two\n');
  await gitService.stage(fs, dir, { path: 'a.txt', kind: 'modified' });
  await gitService.unstage(fs, dir, 'a.txt');
  expect(await gitService.getChanges(fs, dir)).toEqual({
    staged: [],
    unstaged: [{ path: 'a.txt', kind: 'modified' }],
  });
  expect(await gitService.committedText(fs, dir, 'a.txt')).toBe('one\n');
});

test('branches can be created and switched', async () => {
  fs.writeFileSync(path.join(dir, 'a.txt'), 'x');
  await gitService.stage(fs, dir, { path: 'a.txt', kind: 'untracked' });
  await gitService.commit(fs, dir, 'init', me);

  await gitService.createBranch(fs, dir, 'feature');
  expect(await gitService.currentBranch(fs, dir)).toBe('feature');
  await gitService.switchBranch(fs, dir, 'main');
  expect(await gitService.currentBranch(fs, dir)).toBe('main');
  expect((await gitService.listBranches(fs, dir)).sort()).toEqual(['feature', 'main']);
});
