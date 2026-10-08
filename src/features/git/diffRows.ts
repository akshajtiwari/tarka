import { structuredPatch } from 'diff';

// One line in the diff view. "gap" separates parts of the file that did not change.
export type DiffRow = {
  kind: 'add' | 'del' | 'same' | 'gap';
  text: string;
  oldNo?: number; // line number in the last commit
  newNo?: number; // line number in the file now
};

// Compares the last committed text with the current text, keeping 3 unchanged lines
// around each change (like `git diff`).
export function diffRows(oldText: string, newText: string): DiffRow[] {
  const patch = structuredPatch('a', 'b', oldText, newText, '', '', { context: 3 });
  const rows: DiffRow[] = [];

  for (const hunk of patch.hunks) {
    rows.push({ kind: 'gap', text: `lines ${hunk.newStart}–${hunk.newStart + hunk.newLines - 1}` });
    let oldNo = hunk.oldStart;
    let newNo = hunk.newStart;
    for (const line of hunk.lines) {
      const text = line.slice(1);
      if (line.startsWith('+')) rows.push({ kind: 'add', text, newNo: newNo++ });
      else if (line.startsWith('-')) rows.push({ kind: 'del', text, oldNo: oldNo++ });
      else if (line.startsWith(' '))
        rows.push({ kind: 'same', text, oldNo: oldNo++, newNo: newNo++ });
      // lines starting with "\" ("No newline at end of file") are skipped
    }
  }
  return rows;
}
