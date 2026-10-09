import { TarkaAndroid, type TermuxResult } from '../../../modules/tarka-android';
import { fileAt, listEntries } from '../../lib/projectFs';
import { allFilePaths } from '../../lib/walk';
import { useTerminalStore } from '../terminal/terminalStore';
import { buildScripts, type SyncFile } from './syncScript';
import { changedFiles, forgetSent, rememberSent, type FileStamp } from './syncState';
import { explainTermux, isExternalAppsOff, type TermuxProblem } from './termuxHelp';

const MAX_FILE = 140 * 1024; // bigger files are not sent (they wouldn't fit in one message)
const TIMEOUT_MS = 120_000;
// The script arrives on stdin and is saved to a temp file first, so the program it runs never
// reads the rest of the script as its own input.
const RUNNER = 'f=$(mktemp); cat > "$f"; bash "$f" </dev/null; s=$?; rm -f "$f"; exit $s';

// `termux <command>` in the terminal: copy the project into Termux (~/tarka/<project>/), run
// the command there, and show what it printed. `termux sync` copies everything again.
export async function runInTermux(projectId: string, line: string) {
  const t = useTerminalStore.getState();
  const explain = (problem: TermuxProblem, detail?: string) =>
    explainTermux(problem, detail).forEach((text) => t.print('stderr', text));

  if (!TarkaAndroid) return explain('unsupported');
  if (!TarkaAndroid.isTermuxInstalled()) return explain('not-installed');
  if (!TarkaAndroid.hasTermuxPermission()) {
    const { granted } = await TarkaAndroid.requestTermuxPermission();
    if (!granted) return explain('no-permission');
  }
  const syncOnly = line.trim() === 'sync';
  if (syncOnly) forgetSent(projectId);
  t.setMode('busy');
  t.setActivity('Running in Termux…');
  try {
    const { files, stamps, skipped } = collect(projectId);
    if (skipped > 0) t.print('info', `${skipped} file(s) over 140 KB were not copied to Termux.`);
    if (files.length > 0)
      t.print('info', `Copying ${files.length} file(s) to ~/tarka/${projectId}…`);
    const command = syncOnly ? `echo "Copied to ~/tarka/${projectId}"` : line;
    const scripts = buildScripts(projectId, files, command);
    let result: TermuxResult | null = null;
    for (const script of scripts) {
      result = await withTimeout(TarkaAndroid.runInTermux(['-c', RUNNER], script, true));
      const lastOne = script === scripts.at(-1);
      if (result.err !== -1 || (!lastOne && result.exitCode !== 0)) break;
    }
    if (result) show(result, command);
    if (result?.err === -1) rememberSent(projectId, stamps);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (message === 'timeout') explain('timeout');
    else if (/NO_PERMISSION|permission/i.test(message)) explain('no-permission');
    else t.print('stderr', `Termux: ${message}`);
  } finally {
    useTerminalStore.getState().setMode('shell');
  }
}

function collect(projectId: string) {
  const stamps: FileStamp = {};
  let skipped = 0;
  for (const path of allFilePaths((p) => listEntries(projectId, p))) {
    const file = fileAt(projectId, path);
    if ((file.size ?? 0) > MAX_FILE) skipped += 1;
    else stamps[path] = `${file.size}:${file.modificationTime}`;
  }
  const files: SyncFile[] = changedFiles(projectId, stamps).map((path) => ({
    path,
    base64: fileAt(projectId, path).base64Sync(),
  }));
  return { files, stamps, skipped };
}

function show(result: TermuxResult, command: string) {
  const t = useTerminalStore.getState();
  const print = (stream: 'stdout' | 'stderr', text: string) =>
    text &&
    text
      .replace(/\n$/, '')
      .split('\n')
      .forEach((line) => t.print(stream, line));
  print('stdout', result.stdout);
  print('stderr', result.stderr);
  if (result.err !== -1) {
    if (isExternalAppsOff(result.errmsg)) {
      explainTermux('external-apps-off').forEach((text) => t.print('stderr', text));
    } else t.print('stderr', result.errmsg || 'Termux could not run the command.');
    return;
  }
  if (result.exitCode === 127) {
    const name = command.trim().split(/\s+/)[0];
    explainTermux('not-found', name).forEach((text) => t.print('stderr', text));
  }
  if (Number(result.stdoutOriginalLength) > result.stdout.length) {
    t.print('info', 'Termux kept only the last 100 KB of the output.');
  }
  t.print('info', `[exit ${result.exitCode}]`);
}

function withTimeout<T>(promise: Promise<T>): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), TIMEOUT_MS)),
  ]);
}
