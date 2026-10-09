import { MAX_STEPS, runAgent, type AgentEvent } from '../features/agent/loop';
import type { ModelReply, Provider, ToolCall, Turn } from '../features/agent/types';

// A fake model that returns scripted replies, one per call.
function scripted(replies: ModelReply[]): Provider {
  let i = 0;
  return {
    reply: async (_h, _t, onText) => {
      const reply = replies[Math.min(i++, replies.length - 1)];
      if (reply.text) onText(reply.text);
      return reply;
    },
  };
}
const call = (id: string, input: Record<string, unknown> = { path: 'a.js' }): ToolCall => ({
  id,
  name: 'read_file',
  input,
});

async function run(provider: Provider, signal = new AbortController().signal) {
  const events: AgentEvent[] = [];
  const history: Turn[] = [{ role: 'user', text: 'hi' }];
  const ran: string[] = [];
  await runAgent({
    provider,
    history,
    tools: [],
    signal,
    runTool: async (c) => {
      ran.push(c.id);
      return { id: c.id, output: 'ok', isError: false };
    },
    onEvent: (e) => events.push(e),
  });
  return { events, history, ran, last: events.at(-1) };
}

test('runs the tools the model asks for, then stops on a final answer', async () => {
  const { ran, last, history } = await run(
    scripted([
      { text: '', toolCalls: [call('1')], stop: 'tools' },
      { text: 'all good', toolCalls: [], stop: 'done' },
    ]),
  );
  expect(ran).toEqual(['1']);
  expect(last).toEqual({ type: 'stopped', reason: 'Done.' });
  expect(history.map((t) => t.role)).toEqual(['user', 'assistant', 'tool', 'assistant']);
});

test('stops when the same call repeats 3 times', async () => {
  const { last, ran } = await run(scripted([{ text: '', toolCalls: [call('x')], stop: 'tools' }]));
  expect(ran).toHaveLength(2);
  expect(last).toMatchObject({ reason: expect.stringContaining('same input 3 times') });
});

test('stops after the step budget', async () => {
  let n = 0;
  const changing: Provider = {
    reply: async () => ({
      text: '',
      toolCalls: [call(String(n), { path: `f${n++}` })],
      stop: 'tools',
    }),
  };
  const { last, ran } = await run(changing);
  expect(ran).toHaveLength(MAX_STEPS);
  expect(last).toMatchObject({ reason: `Stopped after ${MAX_STEPS} steps.` });
});

test('a refusal ends the run without running tools', async () => {
  const { ran, last } = await run(
    scripted([{ text: '', toolCalls: [call('1')], stop: 'refused' }]),
  );
  expect(ran).toEqual([]);
  expect(last).toMatchObject({ reason: 'The model declined this request.' });
});

test('Stop ends the run before the next model call', async () => {
  const controller = new AbortController();
  controller.abort();
  const { last } = await run(
    scripted([{ text: 'x', toolCalls: [], stop: 'done' }]),
    controller.signal,
  );
  expect(last).toEqual({ type: 'stopped', reason: 'Stopped by you.' });
});
