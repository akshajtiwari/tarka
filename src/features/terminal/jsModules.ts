import { transform } from 'sucrase';

// JavaScript and TypeScript in the terminal run as small CommonJS modules: `import` becomes
// `require`, local files ("./util") come from the project, and packages ("lodash") load from
// esm.sh, a CDN that serves npm packages as browser modules.

export function toCommonJs(code: string, isTs: boolean): string {
  const transforms: ('typescript' | 'imports')[] = isTs ? ['typescript', 'imports'] : ['imports'];
  return transform(code, { transforms, preserveDynamicImport: true }).code;
}

// Every file as CommonJS. A file that doesn't compile becomes one that throws its error when
// it is required, so a half-written file elsewhere in the project doesn't stop this run.
export function toCommonJsFiles(files: Record<string, string>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [path, code] of Object.entries(files)) {
    try {
      result[path] = toCommonJs(code, path.endsWith('.ts'));
    } catch (error) {
      const message = `${path}: ${error instanceof Error ? error.message : String(error)}`;
      result[path] = `throw new SyntaxError(${JSON.stringify(message)});`;
    }
  }
  return result;
}

// Node.js's own modules: esm.sh can't serve them, so the worker suggests Termux instead.
export const NODE_ONLY = [
  'fs',
  'path',
  'os',
  'child_process',
  'http',
  'https',
  'net',
  'crypto',
  'process',
];

// The packages a module asks for: require("lodash") -> "lodash". Local "./x" files and Node's
// own modules are skipped.
export function packagesRequired(commonJs: string): string[] {
  const found = new Set<string>();
  for (const match of commonJs.matchAll(/require\(\s*['"]([^'"]+)['"]\s*\)/g)) {
    const spec = match[1];
    const local = spec.startsWith('.') || spec.startsWith('/');
    if (!local && !spec.startsWith('node:') && !NODE_ONLY.includes(spec)) found.add(spec);
  }
  return [...found];
}

// "@scope/pkg/sub" -> "@scope/pkg"; "lodash/fp" -> "lodash"
export function packageOf(spec: string): string {
  const parts = spec.split('/');
  return spec.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
}

// Pinned to the version in package.json when there is one.
export function esmUrl(spec: string, deps: Record<string, string>): string {
  const name = packageOf(spec);
  const version = deps[name]?.replace(/^[\^~]/, '');
  const subpath = spec.slice(name.length);
  return `https://esm.sh/${name}${version ? `@${version}` : ''}${subpath}`;
}
