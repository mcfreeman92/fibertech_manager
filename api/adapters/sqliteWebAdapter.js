import Dexie from 'dexie';

// Crear instancia de la base de datos
const db = new Dexie('FiberDatabase');

// Definir esquema de la base de datos
db.version(1).stores({
  projects: '++id, name, creation_date, modified_date, main_node_id, deleted, metadata',
  nodes_types: '++id, name, type',
  nodes: '++id, label, projectId, typeId, description, createdDate, modifiedDate, deleted',
  fibers: '++id, label, projectId, parentId, createdDate, modifiedDate, deleted'
});

// Inicializar base de datos
export const initDatabase = async () => {
  try {
    await db.open();
    console.log('✅ Database web initialized successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to initialize web database:', error);
    throw error;
  }
};

export const sqliteWebAdapter = {
  // ========== PROJECTS ==========
  getProjects: async () => {
    try {
      const projects = await db.projects
        .where('deleted')
        .equals(0)
        .reverse()
        .sortBy('creation_date');
      return projects.map(item => {
        const p = {
          ...item,
          meta: JSON.parse(item.metadata)
        };

        return p;
      });
    } catch (error) {
      console.error('Error getting projects:', error);
      throw error;
    }
  },

  getProjectById: async (id) => {
    try {
      const res = await db.projects.get(id);

      const project = {
        ...res,
        meta: JSON.parse(res.metadata)
      };

      if (project && project.deleted === 0) {
        return project;
      }
      return null;
    } catch (error) {
      console.error('Error getting project by id:', error);
      throw error;
    }
  },

  createProject: async (data) => {
    try {
      const now = new Date().toISOString();
      const projectData = {
        name: data.name,
        creation_date: now,
        modified_date: now,
        main_node_id: data.main_node_id || 0,
        metadata: data.metadata || '',
        deleted: 0
      };

      const id = await db.projects.add(projectData);
      return { id, ...projectData };
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  },

  updateProject: async (id, data) => {
    try {
      const now = new Date().toISOString();
      const updates = {
        name: data.name,
        modified_date: now,
        main_node_code: data.main_node_code || null
      };

      await db.projects.update(id, updates);
      return { id, ...data, modified_date: now };
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  },

  deleteProject: async (id) => {
    try {
      // Soft delete
      await db.projects.update(id, { deleted: 1 });
      return { success: true };
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  },

  hardDeleteProject: async (id) => {
    try {
      // Hard delete permanente
      await db.projects.delete(id);
      return { success: true };
    } catch (error) {
      console.error('Error hard deleting project:', error);
      throw error;
    }
  },

  // ========== NODES ==========
  getNodes: async (projectId = null) => {
    try {
      let nodes;

      if (projectId !== null) {
        nodes = await db.nodes
          .where(['ProjectId', 'Deleted'])
          .equals([projectId, 0])
          .toArray();
      } else {
        nodes = await db.nodes
          .where('Deleted')
          .equals(0)
          .toArray();
      }

      // Hacer JOIN manual con nodes_types
      const nodeTypes = await db.nodes_types.toArray();
      const nodeTypesMap = {};
      nodeTypes.forEach(nt => {
        nodeTypesMap[nt.id] = nt;
      });

      // Agregar información del tipo y parsear Metadata
      const nodesWithTypes = nodes.map(node => ({
        ...node,
        TypeName: node.TypeId && nodeTypesMap[node.TypeId] ? nodeTypesMap[node.TypeId].name : null,
        TypeCode: node.TypeId && nodeTypesMap[node.TypeId] ? nodeTypesMap[node.TypeId].type : null,
        Metadata: node.Metadata ? JSON.parse(node.Metadata) : null
      }));

      return nodesWithTypes;
    } catch (error) {
      console.error('Error getting nodes:', error);
      throw error;
    }
  },

  getNodeById: async (id) => {
    try {
      const node = await db.nodes.get(id);

      if (!node || node.Deleted !== 0) {
        return null;
      }

      // Obtener información del tipo
      let typeName = null;
      let typeCode = null;

      if (node.TypeId) {
        const nodeType = await db.nodes_types.get(node.TypeId);
        if (nodeType) {
          typeName = nodeType.name;
          typeCode = nodeType.type;
        }
      }

      return {
        ...node,
        TypeName: typeName,
        TypeCode: typeCode,
        Metadata: node.Metadata ? JSON.parse(node.Metadata) : null
      };
    } catch (error) {
      console.error('Error getting node by id:', error);
      throw error;
    }
  },

  createNode: async (data) => {
    try {
      const now = new Date().toISOString();
      const metadata = data.Metadata ? JSON.stringify(data.Metadata) : null;

      const nodeData = {
        label: data.label,
        projectId: data.projectId,
        typeId: data.typeId || '',
        description: data.description || '',
        metadata: data.metadata,
        createdDate: data.createdDate,
        modifiedDate: data.modifiedDate,
        deleted: 0
      };

      const Id = await db.nodes.add(nodeData);
      return { Id, ...data, CreatedDate: now, ModifiedDate: now, Deleted: 0 };
    } catch (error) {
      console.error('Error creating node:', error);
      throw error;
    }
  },

  updateNode: async (id, data) => {
    try {
      const now = new Date().toISOString();
      const metadata = data.Metadata ? JSON.stringify(data.Metadata) : null;

      const updates = {
        Label: data.Label,
        TypeId: data.TypeId || null,
        Description: data.Description || null,
        Metadata: metadata,
        ModifiedDate: now
      };

      await db.nodes.update(id, updates);
      return { Id: id, ...data, ModifiedDate: now };
    } catch (error) {
      console.error('Error updating node:', error);
      throw error;
    }
  },

  deleteNode: async (id) => {
    try {
      // Soft delete
      await db.nodes.update(id, { Deleted: 1 });
      return { success: true };
    } catch (error) {
      console.error('Error deleting node:', error);
      throw error;
    }
  },

  // ========== FIBERS ==========
  getFibers: async (projectId = null, parentId = null) => {
    try {
      let fibers;

      if (projectId !== null && parentId !== null) {
        fibers = await db.fibers
          .where(['ProjectId', 'ParentId', 'Deleted'])
          .equals([projectId, parentId, 0])
          .toArray();
      } else if (projectId !== null) {
        fibers = await db.fibers
          .where(['ProjectId', 'Deleted'])
          .equals([projectId, 0])
          .toArray();
      } else if (parentId !== null) {
        fibers = await db.fibers
          .where(['ParentId', 'Deleted'])
          .equals([parentId, 0])
          .toArray();
      } else {
        fibers = await db.fibers
          .where('Deleted')
          .equals(0)
          .toArray();
      }

      // Ordenar por Label y parsear Metadata
      const sortedFibers = fibers
        .sort((a, b) => a.Label.localeCompare(b.Label))
        .map(fiber => ({
          ...fiber,
          Metadata: fiber.Metadata ? JSON.parse(fiber.Metadata) : null
        }));

      return sortedFibers;
    } catch (error) {
      console.error('Error getting fibers:', error);
      throw error;
    }
  },

  getFiberById: async (id) => {
    try {
      const fiber = await db.fibers.get(id);

      if (!fiber || fiber.Deleted !== 0) {
        return null;
      }

      return {
        ...fiber,
        Metadata: fiber.Metadata ? JSON.parse(fiber.Metadata) : null
      };
    } catch (error) {
      console.error('Error getting fiber by id:', error);
      throw error;
    }
  },

  getFibersByParent: async (parentId) => {
    try {
      const fibers = await db.fibers
        .where(['ParentId', 'Deleted'])
        .equals([parentId, 0])
        .toArray();

      // Ordenar por Label y parsear Metadata
      const sortedFibers = fibers
        .sort((a, b) => a.Label.localeCompare(b.Label))
        .map(fiber => ({
          ...fiber,
          Metadata: fiber.Metadata ? JSON.parse(fiber.Metadata) : null
        }));

      return sortedFibers;
    } catch (error) {
      console.error('Error getting fibers by parent:', error);
      throw error;
    }
  },

  createFiber: async (data) => {
    try {
      

      const fiberData = {
        projectId: data.projectId,
        label: data.label,
        metadata: data.metadata,
        parentId: data.parentId || null,
        createdDate: data.createdDate,
        modifiedDate: data.modifiedDate,
        deleted: 0
      };

      const id = await db.fibers.add(fiberData);
      return { id, ...data, deleted: 0 };
    } catch (error) {
      console.error('Error creating fiber:', error);
      throw error;
    }
  },

  updateFiber: async (id, data) => {
    try {
      const now = new Date().toISOString();
      const metadata = data.Metadata ? JSON.stringify(data.Metadata) : null;

      const updates = {
        Label: data.Label,
        Metadata: metadata,
        ParentId: data.ParentId || null,
        ModifiedDate: now
      };

      await db.fibers.update(id, updates);
      return { Id: id, ...data, ModifiedDate: now };
    } catch (error) {
      console.error('Error updating fiber:', error);
      throw error;
    }
  },

  deleteFiber: async (id) => {
    try {
      // Soft delete
      await db.fibers.update(id, { Deleted: 1 });
      return { success: true };
    } catch (error) {
      console.error('Error deleting fiber:', error);
      throw error;
    }
  },

  // ========== NODE TYPES ==========
  getNodeTypes: async () => {
    try {
      const nodeTypes = await db.nodes_types
        .orderBy('name')
        .toArray();
      return nodeTypes;
    } catch (error) {
      console.error('Error getting node types:', error);
      throw error;
    }
  },

  getNodeTypeById: async (id) => {
    try {
      const nodeType = await db.nodes_types.get(id);
      return nodeType || null;
    } catch (error) {
      console.error('Error getting node type by id:', error);
      throw error;
    }
  },

  createNodeType: async (data) => {
    try {
      const nodeTypeData = {
        name: data.name,
        type: data.type
      };

      const id = await db.nodes_types.add(nodeTypeData);
      return { id, ...nodeTypeData };
    } catch (error) {
      console.error('Error creating node type:', error);
      throw error;
    }
  },

  updateNodeType: async (id, data) => {
    try {
      const updates = {
        name: data.name,
        type: data.type
      };

      await db.nodes_types.update(id, updates);
      return { id, ...data };
    } catch (error) {
      console.error('Error updating node type:', error);
      throw error;
    }
  },

  deleteNodeType: async (id) => {
    try {
      await db.nodes_types.delete(id);
      return { success: true };
    } catch (error) {
      console.error('Error deleting node type:', error);
      throw error;
    }
  }
};

// ============================================
// BONUS: Utilidades para debugging
// ============================================
export const dbUtils = {
  // Limpiar toda la base de datos
  clearAll: async () => {
    await db.projects.clear();
    await db.nodes.clear();
    await db.fibers.clear();
    await db.nodes_types.clear();
    console.log('🗑️ All data cleared');
  },

  // Obtener estadísticas
  getStats: async () => {
    const stats = {
      projects: await db.projects.count(),
      nodes: await db.nodes.count(),
      fibers: await db.fibers.count(),
      nodeTypes: await db.nodes_types.count()
    };
    console.log('📊 Database stats:', stats);
    return stats;
  },

  // Exportar todos los datos (para backup o migración)
  exportData: async () => {
    const data = {
      projects: await db.projects.toArray(),
      nodes: await db.nodes.toArray(),
      fibers: await db.fibers.toArray(),
      nodeTypes: await db.nodes_types.toArray()
    };
    console.log('📦 Data exported');
    return data;
  },

  // Importar datos (para restore o migración)
  importData: async (data) => {
    await db.transaction('rw', [db.projects, db.nodes, db.fibers, db.nodes_types], async () => {
      if (data.projects) await db.projects.bulkAdd(data.projects);
      if (data.nodes) await db.nodes.bulkAdd(data.nodes);
      if (data.fibers) await db.fibers.bulkAdd(data.fibers);
      if (data.nodeTypes) await db.nodes_types.bulkAdd(data.nodeTypes);
    });
    console.log('📥 Data imported');
  }
};

// Exportar instancia de DB por si se necesita acceso directo
export { db };