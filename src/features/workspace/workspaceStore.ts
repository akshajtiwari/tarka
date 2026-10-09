import { create } from 'zustand';

import { useGitStatusStore } from '../git/gitStatusStore';

// State of the open workspace screen (not saved between launches).
type WorkspaceState = {
  explorerOpen: boolean;
  explorerShown: boolean; // fully open: its opening animation has finished
  treeVersion: number; // goes up whenever files change, so the explorer re-reads the folder
  setExplorerOpen: (open: boolean) => void;
  setExplorerShown: (shown: boolean) => void;
  refreshTree: () => void;
};

export const useWorkspaceStore = create<WorkspaceState>()((set) => ({
  explorerOpen: false,
  explorerShown: false,
  treeVersion: 0,
  setExplorerOpen: (explorerOpen) => set({ explorerOpen }),
  setExplorerShown: (explorerShown) => set({ explorerShown }),
  refreshTree: () => {
    set((s) => ({ treeVersion: s.treeVersion + 1 }));
    useGitStatusStore.getState().markStale(); // files changed, so git status may have too
  },
}));
