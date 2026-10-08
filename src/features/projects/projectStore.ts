import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// `id` is also the folder name on disk and never changes. Renaming only changes `name`.
export type Project = {
  id: string;
  name: string;
  createdAt: number;
  openedAt: number;
};

type ProjectState = {
  projects: Project[];
  addProject: (project: Project) => void;
  renameProject: (id: string, name: string) => void;
  removeProject: (id: string) => void;
  markOpened: (id: string) => void;
};

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      projects: [],
      addProject: (project) => set((state) => ({ projects: [...state.projects, project] })),
      renameProject: (id, name) =>
        set((state) => ({
          projects: state.projects.map((p) => (p.id === id ? { ...p, name } : p)),
        })),
      removeProject: (id) =>
        set((state) => ({ projects: state.projects.filter((p) => p.id !== id) })),
      markOpened: (id) =>
        set((state) => ({
          projects: state.projects.map((p) => (p.id === id ? { ...p, openedAt: Date.now() } : p)),
        })),
    }),
    { name: 'projects', storage: createJSONStorage(() => AsyncStorage) },
  ),
);

// Most recently opened first.
export function sortByRecent(projects: Project[]): Project[] {
  return [...projects].sort((a, b) => b.openedAt - a.openedAt);
}
