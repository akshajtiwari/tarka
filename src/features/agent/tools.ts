import type { ToolSpec } from './types';

// The tools the agent can use. Paths are relative to the project root, like "src/main.py".
// Changing tools (write_file, delete_file) always ask the user first.
export const toolSpecs: ToolSpec[] = [
  {
    name: 'list_files',
    description: 'List every file in the project (relative paths).',
    parameters: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'read_file',
    description: 'Read a text file from the project.',
    parameters: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] },
  },
  {
    name: 'search_text',
    description: 'Find lines containing some text in all project files. Returns path:line: text.',
    parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] },
  },
  {
    name: 'write_file',
    description: 'Create or replace a whole text file. The user sees a diff and must approve it.',
    parameters: {
      type: 'object',
      properties: { path: { type: 'string' }, content: { type: 'string' } },
      required: ['path', 'content'],
    },
  },
  {
    name: 'delete_file',
    description: 'Delete a file. The user must approve it.',
    parameters: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] },
  },
  {
    name: 'git_status',
    description: 'Show which files changed since the last git commit.',
    parameters: { type: 'object', properties: {}, required: [] },
  },
];

export const SYSTEM_PROMPT = `You are a coding assistant inside TARKA, a code editor on the user's phone.
You work on the files of the currently open project using the tools.
Read the relevant files before changing them. Keep changes small and explain them in one or two sentences.
write_file replaces the whole file, so always send the complete new content.
The user approves every write and delete, and may reject one: then ask what they want instead.
You cannot run code; tell the user to use the Run tab when they should test something.`;
