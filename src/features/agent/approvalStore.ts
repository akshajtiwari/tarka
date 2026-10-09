import { create } from 'zustand';

// A change the agent wants to make, waiting for the user's Approve or Reject.
export type Approval = {
  kind: 'write' | 'delete';
  path: string;
  before: string; // current text ("" for a new file)
  after: string; // proposed text ("" when deleting)
};

type ApprovalState = {
  pending: Approval | null;
  answer: ((approved: boolean) => void) | null;
  ask: (approval: Approval) => Promise<boolean>;
  respond: (approved: boolean) => void;
};

export const useApprovalStore = create<ApprovalState>()((set, get) => ({
  pending: null,
  answer: null,
  // The agent loop waits on this promise until the user taps a button.
  ask: (approval) => new Promise<boolean>((resolve) => set({ pending: approval, answer: resolve })),
  respond: (approved) => {
    get().answer?.(approved);
    set({ pending: null, answer: null });
  },
}));
