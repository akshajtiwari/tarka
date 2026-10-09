import { transform } from 'sucrase';

// JavaScript and TypeScript in the terminal run as small CommonJS modules: `import` becomes
// `require`, local files ("./util") come from the project, and packages ("lodash") load from
// esm.sh, a CDN that serves npm packages as browser modules.

export function toCommonJs(code: string, isTs: boolean): string {
  const transforms: ('typescript' | 'imports')[] = isTs ? ['typescript', 'imports'] : ['imports'];
  return transform(code, { transforms, preserveDynamicImport: true }).code;
}

// The packages a module asks for: require("lodash") -> "lodash" (local "./x" files are skipped).
export function packagesRequired(commonJs: string): string[] {
  const found = new Set<string>();
  for (const match of commonJs.matchAll(/require\(\s*['"]([^'"]+)['"]\s*\)/g)) {
    if (!match[1].startsWith('.') && !match[1].startsWith('/')) found.add(match[1]);
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
