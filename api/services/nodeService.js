// projectService.js
import { getAdapter } from '../config/dataSource';

export const getNodes = async (projectId) => {
  const adapter = getAdapter();
  return await adapter.getNodes(projectId);
}

export const createNode = async (data) => {
  const adapter = getAdapter();
  return await adapter.createNode(data);
}

