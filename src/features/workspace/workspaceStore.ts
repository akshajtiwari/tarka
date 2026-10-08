import { create } from 'zustand';

// State of the open workspace screen (not saved between launches).
type WorkspaceState = {
  explorerOpen: boolean;
  activeFile: string | null; // relative path of the file shown in the editor
  setExplorerOpen: (open: boolean) => void;
  openFile: (path: string) => void;
  reset: () => void;
};

export const useWorkspaceStore = create<WorkspaceState>()((set) => ({
  explorerOpen: false,
  activeFile: null,
  setExplorerOpen: (explorerOpen) => set({ explorerOpen }),
  openFile: (path) => set({ activeFile: path, explorerOpen: false }),
  reset: () => set({ explorerOpen: false, activeFile: null }),
}));
