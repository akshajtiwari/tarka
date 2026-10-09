import { appendLines, useTerminalStore } from '../features/terminal/terminalStore';

const t = () => useTerminalStore.getState();

beforeEach(() => {
  useTerminalStore.setState({ projectId: null });
  t().enterProject('demo');
});

test('commands go to the runner one at a time, in order', () => {
  t().send({ type: 'repl', line: '1', requirements: [] });
  t().send({ type: 'input', text: 'a' });
  expect(t().command).toMatchObject({ id: 1, type: 'repl' });
  expect(t().queue).toHaveLength(1);
  t().onEvent({ type: 'handled', id: 1 });
  expect(t().command).toMatchObject({ id: 2, type: 'input' });
  t().onEvent({ type: 'handled', id: 1 }); // an old answer changes nothing
  expect(t().command?.id).toBe(2);
});

test('the prompt follows what the program is doing', () => {
  t().send({ type: 'run-js', file: 'a.js', files: {}, deps: {} });
  expect(t().mode).toBe('busy');
  t().onEvent({ type: 'ask', prompt: 'Name? ' });
  expect(t()).toMatchObject({ mode: 'ask', prompt: 'Name? ' });
  t().onEvent({ type: 'done', id: t().runId, ok: true });
  expect(t()).toMatchObject({ mode: 'shell', prompt: '$' });

  t().enterRepl();
  t().send({ type: 'repl', line: 'def f():', requirements: [] });
  t().onEvent({ type: 'done', id: t().runId, ok: true, more: true });
  expect(t()).toMatchObject({ mode: 'repl', prompt: '...' });
});

test('follow-up work (saving requirements.txt) runs only when the command worked', () => {
  const save = jest.fn();
  t().send({ type: 'pip', action: 'install', packages: ['x'], requirements: [] }, save);
  t().onEvent({ type: 'done', id: t().runId, ok: false });
  expect(save).not.toHaveBeenCalled();
  t().send({ type: 'pip', action: 'install', packages: ['x'], requirements: [] }, save);
  t().onEvent({ type: 'done', id: t().runId, ok: true });
  expect(save).toHaveBeenCalledTimes(1);
});

test("Run file while a program runs: the stopped run's done doesn't make the new run look idle", () => {
  t().send({ type: 'run-python', file: 'a.py', files: {}, requirements: [] });
  const old = t().runId;
  t().onEvent({ type: 'handled', id: old });
  t().send({ type: 'stop' });
  t().send({ type: 'run-python', file: 'a.py', files: {}, requirements: [] });

  t().onEvent({ type: 'done', id: old, ok: false }); // the runner ends the stopped run first
  expect(t().mode).toBe('busy');
  t().onEvent({ type: 'done', id: t().runId, ok: true });
  expect(t().mode).toBe('shell');
});

test('the screen keeps only the newest 5000 lines', () => {
  const many = Array.from({ length: 5003 }, (_, i) => ({
    stream: 'stdout' as const,
    text: String(i),
  }));
  const kept = appendLines([], many);
  expect(kept).toHaveLength(5000);
  expect(kept[0].text).toBe('3');
});
