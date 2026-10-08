import { useEditorCommands } from '../features/editor/editorCommand';

test('every command gets a new id, even the same key twice', () => {
  const { send } = useEditorCommands.getState();
  send({ name: 'insert', text: '{' });
  const first = useEditorCommands.getState().command!;
  send({ name: 'insert', text: '{' });
  const second = useEditorCommands.getState().command!;
  expect(second.id).toBe(first.id + 1);
  expect(second).toMatchObject({ name: 'insert', text: '{' });
});
