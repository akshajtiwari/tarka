import { gitFs } from '../../lib/gitFs';
import { fileAt, listEntries, readForSearch, safeParts } from '../../lib/projectFs';
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

// A path from the model: never outside the project (safeParts refuses ".."), never inside .git,
// and spelled one way ("./a.js" becomes "a.js") so it matches open tabs.
function projectPath(input: Record<string, unknown>): string {
  const parts = safeParts(requireString(input, 'path').replace(/^(\.\/)+/, ''));
  if (parts.length === 0) throw new Error('A file path is needed.');
  if (parts[0] === '.git') throw new Error("The .git folder is git's own data and is off limits.");
  return parts.join('/');
}

// The open tab, if this file is open in this project's editor.
function openTab(projectId: string, path: string) {
  const editor = useEditorStore.getState();
  if (editor.projectId !== projectId) return undefined;
  return editor.files.find((f) => f.path === path);
}

async function execute(projectId: string, call: ToolCall): Promise<string> {
  const { input } = call;
  const files = () => allFilePaths((p) => listEntries(projectId, p));
  switch (call.name) {
    case 'list_files':
      return files().join('\n') || '(no files)';
    case 'read_file': {
      const text = readForSearch(projectId, projectPath(input));
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
      const path = projectPath(input);
      const content = requireString(input, 'content');
      const file = fileAt(projectId, path);
      const before = file.exists ? file.textSync() : '';
      if (
        !(await useApprovalStore.getState().ask({ kind: 'write', path, before, after: content }))
      ) {
        return 'The user rejected this change.';
      }
      // The user may have typed in this file while the card was open: never overwrite that.
      const tab = openTab(projectId, path);
      if (tab && tab.text !== tab.savedText)
        throw new Error('The user has unsaved edits in this file. Nothing was written.');
      if ((file.exists ? file.textSync() : '') !== before)
        throw new Error('The file changed while waiting for approval. Read it again first.');
      if (!file.exists) file.create({ intermediates: true });
      file.write(content);
      if (tab) useEditorStore.getState().reloadFile(path, content);
      useWorkspaceStore.getState().refreshTree();
      return `Wrote ${path}.`;
    }
    case 'delete_file': {
      const path = projectPath(input);
      if (!fileAt(projectId, path).exists) throw new Error(`Not a file: ${path}`);
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
    if (output.length <= MAX_OUTPUT) return { id: call.id, output, isError: false };
    const cut = `${output.slice(0, MAX_OUTPUT)}\n[cut after ${MAX_OUTPUT} characters]`;
    return { id: call.id, output: cut, isError: false };
  } catch (e) {
    return { id: call.id, output: e instanceof Error ? e.message : String(e), isError: true };
  }
}
