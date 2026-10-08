import { create } from 'zustand';

// State of the open workspace screen (not saved between launches).
type WorkspaceState = {
  explorerOpen: boolean;
  setExplorerOpen: (open: boolean) => void;
};

export const useWorkspaceStore = create<WorkspaceState>()((set) => ({
  explorerOpen: false,
  setExplorerOpen: (explorerOpen) => set({ explorerOpen }),
}));
