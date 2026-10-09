import { isDirty, useEditorStore } from '../features/editor/editorStore';

beforeEach(() => useEditorStore.getState().reset());

test('opening a file makes it active, opening it again keeps unsaved edits', () => {
  const { openFile, updateText } = useEditorStore.getState();
  openFile('main.js', 'a');
  updateText('main.js', 'ab');
  openFile('main.js', 'a');

  const { files, activePath } = useEditorStore.getState();
  expect(activePath).toBe('main.js');
  expect(files).toEqual([{ path: 'main.js', text: 'ab', savedText: 'a', locked: false }]);
  expect(isDirty(files[0])).toBe(true);
});

test('saving clears the dirty state', () => {
  const { openFile, updateText, markSaved } = useEditorStore.getState();
  openFile('main.js', 'a');
  updateText('main.js', 'ab');
  markSaved('main.js', 'ab');
  expect(isDirty(useEditorStore.getState().files[0])).toBe(false);
});

test('closing the active file switches to the last open one', () => {
  const { openFile, closeFile } = useEditorStore.getState();
  openFile('a.js', '');
  openFile('b.js', '');
  closeFile('b.js');
  expect(useEditorStore.getState().activePath).toBe('a.js');
  closeFile('a.js');
  expect(useEditorStore.getState().activePath).toBeNull();
});

test('renaming a folder moves the tabs inside it', () => {
  const { openFile, renamePath } = useEditorStore.getState();
  openFile('src/a.js', '');
  openFile('srcx.js', '');
  renamePath('src', 'lib');
  const state = useEditorStore.getState();
  expect(state.files.map((f) => f.path)).toEqual(['lib/a.js', 'srcx.js']);
  expect(state.activePath).toBe('srcx.js');
});

test('deleting a folder closes the tabs inside it', () => {
  const { openFile, closePathsUnder } = useEditorStore.getState();
  openFile('keep.js', '');
  openFile('src/a.js', '');
  closePathsUnder('src');
  const state = useEditorStore.getState();
  expect(state.files.map((f) => f.path)).toEqual(['keep.js']);
  expect(state.activePath).toBe('keep.js');
});

test('entering another project closes the old tabs, re-entering the same keeps them', () => {
  const { enterProject, openFile } = useEditorStore.getState();
  enterProject('a');
  openFile('main.js', 'x');
  enterProject('a');
  expect(useEditorStore.getState().files).toHaveLength(1);
  enterProject('b');
  expect(useEditorStore.getState().files).toEqual([]);
});
