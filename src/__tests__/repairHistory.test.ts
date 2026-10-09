import { repairHistory } from '../features/agent/repairHistory';
import type { Turn } from '../features/agent/types';

test('open tool calls get a "stopped" result so the next message is valid', () => {
  const history: Turn[] = [
    { role: 'user', text: 'go' },
    { role: 'assistant', text: '', toolCalls: [{ id: 'a', name: 'read_file', input: {} }] },
  ];
  repairHistory(history);
  expect(history.at(-1)).toEqual({
    role: 'tool',
    results: [{ id: 'a', output: 'Stopped before this ran.', isError: true }],
  });
});

test('a finished conversation is left alone', () => {
  const history: Turn[] = [
    { role: 'user', text: 'hi' },
    { role: 'assistant', text: 'hello', toolCalls: [] },
  ];
  repairHistory(history);
  expect(history).toHaveLength(2);
});
