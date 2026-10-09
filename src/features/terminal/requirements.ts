// requirements.txt: one Python package per line, like "requests" or "numpy==2.1.0".
// Comments (#) and pip options (-r, --index-url) are skipped.

// "Requests_OAuthlib>=1" -> "requests-oauthlib", so the same package is never listed twice.
export function packageName(spec: string): string {
  return spec
    .split(/[<>=!~;\[\s]/)[0]
    .trim()
    .toLowerCase()
    .replace(/[_.]+/g, '-');
}

export function parseRequirements(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.split('#')[0].trim())
    .filter((line) => line && !line.startsWith('-'));
}

// Adds packages, replacing an older line for the same package (numpy -> numpy==2.1.0).
export function addRequirements(text: string, packages: string[]): string {
  const added = new Set(packages.map(packageName));
  const kept = text
    .split('\n')
    .filter((line) => line.trim() && !added.has(packageName(line.split('#')[0])));
  return [...kept, ...packages].join('\n') + '\n';
}
