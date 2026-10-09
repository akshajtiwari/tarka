import { fileAt } from '../../lib/projectFs';
import { useWorkspaceStore } from '../workspace/workspaceStore';
import { addDependencies, dependenciesOf } from './packageJson';
import { readText } from './projectFiles';
import { addRequirements, parseRequirements } from './requirements';
import { useTerminalStore } from './terminalStore';

export const requirementsOf = (projectId: string) =>
  parseRequirements(readText(projectId, 'requirements.txt') ?? '');

export const dependenciesFor = (projectId: string) =>
  dependenciesOf(readText(projectId, 'package.json'));

function writeProjectFile(projectId: string, path: string, text: string) {
  const file = fileAt(projectId, path);
  if (!file.exists) file.create();
  file.write(text);
  useWorkspaceStore.getState().refreshTree();
}

// pip runs inside the Python session; once it worked, the packages go into requirements.txt
// so the next session installs them again.
export function pip(projectId: string, action: 'install' | 'list', packages: string[]) {
  const terminal = useTerminalStore.getState();
  terminal.send({ type: 'pip', action, packages, requirements: requirementsOf(projectId) }, () => {
    if (action !== 'install') return;
    const text = readText(projectId, 'requirements.txt') ?? '';
    writeProjectFile(projectId, 'requirements.txt', addRequirements(text, packages));
    useTerminalStore.getState().print('info', 'Saved in requirements.txt');
  });
}

// npm only writes package.json: packages load from the esm.sh CDN when the code runs.
export async function npm(projectId: string, action: 'install' | 'list', packages: string[]) {
  const terminal = useTerminalStore.getState();
  if (action === 'list') {
    const deps = Object.entries(dependenciesFor(projectId));
    if (deps.length === 0) terminal.print('info', 'No packages in package.json yet.');
    for (const [name, version] of deps) terminal.print('stdout', `${name} ${version}`);
    return;
  }
  terminal.setMode('busy');
  try {
    const added: Record<string, string> = {};
    for (const name of packages) {
      const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}/latest`);
      if (!response.ok) throw new Error(`No package called "${name}" on npm.`);
      added[name] = `^${(await response.json()).version}`;
      terminal.print('info', `Added ${name}@${added[name].slice(1)}`);
    }
    const text = readText(projectId, 'package.json');
    writeProjectFile(projectId, 'package.json', addDependencies(text, added));
    terminal.print('info', 'Saved in package.json. Packages load from esm.sh when you run.');
  } catch (e) {
    terminal.print('stderr', e instanceof Error ? e.message : String(e));
  }
  useTerminalStore.getState().setMode('shell');
}
