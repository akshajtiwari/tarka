// Termux can't see TARKA's project folder, so each `termux` command first sends the project's
// files over: bash scripts that write them under ~/tarka/<project>/ in Termux, then run the
// command there. Files travel as base64, so binary files and any text survive the trip.

export type SyncFile = { path: string; base64: string };

const MAX_SCRIPT = 200_000; // characters per script: Android limits how much one message carries

// it's -> 'it'\''s': safe inside a bash command.
export function shellQuote(text: string): string {
  return `'${text.replace(/'/g, "'\\''")}'`;
}

const projectRoot = (projectId: string) => `"$HOME/tarka/${projectId}"`;

function fileBlock(root: string, file: SyncFile): string {
  const folder = file.path.includes('/') ? file.path.slice(0, file.path.lastIndexOf('/')) : '';
  const target = `${root}/${shellQuote(file.path)}`;
  const lines = file.base64.match(/.{1,76}/g) ?? [];
  return [
    folder ? `mkdir -p ${root}/${shellQuote(folder)}` : '',
    `base64 -d > ${target} <<'TARKA_EOF'`,
    ...lines,
    'TARKA_EOF',
    '',
  ]
    .filter((line, i) => line || i > 0)
    .join('\n');
}

// One or more scripts: all but the last only write files; the last also runs `command` in the
// project folder. Splits so no script is longer than `maxChars` (a single huge file still gets
// its own script: callers skip files that are too big).
export function buildScripts(
  projectId: string,
  files: SyncFile[],
  command: string,
  maxChars = MAX_SCRIPT,
): string[] {
  const root = projectRoot(projectId);
  const start = `set -e\nmkdir -p ${root}\n`;
  const scripts: string[] = [];
  let current = start;
  for (const file of files) {
    const block = fileBlock(root, file);
    if (current !== start && current.length + block.length > maxChars) {
      scripts.push(current);
      current = start;
    }
    current += block;
  }
  if (current !== start) scripts.push(current);
  // The command goes on its own, so a failed copy is never mistaken for the command's exit code.
  scripts.push(`mkdir -p ${root}\ncd ${root}\n${command}\n`);
  return scripts;
}
