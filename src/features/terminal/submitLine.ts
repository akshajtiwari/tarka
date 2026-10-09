import { listEntries, readForSearch } from '../../lib/projectFs';
import { useEditorStore } from '../editor/editorStore';
import { saveAllDirty } from '../editor/fileActions';
import { inlineAssets } from '../run/inlineAssets';
import { pickRunTarget } from '../run/pickRunTarget';
import { runKindFor } from '../run/runKind';
import { runInTermux } from '../termux/runInTermux';
import { useHistoryStore } from './historyStore';
import { dependenciesFor, npm, pip, requirementsOf } from './packageCommands';
import { HELP, parseCommand, type Command } from './parseCommand';
import { projectFiles } from './projectFiles';
import { useTerminalStore } from './terminalStore';

// Handles one line typed in the terminal. Lives outside React, so the editor's Run button can
// use it before the terminal screen has ever been opened.
export async function submitLine(projectId: string, line: string) {
  const t = useTerminalStore.getState();
  if (t.mode === 'ask' || t.mode === 'busy') {
    // A program is running: the line is its input.
    t.print('echo', t.mode === 'ask' ? `${t.prompt}${line}` : line);
    t.send({ type: 'input', text: line });
    if (t.mode === 'ask') t.setMode('busy');
    return;
  }
  if (t.mode === 'repl') {
    t.print('echo', `${t.prompt} ${line}`);
    if (['exit', 'exit()', 'quit()'].includes(line.trim())) return t.leaveRepl();
    return t.send({ type: 'repl', line, requirements: requirementsOf(projectId) });
  }
  t.print('echo', `$ ${line}`);
  if (line.trim()) useHistoryStore.getState().add(line.trim());
  await runCommand(projectId, parseCommand(line));
}

// The editor's Run button: stop whatever runs, then run this file.
export function runFile(projectId: string, path: string) {
  const t = useTerminalStore.getState();
  if (t.mode !== 'shell') stop();
  submitLine(projectId, path.includes(' ') ? `run "${path}"` : `run ${path}`);
}

export function stop() {
  const t = useTerminalStore.getState();
  t.send({ type: 'stop' });
  t.print('info', 'Stopped.');
  t.leaveRepl();
}

async function runCommand(projectId: string, cmd: Command) {
  const t = useTerminalStore.getState();
  switch (cmd.type) {
    case 'empty':
      return;
    case 'clear':
      return t.clear();
    case 'help':
      return HELP.split('\n').forEach((text) => t.print('info', text));
    case 'unknown':
      return t.print(
        'stderr',
        cmd.problem ?? `Unknown command: ${cmd.name}. Type help to see what works.`,
      );
    case 'ls':
      return listFolder(projectId, cmd.path ?? '');
    case 'cat': {
      const text = readForSearch(projectId, cmd.path);
      if (text === null) return t.print('stderr', `cat: can't show ${cmd.path}`);
      return text.split('\n').forEach((line) => t.print('stdout', line));
    }
    case 'pip':
      return pip(projectId, cmd.action, cmd.packages);
    case 'npm':
      return npm(projectId, cmd.action, cmd.packages);
    case 'termux':
      return runInTermux(projectId, cmd.line);
    case 'python':
      if (!cmd.file) {
        t.print('info', 'Python prompt. Type exit() to leave.');
        return t.enterRepl();
      }
      return runPath(projectId, cmd.file, 'py');
    case 'node':
      return runPath(projectId, cmd.file ?? 'main.js', 'js');
    case 'run': {
      const file = cmd.file ?? defaultTarget(projectId);
      if (!file)
        return t.print('stderr', 'Nothing to run: open a .py, .js, .ts or .html file first.');
      return runPath(projectId, file, runKindFor(file));
    }
  }
}

function defaultTarget(projectId: string) {
  const rootFiles = listEntries(projectId, '')
    .filter((e) => !e.isDir)
    .map((e) => e.name);
  return pickRunTarget(useEditorStore.getState().activePath, rootFiles);
}

function runPath(projectId: string, file: string, kind: ReturnType<typeof runKindFor>) {
  const t = useTerminalStore.getState();
  saveAllDirty(projectId); // run what you see in the editor
  const code = readForSearch(projectId, file);
  if (code === null) return t.print('stderr', `No such text file: ${file}`);
  if (kind === 'py') {
    const files = projectFiles(projectId, () => true);
    return t.send({ type: 'run-python', file, files, requirements: requirementsOf(projectId) });
  }
  if (kind === 'js' || kind === 'ts') {
    const files = projectFiles(projectId, (p) => /\.(js|mjs|cjs|ts)$/.test(p));
    return t.send({ type: 'run-js', file, files, deps: dependenciesFor(projectId) });
  }
  if (kind === 'html') {
    const folder = file.includes('/') ? file.slice(0, file.lastIndexOf('/') + 1) : '';
    const read = (path: string) => readForSearch(projectId, folder + path.replace(/^\.\//, ''));
    t.print('info', `Showing ${file}`);
    return t.setPreview(inlineAssets(code, read));
  }
  t.print('stderr', `Can't run ${file}: only .py, .js, .ts and .html files run here.`);
}

function listFolder(projectId: string, path: string) {
  const t = useTerminalStore.getState();
  try {
    const names = listEntries(projectId, path).map((e) => (e.isDir ? `${e.name}/` : e.name));
    t.print('stdout', names.join('  ') || '(empty)');
  } catch {
    t.print('stderr', `ls: no folder ${path}`);
  }
}
