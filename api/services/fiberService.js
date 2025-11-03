// projectService.js
import { getAdapter } from '../config/dataSource';

export const getFibers = async (projectId, parentId) => {
  const adapter = getAdapter();
  return await adapter.getFibers(projectId, parentId);
}

export const createFiber = async (data) => {
  const adapter = getAdapter();
  return await adapter.createFiber(data);
}

