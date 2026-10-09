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

test('switching branch is refused while changes are staged', async () => {
  fs.writeFileSync(path.join(dir, 'a.txt'), 'x');
  await gitService.stage(fs, dir, { path: 'a.txt', kind: 'untracked' });
  await gitService.commit(fs, dir, 'init', me);
  fs.writeFileSync(path.join(dir, 'a.txt'), 'changed');
  await gitService.stage(fs, dir, { path: 'a.txt', kind: 'modified' });
  await expect(gitService.assertClean(fs, dir)).rejects.toThrow('Commit your changes first');

  await gitService.commit(fs, dir, 'save', me);
  fs.writeFileSync(path.join(dir, 'new.txt'), 'untracked is fine');
  await expect(gitService.assertClean(fs, dir)).resolves.toBeUndefined();
});

test('stage all stages new, changed and deleted files', async () => {
  fs.writeFileSync(path.join(dir, 'a.txt'), 'a');
  fs.writeFileSync(path.join(dir, 'b.txt'), 'b');
  await gitService.stageAll(fs, dir, (await gitService.getChanges(fs, dir)).unstaged);
  await gitService.commit(fs, dir, 'init', me);

  fs.rmSync(path.join(dir, 'a.txt'));
  fs.writeFileSync(path.join(dir, 'b.txt'), 'b2');
  await gitService.stageAll(fs, dir, (await gitService.getChanges(fs, dir)).unstaged);
  expect((await gitService.getChanges(fs, dir)).staged).toEqual([
    { path: 'a.txt', kind: 'deleted' },
    { path: 'b.txt', kind: 'modified' },
  ]);
});

test('the token only goes to known git hosts over https', () => {
  expect(gitService.canSendToken('https://github.com/user/repo.git')).toBe(true);
  expect(gitService.canSendToken('http://github.com/user/repo.git')).toBe(false);
  expect(gitService.canSendToken('https://git.someone.dev/x.git')).toBe(false);
  expect(gitService.canSendToken('not a url')).toBe(false);
});

test('a repo without a remote says so in plain words', async () => {
  await expect(gitService.assertHasRemote(fs, dir)).rejects.toThrow('no remote');
});

test('a commit lists the files it added, changed and deleted', async () => {
  fs.writeFileSync(path.join(dir, 'a.txt'), 'one\n');
  fs.mkdirSync(path.join(dir, 'src'));
  fs.writeFileSync(path.join(dir, 'src', 'b.txt'), 'b\n');
  await gitService.stageAll(fs, dir, (await gitService.getChanges(fs, dir)).unstaged);
  await gitService.commit(fs, dir, 'first', me);

  fs.writeFileSync(path.join(dir, 'a.txt'), 'one more\n'); // new size: git skips same-size edits made in the same second
  fs.rmSync(path.join(dir, 'src', 'b.txt'));
  fs.writeFileSync(path.join(dir, 'c.txt'), 'c\n');
  await gitService.stageAll(fs, dir, (await gitService.getChanges(fs, dir)).unstaged);
  await gitService.commit(fs, dir, 'second', me);

  const [second, first] = await gitService.history(fs, dir);
  expect((await gitService.commitDetail(fs, dir, first.oid)).files).toEqual([
    { path: 'a.txt', kind: 'added' },
    { path: 'src/b.txt', kind: 'added' },
  ]);
  const detail = await gitService.commitDetail(fs, dir, second.oid);
  expect(detail).toMatchObject({ message: 'second', parent: first.oid });
  expect(detail.files).toEqual([
    { path: 'a.txt', kind: 'modified' },
    { path: 'c.txt', kind: 'added' },
    { path: 'src/b.txt', kind: 'deleted' },
  ]);
  expect(await gitService.committedText(fs, dir, 'a.txt', first.oid)).toBe('one\n');
});
