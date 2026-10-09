import { useRef, useState } from 'react';

import { useApprovalStore } from './approvalStore';
import { runAgent, type AgentEvent } from './loop';
import { makeProvider } from './makeProvider';
import { repairHistory } from './repairHistory';
import { runTool } from './runTool';
import { toolSpecs } from './tools';
import type { Turn } from './types';

export type TimelineItem =
  | { kind: 'user'; text: string }
  | { kind: 'assistant'; text: string }
  | { kind: 'tool'; id: string; name: string; detail: string; status: 'running' | 'done' | 'error' }
  | { kind: 'note'; text: string };

// One agent conversation for the open project: what the timeline shows, plus send and stop.
export function useAgent(projectId: string) {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [running, setRunning] = useState(false);
  const history = useRef<Turn[]>([]);
  const controller = useRef<AbortController | null>(null);

  const add = (item: TimelineItem) => setItems((old) => [...old, item]);

  function onEvent(event: AgentEvent) {
    if (event.type === 'text') {
      // Stream text into the last answer bubble, or start a new one.
      setItems((old) => {
        const last = old.at(-1);
        if (last?.kind === 'assistant')
          return [...old.slice(0, -1), { ...last, text: last.text + event.delta }];
        return [...old, { kind: 'assistant', text: event.delta }];
      });
    } else if (event.type === 'tool-start') {
      const detail = String(event.call.input.path ?? event.call.input.query ?? '');
      add({ kind: 'tool', id: event.call.id, name: event.call.name, detail, status: 'running' });
    } else if (event.type === 'tool-end') {
      const status = event.result.isError ? 'error' : 'done';
      setItems((old) =>
        old.map((i) => (i.kind === 'tool' && i.id === event.call.id ? { ...i, status } : i)),
      );
    } else {
      add({ kind: 'note', text: event.reason });
    }
  }

  async function send(text: string) {
    if (running || !text.trim()) return;
    add({ kind: 'user', text: text.trim() });
    history.current.push({ role: 'user', text: text.trim() });
    setRunning(true);
    controller.current = new AbortController();
    try {
      const provider = await makeProvider();
      await runAgent({
        provider,
        history: history.current,
        tools: toolSpecs,
        runTool: (call) => runTool(projectId, call),
        onEvent,
        signal: controller.current.signal,
      });
    } catch (e) {
      add({
        kind: 'note',
        text: controller.current.signal.aborted
          ? 'Stopped by you.'
          : `Error: ${e instanceof Error ? e.message : String(e)}`,
      });
    }
    repairHistory(history.current);
    setRunning(false);
  }

  function stop() {
    controller.current?.abort();
    useApprovalStore.getState().respond(false); // a waiting approval counts as rejected
  }

  function clear() {
    if (running) return;
    history.current = [];
    setItems([]);
  }

  return { items, running, send, stop, clear };
}
