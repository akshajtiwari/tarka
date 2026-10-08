// Turns a project name into a safe folder name: "My App!" -> "my-app".
// Adds -2, -3, ... when that folder name is already taken.
export function makeProjectId(name: string, takenIds: string[]): string {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'project';

  let id = base;
  let n = 2;
  while (takenIds.includes(id)) {
    id = `${base}-${n}`;
    n++;
  }
  return id;
}
