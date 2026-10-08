import { create } from 'zustand';

// State of the open workspace screen (not saved between launches).
type WorkspaceState = {
  explorerOpen: boolean;
  treeVersion: number; // goes up whenever files change, so the explorer re-reads the folder
  setExplorerOpen: (open: boolean) => void;
  refreshTree: () => void;
};

export const useWorkspaceStore = create<WorkspaceState>()((set) => ({
  explorerOpen: false,
  treeVersion: 0,
  setExplorerOpen: (explorerOpen) => set({ explorerOpen }),
  refreshTree: () => set((s) => ({ treeVersion: s.treeVersion + 1 })),
}));
