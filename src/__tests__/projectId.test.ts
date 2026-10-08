import { makeProjectId } from '../features/projects/projectId';

test('turns a name into a folder-safe id', () => {
  expect(makeProjectId('My App!', [])).toBe('my-app');
  expect(makeProjectId('  hello  world ', [])).toBe('hello-world');
});

test('falls back to "project" when nothing usable is left', () => {
  expect(makeProjectId('!!!', [])).toBe('project');
});

test('adds a number when the id is taken', () => {
  expect(makeProjectId('demo', ['demo'])).toBe('demo-2');
  expect(makeProjectId('demo', ['demo', 'demo-2'])).toBe('demo-3');
});
