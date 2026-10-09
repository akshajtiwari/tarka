import { fromAnthropic, toAnthropicMessages } from '../features/agent/providers/anthropicMessages';
import {
  fromOpenAI,
  toOpenAIMessages,
  toOpenAITools,
} from '../features/agent/providers/openaiMessages';
import type { Turn } from '../features/agent/types';

const history: Turn[] = [
  { role: 'user', text: 'fix main.py' },
  {
    role: 'assistant',
    text: 'Reading it.',
    toolCalls: [{ id: 't1', name: 'read_file', input: { path: 'main.py' } }],
    raw: [
      { type: 'text', text: 'Reading it.' },
      { type: 'tool_use', id: 't1', name: 'read_file', input: { path: 'main.py' } },
    ],
  },
  { role: 'tool', results: [{ id: 't1', output: 'print(1)', isError: false }] },
];

test('anthropic: assistant turns are sent back unchanged, tool results as user turns', () => {
  const messages = toAnthropicMessages(history);
  expect(messages[1]).toEqual({
    role: 'assistant',
    content: history[1].role === 'assistant' ? history[1].raw : null,
  });
  expect(messages[2]).toEqual({
    role: 'user',
    content: [{ type: 'tool_result', tool_use_id: 't1', content: 'print(1)', is_error: false }],
  });
});

test('anthropic: a turn from the other provider is rebuilt, never sent empty', () => {
  const fromOpenAITurn: Turn[] = [{ ...history[1], raw: undefined } as Turn];
  expect(toAnthropicMessages(fromOpenAITurn)[0].content).toEqual(
    history[1].role === 'assistant' ? history[1].raw : null,
  );
  const empty: Turn[] = [{ role: 'assistant', text: '', toolCalls: [] }];
  expect(toAnthropicMessages(empty)[0].content).toEqual([{ type: 'text', text: '(no reply)' }]);
});

test('anthropic: tool calls, refusals and cut-off replies', () => {
  const content = [{ type: 'tool_use', id: 'x', name: 'list_files', input: {} }] as never;
  expect(fromAnthropic(content, 'tool_use')).toMatchObject({
    stop: 'tools',
    toolCalls: [{ id: 'x', name: 'list_files' }],
  });
  expect(fromAnthropic(content, 'refusal').stop).toBe('refused');
  expect(fromAnthropic(content, 'max_tokens').stop).toBe('too-long');
});

test('openai: system first, tool calls with JSON arguments, one tool message per result', () => {
  const messages = toOpenAIMessages('be nice', history);
  expect(messages[0]).toEqual({ role: 'system', content: 'be nice' });
  expect(messages[2]).toMatchObject({
    role: 'assistant',
    tool_calls: [{ id: 't1', function: { name: 'read_file', arguments: '{"path":"main.py"}' } }],
  });
  expect(messages[3]).toEqual({ role: 'tool', tool_call_id: 't1', content: 'print(1)' });
});

test('openai: unreadable arguments do not crash', () => {
  const reply = fromOpenAI({
    finish_reason: 'tool_calls',
    message: {
      content: null,
      tool_calls: [
        { id: 'a', type: 'function', function: { name: 'read_file', arguments: '{bad' } },
      ],
    },
  });
  expect(reply.toolCalls[0].input).toEqual({ _unreadable_arguments: '{bad' });
  expect(reply.stop).toBe('tools');
});

test('openai format: a thought signature on a tool call goes back unchanged', () => {
  const signature = { google: { thought_signature: 'abc' } };
  const reply = fromOpenAI({
    finish_reason: 'tool_calls',
    message: {
      content: null,
      tool_calls: [
        {
          id: 'c1',
          type: 'function',
          function: { name: 'read_file', arguments: '{"path":"a.py"}' },
          extra_content: signature,
        },
      ],
    },
  });
  const turn: Turn = { role: 'assistant', text: '', toolCalls: reply.toolCalls, raw: reply.raw };
  const sent = toOpenAIMessages('sys', [turn])[1];
  expect(sent).toMatchObject({ tool_calls: [{ id: 'c1', extra_content: signature }] });
});

test('openai format: tools without inputs have no schema (Gemini refuses empty ones)', () => {
  const tools = toOpenAITools([
    {
      name: 'git_status',
      description: 'd',
      parameters: { type: 'object', properties: {}, required: [] },
    },
    {
      name: 'read_file',
      description: 'd',
      parameters: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] },
    },
  ]);
  expect(tools[0].function).not.toHaveProperty('parameters');
  expect(tools[1].function).toHaveProperty('parameters');
});
