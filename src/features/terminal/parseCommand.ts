// What the terminal understands. It is not a real shell: these few commands run inside TARKA
// (`termux <command>` sends a real shell command to the Termux app).

export type Command =
  | { type: 'empty' }
  | { type: 'run'; file?: string } // picks Python, Node or the web preview from the file type
  | { type: 'python'; file?: string } // no file: the Python REPL
  | { type: 'node'; file?: string }
  | { type: 'pip'; action: 'install' | 'list'; packages: string[] }
  | { type: 'npm'; action: 'install' | 'list'; packages: string[] }
  | { type: 'ls'; path?: string }
  | { type: 'cat'; path: string }
  | { type: 'termux'; line: string }
  | { type: 'clear' }
  | { type: 'help' }
  | { type: 'unknown'; name: string; problem?: string };

export const HELP = `Commands:
  run [file]            run a file (.py, .js, .ts, .html); no file: the open one
  python [file]         run a Python file; just "python" opens the Python prompt
  node [file]           run a JavaScript or TypeScript file
  pip install <pkg>     add a Python package (saved in requirements.txt)
  pip list              show installed Python packages
  npm install <pkg>     add a JavaScript package (saved in package.json)
  npm list              show the packages in package.json
  ls [folder]           list files
  cat <file>            show a file
  termux <command>      run a real Linux command in the Termux app
  clear                 clear the screen
While a program runs, what you type goes to its input().`;

// Splits a line into words. Quotes keep spaces: run "my file.py".
export function tokenize(line: string): string[] {
  const words: string[] = [];
  const pattern = /"([^"]*)"|'([^']*)'|(\S+)/g;
  for (const match of line.matchAll(pattern)) words.push(match[1] ?? match[2] ?? match[3]);
  return words;
}

export function parseCommand(line: string): Command {
  const [name, ...args] = tokenize(line.trim());
  if (!name) return { type: 'empty' };
  switch (name) {
    case 'run':
    case 'python':
    case 'python3':
    case 'node':
      return { type: name === 'python3' ? 'python' : name, file: args[0] };
    case 'pip':
    case 'pip3':
    case 'npm':
      return packageCommand(name === 'npm' ? 'npm' : 'pip', args);
    case 'ls':
      return { type: 'ls', path: args[0] };
    case 'cat':
      if (!args[0]) return { type: 'unknown', name, problem: 'cat needs a file: cat main.py' };
      return { type: 'cat', path: args[0] };
    case 'termux': {
      const rest = line.trim().slice('termux'.length).trim();
      if (!rest) return { type: 'unknown', name, problem: 'termux needs a command: termux ls' };
      return { type: 'termux', line: rest };
    }
    case 'clear':
    case 'cls':
      return { type: 'clear' };
    case 'help':
    case '?':
      return { type: 'help' };
    default:
      return { type: 'unknown', name };
  }
}

function packageCommand(tool: 'pip' | 'npm', args: string[]): Command {
  const [action, ...packages] = args;
  if (action === 'list' || action === 'ls') return { type: tool, action: 'list', packages: [] };
  if ((action === 'install' || action === 'i') && packages.length > 0) {
    return { type: tool, action: 'install', packages };
  }
  return {
    type: 'unknown',
    name: tool,
    problem: `Try: ${tool} install <package>, or ${tool} list`,
  };
}
