// projectService.js
import { getAdapter } from '../config/dataSource';

export const getProjects = async () => {
  const adapter = getAdapter();
  return await adapter.getProjects();
}

export const createProject = async (data) => {
  const adapter = getAdapter();
  return await adapter.createProject(data);
}