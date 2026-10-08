const MB = 1024 * 1024;

// Big files make a phone editor slow, so we limit what can be edited.
export type OpenMode = 'edit' | 'read' | 'refuse';

export function openModeFor(sizeInBytes: number): OpenMode {
  if (sizeInBytes > 10 * MB) return 'refuse';
  if (sizeInBytes > 2 * MB) return 'read';
  return 'edit';
}
