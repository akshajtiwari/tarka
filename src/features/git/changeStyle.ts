import type { Colors } from '../../theme/colors';
import type { ChangeKind } from './changes';

// How a git change is shown everywhere (Git tab and explorer): a letter plus a color.
export const changeLetters: Record<ChangeKind, string> = {
  added: 'A',
  untracked: 'U',
  modified: 'M',
  deleted: 'D',
};

export function changeColor(kind: ChangeKind, colors: Colors): string {
  if (kind === 'modified') return colors.warning;
  if (kind === 'deleted') return colors.error;
  return colors.success; // added or new
}
