import Dexie from "dexie";

// Crear instancia de la base de datos
const db = new Dexie("FiberDatabase");

// Definir esquema de la base de datos
db.version(1).stores({
  projects: "++id, name, createdDate, modifiedDate, deleted, metadata",
  nodes:
    "++id, label, projectId, typeId, description, createdDate, modifiedDate, deleted",
  fibers:
    "++id, typeId, label, projectId, parentId, nodeId, createdDate, modifiedDate, deleted",
  medias: "++id, nodeId, label, comment, content, createdDate, modifiedDate, deleted",
});

// Inicializar base de datos
export const initDatabase = async () => {
  try {
    await db.open();
    console.log("✅ Database web initialized successfully");
    return { success: true };
  } catch (error) {
    console.error("❌ Failed to initialize web database:", error);
    throw error;
  }
};

export const sqliteWebAdapter = {
  // ========== PROJECTS ==========
  getProjects: async () => {
    try {
      const projects = await db.projects
        .where("deleted")
        .equals(0)
        .reverse()
        .sortBy("creation_date");
      return projects.map((item) => {
        const p = {
          ...item,
          meta: JSON.parse(item.metadata),
        };

        return p;
      });
    } catch (error) {
      console.error("Error getting projects:", error);
      throw error;
    }
  },

  getProjectById: async (id) => {
    try {
      const res = await db.projects.get(id);

      const project = {
        ...res,
        meta: JSON.parse(res.metadata),
      };

      if (project && project.deleted === 0) {
        return project;
      }
      return null;
    } catch (error) {
      console.error("Error getting project by id:", error);
      throw error;
    }
  },

  createProject: async (data) => {
    try {
      const now = new Date().toISOString();
      const projectData = {
        name: data.name,
        createdDate: now,
        modifiedDate: now,
        metadata: data.metadata || "",
        deleted: 0,
      };

      const id = await db.projects.add(projectData);
      return { id, ...projectData };
    } catch (error) {
      console.error("Error creating project:", error);
      throw error;
    }
  },

  updateProject: async (id, data) => {
    try {
      const now = new Date().toISOString();
      const updates = {
        name: data.name,
        modifiedDate: now,
        metadata: data.metadata || "",
      };

      await db.projects.update(id, updates);
      return { id, ...data, modifiedDate: updates.modifiedDate };
    } catch (error) {
      console.error("Error updating project:", error);
      throw error;
    }
  },

  deleteProject: async (id) => {
    try {
      // Soft delete
      await db.projects.update(id, { deleted: 1 });
      return { success: true };
    } catch (error) {
      console.error("Error deleting project:", error);
      throw error;
    }
  },

  hardDeleteProject: async (id) => {
    try {
      // Hard delete permanente
      await db.projects.delete(id);
      return { success: true };
    } catch (error) {
      console.error("Error hard deleting project:", error);
      throw error;
    }
  },

  // ========== NODES ==========
  getNodes: async (projectId = null) => {
    try {
      let nodes;

      if (projectId !== null) {
        nodes = await db.nodes
          .where("projectId")
          .equals(projectId)
          .and((node) => node.deleted === 0)
          .toArray();
      } else {
        nodes = await db.nodes.where("deleted").equals(0).toArray();
      }

      return nodes.map((node) => {
        let meta = { devices: [], fusionLinks: [] };

        // Validar metadata antes de parsear
        if (
          node.metadata &&
          node.metadata !== "undefined" &&
          node.metadata !== "null"
        ) {
          try {
            meta = JSON.parse(node.metadata);
          } catch (e) {
            console.warn("Invalid metadata for node:", node.id, e);
          }
        }

        const outNode = {
          ...node,
          devices: meta.devices || [],
          fusionLinks: meta.fusionLinks || [],
        };
        return outNode;
      });
    } catch (error) {
      console.error("Error getting nodes:", error);
      throw error;
    }
  },

  getNodeById: async (id) => {
    try {
      const node = await db.nodes.get(id);

      if (!node || node.Deleted !== 0) {
        return null;
      }

      let meta = { devices: [], fusionLinks: [] };

      // Validar metadata antes de parsear
      if (
        node.metadata &&
        node.metadata !== "undefined" &&
        node.metadata !== "null"
      ) {
        try {
          meta = JSON.parse(node.metadata);
        } catch (e) {
          console.warn("Invalid metadata for node:", node.id, e);
        }
      }

      return {
        ...node,
        devices: meta.devices || [],
        fusionLinks: meta.fusionLinks || [],
      };
    } catch (error) {
      console.error("Error getting node by id:", error);
      throw error;
    }
  },

  createNode: async (data) => {
    try {
      const now = new Date().toISOString();

      const nodeData = {
        label: data.label,
        projectId: data.projectId,
        typeId: data.typeId || "",
        description: data.description || "",
        metadata: data.metadata,
        createdDate: now,
        modifiedDate: now,
        deleted: 0,
      };

      const id = await db.nodes.add(nodeData);
      return { ...nodeData, id: id };
    } catch (error) {
      console.error("Error creating node:", error);
      throw error;
    }
  },

  updateNode: async (id, data) => {
    try {
      const now = new Date().toISOString();

      const updates = {
        label: data.label,
        typeId: data.typeId || null,
        description: data.description || null,
        metadata: data.metadata,
        modifiedDate: now,
      };

      await db.nodes.update(id, updates);
      return { id: id, ...data, modifiedDate: updates.modifiedDate };
    } catch (error) {
      console.error("Error updating node:", error);
      throw error;
    }
  },

  deleteNode: async (id) => {
    try {
      // Soft delete
      await db.nodes.update(id, { deleted: 1 });
      return { success: true };
    } catch (error) {
      console.error("Error deleting node:", error);
      throw error;
    }
  },

  // ========== FIBERS ==========
  getFibers: async (projectId = null, parentId = null) => {
    try {
      let fibers;

      if (projectId !== null) {
        fibers = await db.fibers
          .where("projectId")
          .equals(projectId)
          .and((fiber) => fiber.deleted === 0 && fiber.parentId === parentId)
          .toArray();
      }

      fibers = fibers.map((fiber) => {
        let threads = [];

        // Validar metadata antes de parsear
        if (
          fiber.metadata &&
          fiber.metadata !== "undefined" &&
          fiber.metadata !== "null"
        ) {
          try {
            threads = JSON.parse(fiber.metadata);
          } catch (e) {
            console.warn("Invalid metadata for fiber:", fiber.id, e);
          }
        }

        const outfiber = {
          ...fiber,
          threads: threads,
          nodeId: fiber.nodeId || null,
          isSystemFiber: fiber.nodeId ? true : false, // Si tiene nodeId, es fibra del sistema
        };
        return outfiber;
      });

      // Ordenar por Label y parsear Metadata
      const sortedFibers = fibers.sort((a, b) =>
        a.label.localeCompare(b.label)
      );

      return sortedFibers;
    } catch (error) {
      console.error("Error getting fibers:", error);
      throw error;
    }
  },

  getFiberById: async (id) => {
    try {
      const fiber = await db.fibers.get(id);

      if (!fiber || fiber.Deleted !== 0) {
        return null;
      }

      return fiber;
    } catch (error) {
      console.error("Error getting fiber by id:", error);
      throw error;
    }
  },

  getFibersByParent: async (parentId) => {
    try {
      const fibers = await db.fibers
        .where(["ParentId", "Deleted"])
        .equals([parentId, 0])
        .toArray();

      // Ordenar por Label y parsear Metadata
      const sortedFibers = fibers
        .sort((a, b) => a.Label.localeCompare(b.Label))
        .map((fiber) => ({
          ...fiber,
          Metadata: fiber.Metadata ? JSON.parse(fiber.Metadata) : null,
        }));

      return sortedFibers;
    } catch (error) {
      console.error("Error getting fibers by parent:", error);
      throw error;
    }
  },

  createFiber: async (data) => {
    try {
      const fiberData = {
        projectId: data.projectId,
        typeId: data.typeId,
        label: data.label,
        metadata: data.metadata,
        parentId: data.parentId || null,
        nodeId: data.nodeId || null,
        createdDate: data.createdDate,
        modifiedDate: data.modifiedDate,
        deleted: 0,
      };

      const id = await db.fibers.add(fiberData);
      return { id, ...data, deleted: 0 };
    } catch (error) {
      console.error("Error creating fiber:", error);
      throw error;
    }
  },

  updateFiber: async (id, data) => {
    try {
      const now = new Date().toISOString();

      const updates = {
        label: data.label,
        metadata: data.metadata,
        modifiedDate: now,
      };

      // Si se proporciona nodeId, actualizarlo también
      if (data.nodeId !== undefined) {
        updates.nodeId = data.nodeId;
      }

      await db.fibers.update(id, updates);
      return { id: id, ...data, modifiedDate: updates.modifiedDate };
    } catch (error) {
      console.error("Error updating fiber:", error);
      throw error;
    }
  },

  updateFiberThread: async (id, threadIndex, inUse) => {
    try {
      const now = new Date().toISOString();

      let threads = [...data.threads];
      threads[threadIndex].inUse = inUse;

      const updates = {
        metadata: JSON.stringify(threads),
        modifiedDate: now,
      };

      await db.fibers.update(id, updates);
      return true;
    } catch (error) {
      console.error("Error updating fiber:", error);
      throw error;
    }
  },

  deleteFiber: async (id) => {
    try {
      // Soft delete
      await db.fibers.update(id, { deleted: 1 });
      return { success: true };
    } catch (error) {
      console.error("Error deleting fiber:", error);
      throw error;
    }
  },

  // ========== NODE TYPES ==========
  getNodeTypes: async () => {
    try {
      const nodeTypes = await db.nodes_types.orderBy("name").toArray();
      return nodeTypes;
    } catch (error) {
      console.error("Error getting node types:", error);
      throw error;
    }
  },

  getNodeTypeById: async (id) => {
    try {
      const nodeType = await db.nodes_types.get(id);
      return nodeType || null;
    } catch (error) {
      console.error("Error getting node type by id:", error);
      throw error;
    }
  },

  createNodeType: async (data) => {
    try {
      const nodeTypeData = {
        name: data.name,
        type: data.type,
      };

      const id = await db.nodes_types.add(nodeTypeData);
      return { id, ...nodeTypeData };
    } catch (error) {
      console.error("Error creating node type:", error);
      throw error;
    }
  },

  updateNodeType: async (id, data) => {
    try {
      const updates = {
        name: data.name,
        type: data.type,
      };

      await db.nodes_types.update(id, updates);
      return { id, ...data };
    } catch (error) {
      console.error("Error updating node type:", error);
      throw error;
    }
  },

  deleteNodeType: async (id) => {
    try {
      await db.nodes_types.delete(id);
      return { success: true };
    } catch (error) {
      console.error("Error deleting node type:", error);
      throw error;
    }
  },
  // ========== MEDIAS ==========

  getMedias: async () => {
    try {
      const medias = await db.medias
        .where("deleted")
        .equals(0)
        .reverse()
        .sortBy("createdDate");
      return media.map((item) => {
        const m = {
          ...item,
          content: item.content ? JSON.parse(item.content) : null,
        };
        return m;
      });
    } catch (error) {
      console.error("Error getting media:", error);
      throw error;
    }
  },

  getMediaById: async (id) => {
    try {
      const res = await db.medias.get(id);

      if (!res) return null;

      const media = {
        ...res,
        content: item.content ? JSON.parse(item.content) : null,
      };

      if (media && media.deleted === 0) {
        return media;
      }
      return null;
    } catch (error) {
      console.error("Error getting media by id:", error);
      throw error;
    }
  },

  getMediasByNodeId: async (nodeId) => {
    try {
      const media = await db.medias
        .where("nodeId")
        .equals(nodeId)
        .and((item) => item.deleted === 0)
        .reverse()
        .sortBy("createdDate");

      return media.map((item) => {
        const m = {
          ...item,
          content: item.content ? JSON.parse(item.content) : null,
        };
        return m;
      });
    } catch (error) {
      console.error("Error getting media by nodeId:", error);
      throw error;
    }
  },

  createMedia: async (data) => {
    try {
      const now = new Date().toISOString();
      const strContent = data.content ? JSON.stringify(data.content) : "";
      const mediaData = {
        nodeId: data.nodeId,
        label: data.label || "",
        comment: data.comment || "",
        createdDate: now,
        modifiedDate: now,
        content: strContent,
        deleted: 0,
      };

      const id = await db.medias.add(mediaData);
      return {
        id,
        ...mediaData,
        content: JSON.parse(mediaData.content),
      };
    } catch (error) {
      console.error("Error creating media:", error);
      throw error;
    }
  },

  updateMedia: async (id, data) => {
    try {
      const now = new Date().toISOString();
      let updates = {
        modifiedDate: now,
      };

      if (data.label !== undefined) updates.label = data.label;
      if (data.comment !== undefined) updates.comment = data.comment;

      if (data.content !== undefined)
        updates.content = data.content ? JSON.stringify(data.content) : "";

      await db.medias.update(id, updates);

      return true;
    } catch (error) {
      console.error("Error updating media:", error);
      throw error;
    }
  },

  deleteMedia: async (id) => {
    try {
      // Soft delete
      await db.medias.update(id, {
        deleted: 1,
        modifiedDate: new Date().toISOString(),
      });
      return { success: true };
    } catch (error) {
      console.error("Error deleting media:", error);
      throw error;
    }
  },

  hardDeleteMedia: async (id) => {
    try {
      // Hard delete permanente
      await db.medias.delete(id);
      return { success: true };
    } catch (error) {
      console.error("Error hard deleting media:", error);
      throw error;
    }
  },
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
    console.log("🗑️ All data cleared");
  },

  // Obtener estadísticas
  getStats: async () => {
    const stats = {
      projects: await db.projects.count(),
      nodes: await db.nodes.count(),
      fibers: await db.fibers.count(),
      nodeTypes: await db.nodes_types.count(),
    };
    console.log("📊 Database stats:", stats);
    return stats;
  },

  // Exportar todos los datos (para backup o migración)
  exportData: async () => {
    const data = {
      projects: await db.projects.toArray(),
      nodes: await db.nodes.toArray(),
      fibers: await db.fibers.toArray(),
      nodeTypes: await db.nodes_types.toArray(),
    };
    console.log("📦 Data exported");
    return data;
  },

  // Importar datos (para restore o migración)
  importData: async (data) => {
    await db.transaction(
      "rw",
      [db.projects, db.nodes, db.fibers, db.nodes_types],
      async () => {
        if (data.projects) await db.projects.bulkAdd(data.projects);
        if (data.nodes) await db.nodes.bulkAdd(data.nodes);
        if (data.fibers) await db.fibers.bulkAdd(data.fibers);
        if (data.nodeTypes) await db.nodes_types.bulkAdd(data.nodeTypes);
      }
    );
    console.log("📥 Data imported");
  },
};

// Exportar instancia de DB por si se necesita acceso directo
export { db };
