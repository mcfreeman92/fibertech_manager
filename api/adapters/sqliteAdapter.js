import * as SQLite from 'expo-sqlite';

let db = null;

export const initDatabase = async () => {
  try {
    // Nueva API de expo-sqlite
    db = await SQLite.openDatabaseAsync('fiber.db');

    // Crear tablas
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        creation_date TEXT,
        modified_date TEXT,
        main_node_id TEXT,
        deleted INTEGER DEFAULT 0,
        metadata TEXT
      );

      CREATE TABLE IF NOT EXISTS nodes_types (
        id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        type TEXT
      );

      CREATE TABLE IF NOT EXISTS nodes (
        Id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        Label TEXT NOT NULL,
        ProjectId INTEGER NOT NULL,
        TypeId INTEGER,
        Description TEXT,
        Metadata BLOB,
        CreatedDate DATE,
        ModifiedDate DATE,
        Deleted INTEGER DEFAULT 0,
        FOREIGN KEY (TypeId) REFERENCES nodes_types (id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (ProjectId) REFERENCES projects (id) ON DELETE CASCADE ON UPDATE CASCADE
      );

      CREATE TABLE IF NOT EXISTS fibers (
        Id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        ProjectId INTEGER NOT NULL,
        Label TEXT NOT NULL,
        Metadata TEXT,
        ParentId INTEGER,
        CreatedDate TEXT,
        ModifiedDate TEXT,
        Deleted INTEGER DEFAULT 0,
        FOREIGN KEY (ProjectId) REFERENCES projects (id) ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    console.log('✅ SQLite database initialized successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to initialize SQLite database:', error);
    throw error;
  }
};

export const sqliteAdapter = {
  // ========== PROJECTS ==========
  getProjects: async () => {
    try {
      const result = await db.getAllAsync(
        'SELECT * FROM projects WHERE deleted = 0 ORDER BY creation_date DESC'
      );
      return result || [];
    } catch (error) {
      console.error('Error getting projects:', error);
      throw error;
    }
  },

  getProjectById: async (id) => {
    try {
      const result = await db.getFirstAsync(
        'SELECT * FROM projects WHERE id = ? AND deleted = 0',
        [id]
      );
      return result || null;
    } catch (error) {
      console.error('Error getting project:', error);
      throw error;
    }
  },

  createProject: async (data) => {
    try {
      const now = new Date().toISOString();
      const result = await db.runAsync(
        'INSERT INTO projects (name, creation_date, modified_date, main_node_id, metadata, deleted) VALUES (?, ?, ?, ?, ?, 0)',
        [data.name, now, now, data.main_node_id || null, data.metadata || '']
      );

      // En expo-sqlite, lastInsertRowid debería estar en result.lastInsertRowid
      // Si no, hacer una query para obtener el último registro
      let projectId = result.lastInsertRowid;
      
      if (!projectId) {
        // Si lastInsertRowid no está disponible, buscar el proyecto más reciente
        const projects = await db.getAllAsync(
          'SELECT id FROM projects WHERE name = ? AND creation_date = ? ORDER BY id DESC LIMIT 1',
          [data.name, now]
        );
        if (projects && projects.length > 0) {
          projectId = projects[0].id;
        } else {
          throw new Error('Failed to retrieve project ID after insertion');
        }
      }

      console.log('✅ [SQLite] Project created successfully with ID:', projectId);

      return {
        id: projectId,
        name: data.name,
        metadata: data.metadata || '',
        creation_date: now,
        modified_date: now,
        deleted: 0
      };
    } catch (error) {
      console.error('❌ Error creating project:', error);
      throw error;
    }
  },

  updateProject: async (id, data) => {
    try {
      const now = new Date().toISOString();
      await db.runAsync(
        'UPDATE projects SET name = ?, modified_date = ?, main_node_id = ? WHERE id = ? AND deleted = 0',
        [data.name, now, data.main_node_id || null, id]
      );
      return { id, ...data, modified_date: now };
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  },

  deleteProject: async (id) => {
    try {
      await db.runAsync(
        'UPDATE projects SET deleted = 1 WHERE id = ?',
        [id]
      );
      return { success: true };
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  },

  hardDeleteProject: async (id) => {
    try {
      await db.runAsync('DELETE FROM projects WHERE id = ?', [id]);
      return { success: true };
    } catch (error) {
      console.error('Error hard deleting project:', error);
      throw error;
    }
  },

  // ========== NODES ==========
  getNodes: async (projectId = null) => {
    try {
      const query = projectId
        ? `SELECT n.*, nt.name as TypeName, nt.type as TypeCode
           FROM nodes n
           LEFT JOIN nodes_types nt ON n.TypeId = nt.id
           WHERE n.ProjectId = ? AND n.Deleted = 0`
        : `SELECT n.*, nt.name as TypeName, nt.type as TypeCode
           FROM nodes n
           LEFT JOIN nodes_types nt ON n.TypeId = nt.id
           WHERE n.Deleted = 0`;
      const params = projectId ? [projectId] : [];

      const results = await db.getAllAsync(query, params);
      
      console.log(`📖 [SQLite] getNodes loaded ${results.length} nodes`);
      
      return (results || []).map(node => {
        let meta = { devices: [], fusionLinks: [] };
        
        // Validar y parsear metadata
        if (node.Metadata && node.Metadata !== "undefined" && node.Metadata !== "null") {
          try {
            meta = JSON.parse(node.Metadata);
          } catch (e) {
            console.warn(`Invalid metadata for node ${node.Label}:`, e);
          }
        }

        const devices = meta.devices || [];
        console.log(`   📍 Node "${node.Label}": ${devices.length} devices`);
        
        // Return same structure as web adapter for consistency
        const outNode = {
          id: node.Id,
          label: node.Label,
          projectId: node.ProjectId,
          typeId: node.TypeId,
          description: node.Description,
          metadata: meta,
          devices: devices,              // ✅ Propiedades directas (como en web)
          fusionLinks: meta.fusionLinks || [],  // ✅ Propiedades directas (como en web)
          createdDate: node.CreatedDate,
          modifiedDate: node.ModifiedDate,
          deleted: node.Deleted,
          typeName: node.TypeName,
          typeCode: node.TypeCode
        };
        return outNode;
      });
    } catch (error) {
      console.error('Error getting nodes:', error);
      throw error;
    }
  },

  getNodeById: async (id) => {
    try {
      const result = await db.getFirstAsync(
        `SELECT n.*, nt.name as TypeName, nt.type as TypeCode
         FROM nodes n
         LEFT JOIN nodes_types nt ON n.TypeId = nt.id
         WHERE n.Id = ? AND n.Deleted = 0`,
        [id]
      );
      if (result) {
        let meta = { devices: [], fusionLinks: [] };
        
        // Validar y parsear metadata
        if (result.Metadata && result.Metadata !== "undefined" && result.Metadata !== "null") {
          try {
            meta = JSON.parse(result.Metadata);
          } catch (e) {
            console.warn(`Invalid metadata for node ${result.Label}:`, e);
          }
        }

        return {
          id: result.Id,
          label: result.Label,
          projectId: result.ProjectId,
          typeId: result.TypeId,
          description: result.Description,
          metadata: meta,
          devices: meta.devices || [],              // ✅ Propiedades directas
          fusionLinks: meta.fusionLinks || [],      // ✅ Propiedades directas
          createdDate: result.CreatedDate,
          modifiedDate: result.ModifiedDate,
          deleted: result.Deleted,
          typeName: result.TypeName,
          typeCode: result.TypeCode
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting node:', error);
      throw error;
    }
  },

  createNode: async (data) => {
    try {
      const now = new Date().toISOString();
      // Accept both camelCase and PascalCase
      const label = data.label || data.Label;
      const projectId = data.projectId || data.ProjectId;
      const typeId = data.typeId || data.TypeId;
      const description = data.description || data.Description;
      const metadataStr = data.metadata || data.Metadata;
      const metadata = metadataStr ? (typeof metadataStr === 'string' ? metadataStr : JSON.stringify(metadataStr)) : null;
      const createdDate = data.createdDate || data.CreatedDate || now;
      const modifiedDate = data.modifiedDate || data.ModifiedDate || now;

      console.log('💾 [SQLite] Creating node:', {
        label,
        projectId,
        metadata: metadata ? `(${metadata.substring(0, 100)}...)` : 'null'
      });

      const result = await db.runAsync(
        `INSERT INTO nodes (Label, ProjectId, TypeId, Description, Metadata, CreatedDate, ModifiedDate, Deleted)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
        [label, projectId, typeId || null, description || null, metadata, createdDate, modifiedDate]
      );
      
      const parsedMetadata = metadata ? JSON.parse(metadata) : null;
      console.log('💾 [SQLite] Node created with ID:', result.lastInsertRowid, 'Metadata devices:', parsedMetadata?.devices?.length || 0);
      
      return {
        id: result.lastInsertRowid,
        label: label,
        projectId: projectId,
        typeId: typeId,
        description: description,
        metadata: parsedMetadata,
        createdDate: createdDate,
        modifiedDate: modifiedDate,
        deleted: 0
      };
    } catch (error) {
      console.error('Error creating node:', error);
      throw error;
    }
  },

  updateNode: async (id, data) => {
    try {
      const now = new Date().toISOString();
      // Accept both camelCase and PascalCase
      const label = data.label || data.Label;
      const typeId = data.typeId || data.TypeId;
      const description = data.description || data.Description;
      const metadataStr = data.metadata || data.Metadata;
      const metadata = metadataStr ? (typeof metadataStr === 'string' ? metadataStr : JSON.stringify(metadataStr)) : null;

      await db.runAsync(
        `UPDATE nodes
         SET Label = ?, TypeId = ?, Description = ?, Metadata = ?, ModifiedDate = ?
         WHERE Id = ? AND Deleted = 0`,
        [label, typeId || null, description || null, metadata, now, id]
      );
      
      const parsedMetadata = metadata ? JSON.parse(metadata) : null;
      return {
        id: id,
        label: label,
        typeId: typeId,
        description: description,
        metadata: parsedMetadata,
        modifiedDate: now
      };
    } catch (error) {
      console.error('Error updating node:', error);
      throw error;
    }
  },

  deleteNode: async (id) => {
    try {
      await db.runAsync('UPDATE nodes SET Deleted = 1 WHERE Id = ?', [id]);
      return { success: true };
    } catch (error) {
      console.error('Error deleting node:', error);
      throw error;
    }
  },

  // ========== FIBERS ==========
  getFibers: async (projectId = null, parentId = null) => {
    try {
      let query = `SELECT f.* FROM fibers f WHERE f.Deleted = 0`;
      const params = [];

      if (projectId !== null) {
        query += ` AND f.ProjectId = ?`;
        params.push(projectId);
      }

      if (parentId !== null) {
        query += ` AND f.ParentId = ?`;
        params.push(parentId);
      }

      query += ` ORDER BY f.Label`;

      const results = await db.getAllAsync(query, params);
      return (results || []).map(fiber => {
        const metadata = fiber.Metadata ? JSON.parse(fiber.Metadata) : null;
        return {
          id: fiber.Id,
          projectId: fiber.ProjectId,
          label: fiber.Label,
          metadata: metadata,
          parentId: fiber.ParentId,
          createdDate: fiber.CreatedDate,
          modifiedDate: fiber.ModifiedDate,
          deleted: fiber.Deleted
        };
      });
    } catch (error) {
      console.error('Error getting fibers:', error);
      throw error;
    }
  },

  getFiberById: async (id) => {
    try {
      const result = await db.getFirstAsync(
        'SELECT * FROM fibers WHERE Id = ? AND Deleted = 0',
        [id]
      );
      if (result) {
        const metadata = result.Metadata ? JSON.parse(result.Metadata) : null;
        return {
          id: result.Id,
          projectId: result.ProjectId,
          label: result.Label,
          metadata: metadata,
          parentId: result.ParentId,
          createdDate: result.CreatedDate,
          modifiedDate: result.ModifiedDate,
          deleted: result.Deleted
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting fiber:', error);
      throw error;
    }
  },

  getFibersByParent: async (parentId) => {
    try {
      const results = await db.getAllAsync(
        'SELECT * FROM fibers WHERE ParentId = ? AND Deleted = 0 ORDER BY Label',
        [parentId]
      );
      return (results || []).map(fiber => {
        const metadata = fiber.Metadata ? JSON.parse(fiber.Metadata) : null;
        return {
          id: fiber.Id,
          projectId: fiber.ProjectId,
          label: fiber.Label,
          metadata: metadata,
          parentId: fiber.ParentId,
          createdDate: fiber.CreatedDate,
          modifiedDate: fiber.ModifiedDate,
          deleted: fiber.Deleted
        };
      });
    } catch (error) {
      console.error('Error getting fibers by parent:', error);
      throw error;
    }
  },

  createFiber: async (data) => {
    try {
      const now = new Date().toISOString();
      // Accept both camelCase and PascalCase
      const projectId = data.projectId || data.ProjectId;
      const label = data.label || data.Label;
      const parentId = data.parentId || data.ParentId;
      const metadataStr = data.metadata || data.Metadata;
      const metadata = metadataStr ? (typeof metadataStr === 'string' ? metadataStr : JSON.stringify(metadataStr)) : null;
      const createdDate = data.createdDate || data.CreatedDate || now;
      const modifiedDate = data.modifiedDate || data.ModifiedDate || now;

      const result = await db.runAsync(
        `INSERT INTO fibers (ProjectId, Label, Metadata, ParentId, CreatedDate, ModifiedDate, Deleted)
         VALUES (?, ?, ?, ?, ?, ?, 0)`,
        [projectId, label, metadata, parentId || null, createdDate, modifiedDate]
      );
      
      const parsedMetadata = metadata ? JSON.parse(metadata) : null;
      return {
        id: result.lastInsertRowid,
        projectId: projectId,
        label: label,
        metadata: parsedMetadata,
        parentId: parentId,
        createdDate: createdDate,
        modifiedDate: modifiedDate,
        deleted: 0
      };
    } catch (error) {
      console.error('Error creating fiber:', error);
      throw error;
    }
  },

  updateFiber: async (id, data) => {
    try {
      const now = new Date().toISOString();
      // Accept both camelCase and PascalCase
      const label = data.label || data.Label;
      const parentId = data.parentId || data.ParentId;
      const metadataStr = data.metadata || data.Metadata;
      const metadata = metadataStr ? (typeof metadataStr === 'string' ? metadataStr : JSON.stringify(metadataStr)) : null;

      await db.runAsync(
        `UPDATE fibers
         SET Label = ?, Metadata = ?, ParentId = ?, ModifiedDate = ?
         WHERE Id = ? AND Deleted = 0`,
        [label, metadata, parentId || null, now, id]
      );
      
      const parsedMetadata = metadata ? JSON.parse(metadata) : null;
      return {
        id: id,
        label: label,
        metadata: parsedMetadata,
        parentId: parentId,
        modifiedDate: now
      };
    } catch (error) {
      console.error('Error updating fiber:', error);
      throw error;
    }
  },

  deleteFiber: async (id) => {
    try {
      await db.runAsync('UPDATE fibers SET Deleted = 1 WHERE Id = ?', [id]);
      return { success: true };
    } catch (error) {
      console.error('Error deleting fiber:', error);
      throw error;
    }
  },

  // ========== NODE TYPES ==========
  getNodeTypes: async () => {
    try {
      const results = await db.getAllAsync(
        'SELECT * FROM nodes_types ORDER BY name'
      );
      return results || [];
    } catch (error) {
      console.error('Error getting node types:', error);
      throw error;
    }
  },

  getNodeTypeById: async (id) => {
    try {
      const result = await db.getFirstAsync(
        'SELECT * FROM nodes_types WHERE id = ?',
        [id]
      );
      return result || null;
    } catch (error) {
      console.error('Error getting node type:', error);
      throw error;
    }
  },

  createNodeType: async (data) => {
    try {
      const result = await db.runAsync(
        'INSERT INTO nodes_types (name, type) VALUES (?, ?)',
        [data.name, data.type]
      );
      return { id: result.lastInsertRowid, ...data };
    } catch (error) {
      console.error('Error creating node type:', error);
      throw error;
    }
  },

  updateNodeType: async (id, data) => {
    try {
      await db.runAsync(
        'UPDATE nodes_types SET name = ?, type = ? WHERE id = ?',
        [data.name, data.type, id]
      );
      return { id, ...data };
    } catch (error) {
      console.error('Error updating node type:', error);
      throw error;
    }
  },

  deleteNodeType: async (id) => {
    try {
      await db.runAsync('DELETE FROM nodes_types WHERE id = ?', [id]);
      return { success: true };
    } catch (error) {
      console.error('Error deleting node type:', error);
      throw error;
    }
  }
};