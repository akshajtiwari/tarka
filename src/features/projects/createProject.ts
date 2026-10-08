import { createProjectFolder, existingProjectFolders } from './projectFolder';
import { makeProjectId } from './projectId';
import { useProjectStore } from './projectStore';
import { templates } from './templates';

// Makes the folder with the template's files and adds the project to the list.
// Returns the new project's id.
export function createProject(name: string, templateId: string): string {
  const template = templates.find((t) => t.id === templateId) ?? templates[0];
  const { projects, addProject } = useProjectStore.getState();
  const taken = [...projects.map((p) => p.id), ...existingProjectFolders()];
  const id = makeProjectId(name, taken);

  createProjectFolder(id, template.files);

  const now = Date.now();
  addProject({ id, name: name.trim() || id, createdAt: now, openedAt: now });
  return id;
}
