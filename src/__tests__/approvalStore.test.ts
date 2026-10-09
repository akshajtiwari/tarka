import { useApprovalStore } from '../features/agent/approvalStore';

test('the agent waits until the user answers', async () => {
  const waiting = useApprovalStore
    .getState()
    .ask({ kind: 'write', path: 'a.js', before: '', after: 'x' });
  expect(useApprovalStore.getState().pending?.path).toBe('a.js');
  useApprovalStore.getState().respond(true);
  await expect(waiting).resolves.toBe(true);
  expect(useApprovalStore.getState().pending).toBeNull();
});
