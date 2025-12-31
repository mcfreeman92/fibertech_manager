// service/storage.js
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FILES_KEY = 'project_files';

// Keys para AsyncStorage
const STORAGE_KEYS = {
  PROJECTS: '@fibraoptica/projects',
  UNITS_INFO: '@fibraoptica/units_info',
  PROJECT_TYPES: '@fibraoptica/project_types',
  NODES: '@fibraoptica/nodes',
  CONNECTIONS: '@fibraoptica/connections',
  DEVICE_CONFIG: '@fibraoptica/device_config',
  FIBER_CONFIG: '@fibraoptica/fiber_config',
  NETWORK_MAPS: '@fibraoptica/network_maps'
};

// Helper functions
export const StorageService = {
  // Guardar datos
  setItem: async (key, value) => {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
      return true;
    } catch (error) {
      console.error('❌ Error saving to storage:', error);
      throw error;
    }
  },

  // Obtener datos
  getItem: async (key) => {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error('❌ Error reading from storage:', error);
      return null;
    }
  },

  // Eliminar datos
  removeItem: async (key) => {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('❌ Error removing from storage:', error);
      throw error;
    }
  },

  // Obtener todas las keys
  getAllKeys: async () => {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('❌ Error getting keys:', error);
      return [];
    }
  }
};

// Project operations
export const ProjectService = {
  // Crear nuevo proyecto
  createProject: async (projectData) => {
    try {
      const projects = await ProjectService.getProjects();
      const newProject = {
        id: Date.now().toString(),
        ...projectData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active'
      };

      projects.push(newProject);
      await StorageService.setItem(STORAGE_KEYS.PROJECTS, projects);

      return newProject;
    } catch (error) {
      console.error('❌ Error creating project:', error);
      throw error;
    }
  },

  // Obtener todos los proyectos
  getProjects: async () => {
    try {
      const projects = await StorageService.getItem(STORAGE_KEYS.PROJECTS);
      return projects || [];
    } catch (error) {
      console.error('❌ Error getting projects:', error);
      return [];
    }
  },

  // Obtener proyecto por ID
  getProjectById: async (projectId) => {
    try {
      const projects = await ProjectService.getProjects();
      return projects.find(project => project.id === projectId) || null;
    } catch (error) {
      console.error('❌ Error getting project:', error);
      return null;
    }
  },

  // Actualizar proyecto
  updateProject: async (projectId, updates) => {
    try {
      const projects = await ProjectService.getProjects();
      const projectIndex = projects.findIndex(p => p.id === projectId);
      
      if (projectIndex === -1) {
        throw new Error('Project not found');
      }

      projects[projectIndex] = {
        ...projects[projectIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      await StorageService.setItem(STORAGE_KEYS.PROJECTS, projects);
      return projects[projectIndex];
    } catch (error) {
      console.error('❌ Error updating project:', error);
      throw error;
    }
  }, 
  // Eliminar proyecto y sus datos relacionados
  deleteProject: async (projectId) => {
    try {
      // Eliminar proyecto
      const projects = await ProjectService.getProjects();
      const updatedProjects = projects.filter(p => p.id !== projectId);
      await StorageService.setItem(STORAGE_KEYS.PROJECTS, updatedProjects);

      // Eliminar datos relacionados
      await NetworkMapService.deleteNetworkMapsByProject(projectId);
      
      // También podrías agregar aquí la eliminación de configuraciones de dispositivos y fibras
      // si decides centralizar toda la limpieza aquí

      return { success: true, deletedCount: 1 };
    } catch (error) {
      console.error('❌ Error deleting project:', error);
      return { success: false, error: error.message };
    }
  }
};

// ==================== NUEVO SERVICIO PARA MAPAS DE RED ====================
export const NetworkMapService = {
  // Guardar mapa de red
  saveNetworkMap: async (projectId, mapData) => {
    try {
      const allMaps = await NetworkMapService.getAllNetworkMaps();
      
      const newMap = {
        id: `${projectId}_${Date.now()}`,
        projectId: projectId,
        ...mapData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Reemplazar si ya existe un mapa para este proyecto o agregar nuevo
      const existingIndex = allMaps.findIndex(map => map.projectId === projectId);
      if (existingIndex !== -1) {
        allMaps[existingIndex] = newMap;
      } else {
        allMaps.push(newMap);
      }

      await StorageService.setItem(STORAGE_KEYS.NETWORK_MAPS, allMaps);
      return { success: true, map: newMap };
    } catch (error) {
      console.error('❌ Error saving network map:', error);
      return { success: false, error: error.message };
    }
  },

  // Obtener mapa de red por projectId
  getNetworkMapByProject: async (projectId) => {
    try {
      const allMaps = await NetworkMapService.getAllNetworkMaps();
      return allMaps.find(map => map.projectId === projectId) || null;
    } catch (error) {
      console.error('❌ Error getting network map:', error);
      return null;
    }
  },

  // Obtener todos los mapas de red
  getAllNetworkMaps: async () => {
    try {
      const maps = await StorageService.getItem(STORAGE_KEYS.NETWORK_MAPS);
      return maps || [];
    } catch (error) {
      console.error('❌ Error getting all network maps:', error);
      return [];
    }
  },

  // Obtener mapa por ID específico
  getNetworkMapById: async (mapId) => {
    try {
      const allMaps = await NetworkMapService.getAllNetworkMaps();
      return allMaps.find(map => map.id === mapId) || null;
    } catch (error) {
      console.error('❌ Error getting network map by ID:', error);
      return null;
    }
  },

  // Eliminar mapa de red
  deleteNetworkMap: async (mapId) => {
    try {
      const allMaps = await NetworkMapService.getAllNetworkMaps();
      const updatedMaps = allMaps.filter(map => map.id !== mapId);
      
      await StorageService.setItem(STORAGE_KEYS.NETWORK_MAPS, updatedMaps);
      return { success: true, deletedCount: allMaps.length - updatedMaps.length };
    } catch (error) {
      console.error('❌ Error deleting network map:', error);
      return { success: false, error: error.message };
    }
  },

  // Eliminar todos los mapas de un proyecto
  deleteNetworkMapsByProject: async (projectId) => {
    try {
      const allMaps = await NetworkMapService.getAllNetworkMaps();
      const updatedMaps = allMaps.filter(map => map.projectId !== projectId);
      
      await StorageService.setItem(STORAGE_KEYS.NETWORK_MAPS, updatedMaps);
      return { 
        success: true, 
        deletedCount: allMaps.length - updatedMaps.length 
      };
    } catch (error) {
      console.error('❌ Error deleting project network maps:', error);
      return { success: false, error: error.message };
    }
  },

  // Obtener estadísticas del mapa
  getMapStatistics: async (projectId) => {
    try {
      const map = await NetworkMapService.getNetworkMapByProject(projectId);
      if (!map || !map.nodes) {
        return null;
      }

      const nodeCountByType = {};
      let totalDevices = 0;
      let totalFibers = 0;
      let totalConnections = map.connections ? map.connections.length : 0;

      map.nodes.forEach(node => {
        // Contar nodos por tipo
        nodeCountByType[node.type] = (nodeCountByType[node.type] || 0) + 1;
        
        // Contar dispositivos
        if (node.devices && Array.isArray(node.devices)) {
          totalDevices += node.devices.reduce((sum, device) => sum + (device.quantity || 1), 0);
        }
        
        // Contar fibras
        if (node.fibers && Array.isArray(node.fibers)) {
          totalFibers += node.fibers.reduce((sum, fiber) => sum + (fiber.quantity || 1), 0);
        }
      });

      return {
        totalNodes: map.nodes.length,
        nodeCountByType,
        totalDevices,
        totalFibers,
        totalConnections,
        createdAt: map.createdAt,
        updatedAt: map.updatedAt
      };
    } catch (error) {
      console.error('❌ Error getting map statistics:', error);
      return null;
    }
  }
};


// Device configuration operations
export const DeviceConfigService = {
  // Guardar configuración de dispositivos
//   saveDeviceConfig: async (projectId, devices) => {
//     try {
//       const allConfigs = await StorageService.getItem(STORAGE_KEYS.DEVICE_CONFIG) || {};
//       allConfigs[projectId] = devices;
//       await StorageService.setItem(STORAGE_KEYS.DEVICE_CONFIG, allConfigs);
//       return true;
//     } catch (error) {
//       console.error('❌ Error saving device config:', error);
//       throw error;
//     }
//   },

//   // Obtener configuración de dispositivos
//   getDeviceConfig: async (projectId) => {
//     try {
//       const allConfigs = await StorageService.getItem(STORAGE_KEYS.DEVICE_CONFIG) || {};
//       return allConfigs[projectId] || [];
//     } catch (error) {
//       console.error('❌ Error getting device config:', error);
//       return [];
//     }
//   }
saveDeviceConfig: async (projectId, devices) => {
    try {
      const key = `deviceConfig_${projectId}`;
      // Asegurar que guardamos un array
      const devicesArray = Array.isArray(devices) ? devices : [];
      await AsyncStorage.setItem(key, JSON.stringify(devicesArray));
      return true;
    } catch (error) {
      console.error('Error saving device config:', error);
      return false;
    }
  },

  // Obtener configuración de dispositivos
  getDeviceConfig: async (projectId) => {
    try {
      const key = `deviceConfig_${projectId}`;
      const data = await AsyncStorage.getItem(key);
      
      if (!data) return [];
      
      const parsedData = JSON.parse(data);
      
      // Asegurar que siempre devolvemos un array
      if (Array.isArray(parsedData)) {
        return parsedData;
      }
      
      // Si es un objeto, convertirlo a array
      if (typeof parsedData === 'object') {
        return Object.values(parsedData);
      }
      
      return [];
    } catch (error) {
      console.error('Error getting device config:', error);
      return [];
    }
  }
};

// Fiber configuration operations
export const FiberConfigService = {
  // Guardar configuración de fibras
//   saveFiberConfig: async (projectId, fibers) => {
//     try {
//       const allConfigs = await StorageService.getItem(STORAGE_KEYS.FIBER_CONFIG) || {};
//       allConfigs[projectId] = fibers;
//       await StorageService.setItem(STORAGE_KEYS.FIBER_CONFIG, allConfigs);
//       return true;
//     } catch (error) {
//       console.error('❌ Error saving fiber config:', error);
//       throw error;
//     }
//   },

//   // Obtener configuración de fibras
//   getFiberConfig: async (projectId) => {
//     try {
//       const allConfigs = await StorageService.getItem(STORAGE_KEYS.FIBER_CONFIG) || {};
//       return allConfigs[projectId] || [];
//     } catch (error) {
//       console.error('❌ Error getting fiber config:', error);
//       return [];
//     }
//   }
 // Guardar configuración de fibras
  saveFiberConfig: async (projectId, fibers) => {
    try {
      const key = `fiberConfig_${projectId}`;
      // Asegurar que guardamos un array
      const fibersArray = Array.isArray(fibers) ? fibers : [];
      await AsyncStorage.setItem(key, JSON.stringify(fibersArray));
      return true;
    } catch (error) {
      console.error('Error saving fiber config:', error);
      return false;
    }
  },

  // Obtener configuración de fibras
  getFiberConfig: async (projectId) => {
    try {
      const key = `fiberConfig_${projectId}`;
      const data = await AsyncStorage.getItem(key);
      
      if (!data) return [];
      
      const parsedData = JSON.parse(data);
      
      // Asegurar que siempre devolvemos un array
      if (Array.isArray(parsedData)) {
        return parsedData;
      }
      
      // Si es un objeto, convertirlo a array
      if (typeof parsedData === 'object') {
        return Object.values(parsedData);
      }
      
      return [];
    } catch (error) {
      console.error('Error getting fiber config:', error);
      return [];
    }
  }
};

// Units info operations
export const UnitsService = {
  // Guardar información de unidades
  saveUnitsInfo: async (projectId, unitsInfo) => {
    try {
      const allUnitsInfo = await StorageService.getItem(STORAGE_KEYS.UNITS_INFO) || {};
      allUnitsInfo[projectId] = {
        ...unitsInfo,
        updatedAt: new Date().toISOString()
      };
      
      await StorageService.setItem(STORAGE_KEYS.UNITS_INFO, allUnitsInfo);
      return allUnitsInfo[projectId];
    } catch (error) {
      console.error('❌ Error saving units info:', error);
      throw error;
    }
  },

  // Obtener información de unidades
  getUnitsInfo: async (projectId) => {
    try {
      const allUnitsInfo = await StorageService.getItem(STORAGE_KEYS.UNITS_INFO) || {};
      return allUnitsInfo[projectId] || null;
    } catch (error) {
      console.error('❌ Error getting units info:', error);
      return null;
    }
  },

  updateUnitsInfo: async (projectId, unitsInfo) => {
    try {
      const allUnitsInfo = await StorageService.getItem(STORAGE_KEYS.UNITS_INFO) || {};
      
      // Si no existe la entrada para este projectId, la creamos
      if (!allUnitsInfo[projectId]) {
        allUnitsInfo[projectId] = {};
      }
      
      // Actualizar la información de unidades
      allUnitsInfo[projectId] = {
        ...allUnitsInfo[projectId],
        ...unitsInfo,
        updatedAt: new Date().toISOString()
      };
      
      await StorageService.setItem(STORAGE_KEYS.UNITS_INFO, allUnitsInfo);
      return { success: true, data: allUnitsInfo[projectId] };
    } catch (error) {
      console.error('❌ Error updating units info:', error);
      throw error;
    }
  }
};

// Project type operations
export const ProjectTypeService = {
  // Guardar tipo de proyecto
  saveProjectType: async (projectId, projectType) => {
    try {
      const allProjectTypes = await StorageService.getItem(STORAGE_KEYS.PROJECT_TYPES) || {};
      allProjectTypes[projectId] = {
        ...projectType,
        updatedAt: new Date().toISOString()
      };
      
      await StorageService.setItem(STORAGE_KEYS.PROJECT_TYPES, allProjectTypes);
      return allProjectTypes[projectId];
    } catch (error) {
      console.error('❌ Error saving project type:', error);
      throw error;
    }
  },

  // Obtener tipo de proyecto
  getProjectType: async (projectId) => {
    try {
      const allProjectTypes = await StorageService.getItem(STORAGE_KEYS.PROJECT_TYPES) || {};
      return allProjectTypes[projectId] || null;
    } catch (error) {
      console.error('❌ Error getting project type:', error);
      return null;
    }
  },

  updateProjectType: async (projectId, projectType) => {
    try {
      const allProjectTypes = await StorageService.getItem(STORAGE_KEYS.PROJECT_TYPES) || {};
      
      // Si no existe la entrada para este projectId, la creamos
      if (!allProjectTypes[projectId]) {
        allProjectTypes[projectId] = {};
      }
      
      // Actualizar el tipo de proyecto
      allProjectTypes[projectId] = {
        ...allProjectTypes[projectId],
        ...projectType,
        updatedAt: new Date().toISOString()
      };
      
      await StorageService.setItem(STORAGE_KEYS.PROJECT_TYPES, allProjectTypes);
      return { success: true, data: allProjectTypes[projectId] };
    } catch (error) {
      console.error('❌ Error updating project type:', error);
      throw error;
    }
  }
};

// Node operations (Graph)
export const NodeService = {
  // Crear nodo
  createNode: async (nodeData) => {
    try {
      const nodes = await NodeService.getNodes();
      const newNode = {
        id: Date.now().toString(),
        ...nodeData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      nodes.push(newNode);
      await StorageService.setItem(STORAGE_KEYS.NODES, nodes);

      return newNode;
    } catch (error) {
      console.error('❌ Error creating node:', error);
      throw error;
    }
  },

  // Obtener todos los nodos
  getNodes: async () => {
    try {
      const nodes = await StorageService.getItem(STORAGE_KEYS.NODES);
      return nodes || [];
    } catch (error) {
      console.error('❌ Error getting nodes:', error);
      return [];
    }
  },

  // Obtener nodos por proyecto
  getNodesByProject: async (projectId) => {
    try {
      const nodes = await NodeService.getNodes();
      return nodes.filter(node => node.project_id === projectId);
    } catch (error) {
      console.error('❌ Error getting nodes by project:', error);
      return [];
    }
  },

  // Obtener nodos por tipo
  getNodesByType: async (projectId, nodeType) => {
    try {
      const nodes = await NodeService.getNodes();
      return nodes.filter(node => 
        node.project_id === projectId && node.type === nodeType
      );
    } catch (error) {
      console.error('❌ Error getting nodes by type:', error);
      return [];
    }
  },

  updateNodeDevice: async (nodeId, device) => {
    try {
      const allNodes = await StorageService.getItem(STORAGE_KEYS.NODES) || [];
      const updatedNodes = allNodes.map(node =>
        node.id === nodeId ? { ...node, device, device_id: device.id } : node
      );
      await StorageService.setItem(STORAGE_KEYS.NODES, updatedNodes);
      return true;
    } catch (error) {
      console.error('Error updating node device:', error);
      throw error;
    }
  },

  updateNodeFiber: async (nodeId, fiber) => {
    try {
      const allNodes = await StorageService.getItem(STORAGE_KEYS.NODES) || [];
      const updatedNodes = allNodes.map(node =>
        node.id === nodeId ? { ...node, fiber, fiber_type: fiber.type } : node
      );
      await StorageService.setItem(STORAGE_KEYS.NODES, updatedNodes);
      return true;
    } catch (error) {
      console.error('Error updating node fiber:', error);
      throw error;
    }
  },

  // Función para actualizar cualquier campo del nodo
  updateNode: async (nodeId, updates) => {
    try {
      const allNodes = await StorageService.getItem(STORAGE_KEYS.NODES) || [];
      const updatedNodes = allNodes.map(node =>
        node.id === nodeId ? { ...node, ...updates } : node
      );
      await StorageService.setItem(STORAGE_KEYS.NODES, updatedNodes);
      return true;
    } catch (error) {
      console.error('Error updating node:', error);
      throw error;
    }
  },

  deleteNode: async (nodeId) => {
    try {
      const allNodes = await StorageService.getItem(STORAGE_KEYS.NODES) || [];
      
      // Filtrar el nodo a eliminar
      const updatedNodes = allNodes.filter(node => node.id !== nodeId);
      
      // Guardar la nueva lista de nodos
      await StorageService.setItem(STORAGE_KEYS.NODES, updatedNodes);
      
      console.log('✅ Node deleted successfully:', nodeId);
      return { success: true, rowsAffected: 1 };
    } catch (error) {
      console.error('❌ Error deleting node:', error);
      throw error;
    }
  }
};

export const FileService = {
  // Guardar archivo adjunto
  async saveProjectFile(projectId, file) {
    try {
      // Leer el contenido del archivo
      const fileContent = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const fileData = {
        id: Date.now().toString(),
        projectId,
        name: file.name,
        type: file.type,
        size: file.size,
        content: fileContent,
        uploaded: new Date().toISOString(),
      };

      // Guardar en AsyncStorage
      const existingFiles = await this.getProjectFiles(projectId);
      const updatedFiles = [...existingFiles, fileData];
      
      await AsyncStorage.setItem(
        `${FILES_KEY}_${projectId}`,
        JSON.stringify(updatedFiles)
      );

      return fileData;
    } catch (error) {
      console.error('Error saving file:', error);
      throw error;
    }
  },

  // Obtener archivos de un proyecto
  async getProjectFiles(projectId) {
    try {
      const filesJson = await AsyncStorage.getItem(`${FILES_KEY}_${projectId}`);
      return filesJson ? JSON.parse(filesJson) : [];
    } catch (error) {
      console.error('Error getting files:', error);
      return [];
    }
  },

  // Eliminar archivo
  async deleteFile(projectId, fileId) {
    try {
      const files = await this.getProjectFiles(projectId);
      const updatedFiles = files.filter(file => file.id !== fileId);
      
      await AsyncStorage.setItem(
        `${FILES_KEY}_${projectId}`,
        JSON.stringify(updatedFiles)
      );
      
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  },

  // Descargar archivo
  async downloadFile(file, fileName = null) {
    try {
      const fileUri = FileSystem.documentDirectory + (fileName || file.name);
      
      await FileSystem.writeAsStringAsync(fileUri, file.content, {
        encoding: FileSystem.EncodingType.Base64,
      });

      return fileUri;
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  },
};

// Initialize storage
// export const initializeStorage = async () => {
//   try {
//     // Initialize empty arrays for all storage keys
//     const keys = Object.values(STORAGE_KEYS);
    
//     for (const key of keys) {
//       const data = await StorageService.getItem(key);
//       if (data === null) {
//         if (key === STORAGE_KEYS.UNITS_INFO || key === STORAGE_KEYS.PROJECT_TYPES) {
//           await StorageService.setItem(key, {});
//         } else {
//           await StorageService.setItem(key, []);
//         }
//       }
//     }

//     console.log('✅ Storage initialized successfully');
//     return true;
//   } catch (error) {
//     console.error('❌ Error initializing storage:', error);
//     return false;
//   }
// };
export const initializeStorage = async () => {
  try {
    // Initialize empty arrays for all storage keys
    const keys = Object.values(STORAGE_KEYS);
    
    for (const key of keys) {
      const data = await StorageService.getItem(key);
      if (data === null) {
        if (key === STORAGE_KEYS.UNITS_INFO || 
            key === STORAGE_KEYS.PROJECT_TYPES) {
          await StorageService.setItem(key, {});
        } else {
          await StorageService.setItem(key, []);
        }
      }
    }

    console.log('✅ Storage initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Error initializing storage:', error);
    return false;
  }
};

// Función para obtener un proyecto completo con todos sus datos relacionados
export const getCompleteProjectData = async (projectId) => {
  try {
    const project = await ProjectService.getProjectById(projectId);
    if (!project) return null;

    // Obtener mapas de red asociados a este proyecto
    const networkMaps = await NetworkMapService.getNetworkMapById(projectId);
    
    // Obtener otros datos relacionados si es necesario (unidades, nodos, etc.)
    // const units = await UnitsService.getUnitsByProjectId(projectId);
    // const nodes = await NodeService.getNodesByProject(projectId);

    return {
      ...project,
      networkMaps,
      // units,
      // nodes,
      // otros datos que quieras incluir
    };
  } catch (error) {
    console.error('Error getting complete project data:', error);
    throw error;
  }
};

// Función para exportar los datos del proyecto en formato QR (string claro)
export const exportProjectData = async (projectId) => {
  try {
    console.log('📱 exportProjectData received:', typeof projectId, projectId);
    
    let projectId_value = null;
    let address_value = 'N/A';

    // Si es un objeto con metadata (viene del FlatList)
    if (typeof projectId === 'object' && projectId !== null) {
      // Intentar extraer del metadata JSON
      if (projectId.metadata) {
        try {
          const metadata = JSON.parse(projectId.metadata);
          projectId_value = metadata.id;
          address_value = metadata.address || projectId.address || 'N/A';
          console.log('✅ Extracted from metadata:', projectId_value, address_value);
        } catch (e) {
          console.warn('Could not parse metadata, using direct fields:', e);
          projectId_value = projectId.id;
          address_value = projectId.address || 'N/A';
        }
      } else {
        // Si no tiene metadata, usar los campos directos
        projectId_value = projectId.id;
        address_value = projectId.address || 'N/A';
      }
    } else {
      // Si es un string ID, buscar en storage
      projectId_value = projectId;
      const project = await ProjectService.getProjectById(projectId);
      if (project) {
        address_value = project.address || 'N/A';
      }
    }

    if (!projectId_value) {
      throw new Error('Could not extract project ID');
    }

    // Generar string claro para el QR: "PrismaSolutionsGroup, [id], [address]"
    const qrData = `PrismaSolutionsGroup, ${projectId_value}, ${address_value}`;
    console.log('✅ QR data generated:', qrData);
    return qrData;
  } catch (error) {
    console.error('❌ Error exporting project data:', error);
    throw error;
  }
};

// Export main services
export default {
  StorageService,
  ProjectService,
  UnitsService,
  ProjectTypeService,
  NodeService,
  NetworkMapService,
  DeviceConfigService,
  FiberConfigService,
  FileService,
  getCompleteProjectData,
  exportProjectData,
  initializeStorage
};