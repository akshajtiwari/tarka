import { saveAllDirty } from '../features/editor/fileActions';
import { useEditorStore } from '../features/editor/editorStore';
import { fileAt } from '../lib/projectFs';

const mockWrite = jest.fn();
jest.mock('../lib/projectFs', () => ({ fileAt: jest.fn(() => ({ write: mockWrite })) }));

test("open tabs are saved into their own project, never another one's folder", () => {
  const editor = useEditorStore.getState();
  editor.enterProject('a');
  editor.openFile('main.py', 'old');
  editor.updateText('main.py', 'new');

  saveAllDirty('b'); // a screen of project b, still mounted for a moment
  expect(mockWrite).not.toHaveBeenCalled();

  saveAllDirty('a');
  expect(fileAt).toHaveBeenCalledWith('a', 'main.py');
  expect(mockWrite).toHaveBeenCalledWith('new');
});
