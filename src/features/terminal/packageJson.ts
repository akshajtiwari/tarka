// package.json "dependencies": which JavaScript packages (and versions) the project uses.

export function dependenciesOf(text: string | null): Record<string, string> {
  if (!text) return {};
  try {
    const deps = JSON.parse(text).dependencies;
    return deps && typeof deps === 'object' ? deps : {};
  } catch {
    return {};
  }
}

// Adds packages and keeps everything else in the file. A missing file starts a new one.
export function addDependencies(text: string | null, added: Record<string, string>): string {
  let json: Record<string, unknown> = {};
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error('package.json is not valid JSON. Fix it first, then try again.');
    }
  }
  const dependencies = { ...(json.dependencies as Record<string, string>), ...added };
  return JSON.stringify({ ...json, dependencies }, null, 2) + '\n';
}
