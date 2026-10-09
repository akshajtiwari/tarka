import { gitFs } from '../../lib/gitFs';
import { fileAt, listEntries, readForSearch } from '../../lib/projectFs';
import { searchText } from '../../lib/textSearch';
import { allFilePaths } from '../../lib/walk';
import { useEditorStore } from '../editor/editorStore';
import { deleteEntry } from '../explorer/fileOps';
import * as gitService from '../git/gitService';
import { repoDir } from '../git/repo';
import { useWorkspaceStore } from '../workspace/workspaceStore';
import { useApprovalStore } from './approvalStore';
import type { ToolCall, ToolResult } from './types';

const MAX_OUTPUT = 20_000; // characters sent back to the model per tool call

// Tool input comes from the model, so check it like any outside input.
function requireString(input: Record<string, unknown>, key: string): string {
  const value = input[key];
  if (typeof value !== 'string') throw new Error(`"${key}" must be a text value.`);
  return value;
}

async function execute(projectId: string, call: ToolCall): Promise<string> {
  const { input } = call;
  const files = () => allFilePaths((p) => listEntries(projectId, p));
  switch (call.name) {
    case 'list_files':
      return files().join('\n') || '(no files)';
    case 'read_file': {
      const text = readForSearch(projectId, requireString(input, 'path'));
      if (text === null)
        throw new Error('Not a readable text file (missing, binary or over 1 MB).');
      return text;
    }
    case 'search_text': {
      const matches = searchText(
        files(),
        (p) => readForSearch(projectId, p),
        requireString(input, 'query'),
        { caseSensitive: false, limit: 50 },
      );
      return matches.map((m) => `${m.path}:${m.line}: ${m.text}`).join('\n') || '(no matches)';
    }
    case 'write_file': {
      const path = requireString(input, 'path');
      const content = requireString(input, 'content');
      const file = fileAt(projectId, path); // refuses paths outside the project
      const before = file.exists ? file.textSync() : '';
      if (
        !(await useApprovalStore.getState().ask({ kind: 'write', path, before, after: content }))
      ) {
        return 'The user rejected this change.';
      }
      if (!file.exists) file.create({ intermediates: true });
      file.write(content);
      useEditorStore.getState().reloadFile(path, content);
      useWorkspaceStore.getState().refreshTree();
      return `Wrote ${path}.`;
    }
    case 'delete_file': {
      const path = requireString(input, 'path');
      const before = readForSearch(projectId, path) ?? '';
      if (!(await useApprovalStore.getState().ask({ kind: 'delete', path, before, after: '' }))) {
        return 'The user rejected deleting this file.';
      }
      deleteEntry(projectId, path, false);
      return `Deleted ${path}.`;
    }
    case 'git_status': {
      const dir = repoDir(projectId);
      if (!(await gitService.isRepo(gitFs, dir))) return 'This project is not a git repository.';
      const { staged, unstaged } = await gitService.getChanges(gitFs, dir);
      const lines = [
        ...staged.map((c) => `staged ${c.kind}: ${c.path}`),
        ...unstaged.map((c) => `${c.kind}: ${c.path}`),
      ];
      return lines.join('\n') || 'No changes since the last commit.';
    }
    default:
      throw new Error(`Unknown tool: ${call.name}`);
  }
}

// Runs one tool call. Failures go back to the model as an error result instead of crashing.
export async function runTool(projectId: string, call: ToolCall): Promise<ToolResult> {
  try {
    const output = await execute(projectId, call);
    return { id: call.id, output: output.slice(0, MAX_OUTPUT), isError: false };
  } catch (e) {
    return { id: call.id, output: e instanceof Error ? e.message : String(e), isError: true };
  }
}
