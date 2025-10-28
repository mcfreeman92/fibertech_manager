import * as SQLite from 'expo-sqlite'; // O tu librería SQLite

let db;

export const initDatabase = () => {
  db = SQLite.openDatabase('fiber.db');

  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      // Projects
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS projects (
          id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
          name TEXT,
          creation_date TEXT,
          modified_date TEXT,
          main_node_id TEXT,
          deleted INTEGER DEFAULT 0,
          metadata TEXT
        )`
      );
      
      // Node Types
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS nodes_types (
          id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
          name TEXT,
          type TEXT
        )`
      );
      
      // Nodes
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS nodes (
          Id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
          Label TEXT NOT NULL,
          ProjectId INTEGER NOT NULL,
          TypeId INTEGER,
          Description TEXT,
          Metadata BLOB,
          CreatedDate DATE,
          ModifiedDate DATE,
          Deleted INTEGER DEFAULT 0,
          CONSTRAINT fk_type_id FOREIGN KEY (TypeId) REFERENCES nodes_types (id) ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT fk_node_project_id FOREIGN KEY (ProjectId) REFERENCES projects (id) ON DELETE CASCADE ON UPDATE CASCADE
        )`
      );
      
      // Fibers
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS fibers (
          Id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
          ProjectId INTEGER NOT NULL,
          Label TEXT NOT NULL,
          Metadata TEXT,
          ParentId INTEGER,
          CreatedDate TEXT,
          ModifiedDate TEXT,
          Deleted INTEGER DEFAULT 0,
          CONSTRAINT fk_projectId FOREIGN KEY (ProjectId) REFERENCES projects (id) ON DELETE CASCADE ON UPDATE CASCADE
        )`
      );
    }, reject, resolve);
  });
};

export const sqliteAdapter = {
  // ========== PROJECTS ==========
  getProjects: () => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM projects WHERE deleted = 0 ORDER BY creation_date DESC',
          [],
          (_, { rows: { _array } }) => resolve(_array),
          (_, error) => reject(error)
        );
      });
    });
  },

  getProjectById: (id) => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM projects WHERE id = ? AND deleted = 0',
          [id],
          (_, { rows: { _array } }) => resolve(_array[0]),
          (_, error) => reject(error)
        );
      });
    });
  },

  createProject: (data) => {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      db.transaction(tx => {
        tx.executeSql(
          'INSERT INTO projects (name, creation_date, modified_date, main_node_code, deleted) VALUES (?, ?, ?, ?, 0)',
          [data.name, now, now, data.main_node_code || null],
          (_, { insertId }) => resolve({ 
            id: insertId, 
            ...data, 
            creation_date: now, 
            modified_date: now,
            deleted: 0 
          }),
          (_, error) => reject(error)
        );
      });
    });
  },

  updateProject: (id, data) => {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      db.transaction(tx => {
        tx.executeSql(
          'UPDATE projects SET name = ?, modified_date = ?, main_node_code = ? WHERE id = ? AND deleted = 0',
          [data.name, now, data.main_node_code || null, id],
          () => resolve({ id, ...data, modified_date: now }),
          (_, error) => reject(error)
        );
      });
    });
  },

  deleteProject: (id) => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        // Soft delete
        tx.executeSql(
          'UPDATE projects SET deleted = 1 WHERE id = ?',
          [id],
          () => resolve({ success: true }),
          (_, error) => reject(error)
        );
      });
    });
  },

  hardDeleteProject: (id) => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        // Hard delete permanente
        tx.executeSql(
          'DELETE FROM projects WHERE id = ?',
          [id],
          () => resolve({ success: true }),
          (_, error) => reject(error)
        );
      });
    });
  },

  // ========== NODES ==========
  getNodes: (projectId = null) => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
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
        
        tx.executeSql(
          query,
          params,
          (_, { rows: { _array } }) => {
            // Parsear Metadata si existe
            const nodes = _array.map(node => ({
              ...node,
              Metadata: node.Metadata ? JSON.parse(node.Metadata) : null
            }));
            resolve(nodes);
          },
          (_, error) => reject(error)
        );
      });
    });
  },

  getNodeById: (id) => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `SELECT n.*, nt.name as TypeName, nt.type as TypeCode 
           FROM nodes n 
           LEFT JOIN nodes_types nt ON n.TypeId = nt.id 
           WHERE n.Id = ? AND n.Deleted = 0`,
          [id],
          (_, { rows: { _array } }) => {
            if (_array.length > 0) {
              const node = {
                ..._array[0],
                Metadata: _array[0].Metadata ? JSON.parse(_array[0].Metadata) : null
              };
              resolve(node);
            } else {
              resolve(null);
            }
          },
          (_, error) => reject(error)
        );
      });
    });
  },

  createNode: (data) => {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      const metadata = data.Metadata ? JSON.stringify(data.Metadata) : null;
      
      db.transaction(tx => {
        tx.executeSql(
          `INSERT INTO nodes (Label, ProjectId, TypeId, Description, Metadata, CreatedDate, ModifiedDate, Deleted) 
           VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
          [data.Label, data.ProjectId, data.TypeId || null, data.Description || null, metadata, now, now],
          (_, { insertId }) => resolve({ 
            Id: insertId, 
            ...data,
            CreatedDate: now,
            ModifiedDate: now,
            Deleted: 0
          }),
          (_, error) => reject(error)
        );
      });
    });
  },

  updateNode: (id, data) => {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      const metadata = data.Metadata ? JSON.stringify(data.Metadata) : null;
      
      db.transaction(tx => {
        tx.executeSql(
          `UPDATE nodes 
           SET Label = ?, TypeId = ?, Description = ?, Metadata = ?, ModifiedDate = ?
           WHERE Id = ? AND Deleted = 0`,
          [data.Label, data.TypeId || null, data.Description || null, metadata, now, id],
          () => resolve({ Id: id, ...data, ModifiedDate: now }),
          (_, error) => reject(error)
        );
      });
    });
  },

  deleteNode: (id) => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        // Soft delete
        tx.executeSql(
          'UPDATE nodes SET Deleted = 1 WHERE Id = ?',
          [id],
          () => resolve({ success: true }),
          (_, error) => reject(error)
        );
      });
    });
  },

  // ========== FIBERS ==========
  getFibers: (projectId = null, parentId = null) => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
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
        
        tx.executeSql(
          query,
          params,
          (_, { rows: { _array } }) => {
            // Parsear Metadata JSON
            const fibers = _array.map(fiber => ({
              ...fiber,
              Metadata: fiber.Metadata ? JSON.parse(fiber.Metadata) : null
            }));
            resolve(fibers);
          },
          (_, error) => reject(error)
        );
      });
    });
  },

  getFiberById: (id) => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM fibers WHERE Id = ? AND Deleted = 0',
          [id],
          (_, { rows: { _array } }) => {
            if (_array.length > 0) {
              const fiber = {
                ..._array[0],
                Metadata: _array[0].Metadata ? JSON.parse(_array[0].Metadata) : null
              };
              resolve(fiber);
            } else {
              resolve(null);
            }
          },
          (_, error) => reject(error)
        );
      });
    });
  },

  getFibersByParent: (parentId) => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM fibers WHERE ParentId = ? AND Deleted = 0 ORDER BY Label',
          [parentId],
          (_, { rows: { _array } }) => {
            const fibers = _array.map(fiber => ({
              ...fiber,
              Metadata: fiber.Metadata ? JSON.parse(fiber.Metadata) : null
            }));
            resolve(fibers);
          },
          (_, error) => reject(error)
        );
      });
    });
  },

  createFiber: (data) => {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      const metadata = data.Metadata ? JSON.stringify(data.Metadata) : null;
      
      db.transaction(tx => {
        tx.executeSql(
          `INSERT INTO fibers (ProjectId, Label, Metadata, ParentId, CreatedDate, ModifiedDate, Deleted) 
           VALUES (?, ?, ?, ?, ?, ?, 0)`,
          [data.ProjectId, data.Label, metadata, data.ParentId || null, now, now],
          (_, { insertId }) => resolve({ 
            Id: insertId, 
            ...data,
            CreatedDate: now,
            ModifiedDate: now,
            Deleted: 0
          }),
          (_, error) => reject(error)
        );
      });
    });
  },

  updateFiber: (id, data) => {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      const metadata = data.Metadata ? JSON.stringify(data.Metadata) : null;
      
      db.transaction(tx => {
        tx.executeSql(
          `UPDATE fibers 
           SET Label = ?, Metadata = ?, ParentId = ?, ModifiedDate = ?
           WHERE Id = ? AND Deleted = 0`,
          [data.Label, metadata, data.ParentId || null, now, id],
          () => resolve({ Id: id, ...data, ModifiedDate: now }),
          (_, error) => reject(error)
        );
      });
    });
  },

  deleteFiber: (id) => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        // Soft delete
        tx.executeSql(
          'UPDATE fibers SET Deleted = 1 WHERE Id = ?',
          [id],
          () => resolve({ success: true }),
          (_, error) => reject(error)
        );
      });
    });
  },

  // ========== NODE TYPES ==========
  getNodeTypes: () => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM nodes_types ORDER BY name',
          [],
          (_, { rows: { _array } }) => resolve(_array),
          (_, error) => reject(error)
        );
      });
    });
  },

  getNodeTypeById: (id) => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM nodes_types WHERE id = ?',
          [id],
          (_, { rows: { _array } }) => resolve(_array[0]),
          (_, error) => reject(error)
        );
      });
    });
  },

  createNodeType: (data) => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'INSERT INTO nodes_types (name, type) VALUES (?, ?)',
          [data.name, data.type],
          (_, { insertId }) => resolve({ id: insertId, ...data }),
          (_, error) => reject(error)
        );
      });
    });
  },

  updateNodeType: (id, data) => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'UPDATE nodes_types SET name = ?, type = ? WHERE id = ?',
          [data.name, data.type, id],
          () => resolve({ id, ...data }),
          (_, error) => reject(error)
        );
      });
    });
  },

  deleteNodeType: (id) => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'DELETE FROM nodes_types WHERE id = ?',
          [id],
          () => resolve({ success: true }),
          (_, error) => reject(error)
        );
      });
    });
  }
};