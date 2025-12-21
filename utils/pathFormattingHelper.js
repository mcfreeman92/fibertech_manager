/**
 * PathFormattingHelper.js
 * 
 * Mejoras para formatear y presentar rutas de manera clara
 * con vistas resumidas y detalladas
 */

/**
 * Formatea una ruta para vista resumida (abreviada)
 * Muestra solo nodos principales sin detalles
 * 
 * @param {Array} path - El path completo del pathfinding
 * @param {Array} nodes - Array de todos los nodos (para lookup de etiquetas)
 * @returns {string} Representación resumida ej: "U1 → Pedestal2 → MDF"
 */
export const formatPathSummary = (path = [], nodes = []) => {
  if (!Array.isArray(path) || path.length === 0) {
    return "No hay ruta";
  }
  
  // Crear mapa de nodos para búsqueda rápida
  const nodeMap = new Map();
  nodes.forEach(node => {
    const key = node.id || node.hash;
    nodeMap.set(key, node);
  });
  
  // Extraer nodos únicos del camino en orden
  const visitedNodeIds = new Set();
  const uniqueNodes = [];
  
  path.forEach(step => {
    let nodeId = null;
    
    // Extraer nodeId dependiendo del tipo de paso
    if (step.from?.nodeId && !visitedNodeIds.has(step.from.nodeId)) {
      nodeId = step.from.nodeId;
      uniqueNodes.push({
        id: step.from.nodeId,
        label: step.from.nodeLabel || 'Unknown'
      });
      visitedNodeIds.add(step.from.nodeId);
    }
    
    // Nodo de fusión si existe
    if (step.throughFusion?.fusionNodeId && !visitedNodeIds.has(step.throughFusion.fusionNodeId)) {
      nodeId = step.throughFusion.fusionNodeId;
      uniqueNodes.push({
        id: step.throughFusion.fusionNodeId,
        label: step.throughFusion.fusionNodeLabel || 'Unknown'
      });
      visitedNodeIds.add(step.throughFusion.fusionNodeId);
    }
    
    if (step.to?.nodeId && !visitedNodeIds.has(step.to.nodeId)) {
      nodeId = step.to.nodeId;
      uniqueNodes.push({
        id: step.to.nodeId,
        label: step.to.nodeLabel || 'Unknown'
      });
      visitedNodeIds.add(step.to.nodeId);
    }
  });
  
  return uniqueNodes.map(n => n.label).join(' → ');
};

/**
 * Formatea una ruta para vista detallada (completa)
 * Muestra todos los pasos con información de fibras y conexiones
 * 
 * @param {Array} path - El path completo
 * @returns {Array} Array de objetos con información detallada de cada paso
 */
export const formatPathDetailed = (path = []) => {
  if (!Array.isArray(path) || path.length === 0) {
    return [];
  }
  
  return path.map((step, index) => {
    const details = {
      step: index + 1,
      type: step.type || 'unknown',
      from: {
        node: step.from?.nodeLabel || 'Unknown',
        device: step.from?.deviceLabel || 'N/A',
        port: step.from?.port || 'N/A'
      }
    };
    
    // Si hay fusión en el camino
    if (step.throughFusion) {
      details.fusion = {
        node: step.throughFusion.fusionNodeLabel || 'Unknown',
        entry: {
          fiber: step.throughFusion.entryFiberLabel,
          buffer: step.throughFusion.entryBufferId,
          thread: step.throughFusion.entryThread + 1 // Convertir a 1-based
        },
        exit: {
          fiber: step.throughFusion.exitFiberLabel,
          buffer: step.throughFusion.exitBufferId,
          thread: step.throughFusion.exitThread + 1 // Convertir a 1-based
        }
      };
    }
    
    details.to = {
      node: step.to?.nodeLabel || 'Unknown',
      device: step.to?.deviceLabel || 'N/A',
      port: step.to?.port || 'N/A'
    };
    
    return details;
  });
};

/**
 * Construye una representación visual/textual del path
 * Útil para debugging y UI
 * 
 * @param {Array} path - El path
 * @returns {string} Representación visual en multilinea
 */
export const visualizePathASCII = (path = []) => {
  if (!Array.isArray(path) || path.length === 0) {
    return "📭 No path found";
  }
  
  const lines = [];
  lines.push("📍 RUTA COMPLETA:");
  lines.push("================");
  
  path.forEach((step, index) => {
    lines.push(`\n[Paso ${index + 1}]`);
    lines.push(`├─ Desde: ${step.from?.nodeLabel || 'Unknown'} (${step.from?.deviceLabel})`);
    
    if (step.throughFusion) {
      lines.push(`├─ Fusión en: ${step.throughFusion.fusionNodeLabel}`);
      lines.push(`│  ├─ Entrada: ${step.throughFusion.entryFiberLabel} / H${step.throughFusion.entryThread + 1}`);
      lines.push(`│  └─ Salida: ${step.throughFusion.exitFiberLabel} / H${step.throughFusion.exitThread + 1}`);
    }
    
    lines.push(`└─ Hacia: ${step.to?.nodeLabel || 'Unknown'} (${step.to?.deviceLabel})`);
  });
  
  return lines.join("\n");
};

/**
 * Genera un resumen estadístico del path
 * 
 * @param {Array} path - El path
 * @returns {Object} Estadísticas del camino
 */
export const getPathStatistics = (path = []) => {
  const stats = {
    totalSteps: path.length,
    deviceConnections: 0,
    fusions: 0,
    uniqueNodes: new Set(),
    fiberTypes: new Set(),
    threadNumbers: new Set()
  };
  
  path.forEach(step => {
    // Contar conexiones de dispositivo
    if (step.from?.deviceLabel) stats.deviceConnections++;
    if (step.to?.deviceLabel) stats.deviceConnections++;
    
    // Contar fusiones
    if (step.throughFusion) {
      stats.fusions++;
      stats.fiberTypes.add(step.throughFusion.entryFiberLabel);
      stats.fiberTypes.add(step.throughFusion.exitFiberLabel);
      stats.threadNumbers.add(step.throughFusion.entryThread);
      stats.threadNumbers.add(step.throughFusion.exitThread);
    }
    
    // Registrar nodos únicos
    if (step.from?.nodeId) stats.uniqueNodes.add(step.from.nodeId);
    if (step.to?.nodeId) stats.uniqueNodes.add(step.to.nodeId);
    if (step.throughFusion?.fusionNodeId) stats.uniqueNodes.add(step.throughFusion.fusionNodeId);
  });
  
  return {
    totalSteps: stats.totalSteps,
    deviceConnections: stats.deviceConnections,
    fusionPoints: stats.fusions,
    uniqueNodesCount: stats.uniqueNodes.size,
    fibersInvolved: Array.from(stats.fiberTypes),
    threadsInvolved: Array.from(stats.threadNumbers)
  };
};

/**
 * Valida la integridad de un path
 * Verifica que sea un recorrido válido
 * 
 * @param {Array} path - El path a validar
 * @returns {Object} Resultado de validación
 */
export const validatePathIntegrity = (path = []) => {
  const errors = [];
  const warnings = [];
  
  if (!Array.isArray(path)) {
    errors.push('Path is not an array');
    return { valid: false, errors, warnings };
  }
  
  if (path.length === 0) {
    warnings.push('Path is empty');
    return { valid: false, errors, warnings };
  }
  
  // Validar cada paso
  path.forEach((step, index) => {
    if (!step.from) {
      errors.push(`Step ${index + 1}: Missing 'from' field`);
    }
    if (!step.to) {
      errors.push(`Step ${index + 1}: Missing 'to' field`);
    }
    
    // Si hay fusión, validar que tenga ambos lados
    if (step.throughFusion) {
      if (!step.throughFusion.entryFiberId) {
        errors.push(`Step ${index + 1}: Fusion missing entry fiber`);
      }
      if (!step.throughFusion.exitFiberId) {
        errors.push(`Step ${index + 1}: Fusion missing exit fiber`);
      }
    }
  });
  
  // Validar continuidad: la salida de un paso debería conectar con la entrada del siguiente
  // (Este es un check heurístico, no siempre se aplica según la lógica del pathfinding)
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stepCount: path.length
  };
};

export default {
  formatPathSummary,
  formatPathDetailed,
  visualizePathASCII,
  getPathStatistics,
  validatePathIntegrity
};
