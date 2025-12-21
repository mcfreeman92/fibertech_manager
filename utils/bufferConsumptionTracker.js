/**
 * BufferConsumptionTracker.js
 * 
 * Sistema de tracking para saber dónde y cuándo se consumió cada buffer
 * en la red de fibra óptica.
 */

/**
 * Registra el consumo de un buffer en un nodo específico
 * 
 * @param {Object} node - El nodo donde se está registrando la fusión
 * @param {string} bufferId - ID del buffer a rastrear
 * @param {Object} fusionLink - La fusión que consume el buffer
 * @returns {Object} Registro de consumo
 */
export const recordBufferConsumption = (node, bufferId, fusionLink) => {
  return {
    bufferId,
    nodeId: node.id,
    nodeLabel: node.label,
    nodeType: node.typeId,
    fusionHash: fusionLink.hash,
    timestamp: new Date().toISOString(),
    fusion: {
      src: fusionLink.src,
      dst: fusionLink.dst
    }
  };
};

/**
 * Construye un mapa de consumo de buffers a partir de todos los nodos
 * 
 * @param {Array} allNodes - Todos los nodos del proyecto
 * @returns {Map} Mapa donde clave=bufferId, valor=Array de consumos
 */
export const buildBufferConsumptionMap = (allNodes = []) => {
  const consumptionMap = new Map();
  
  if (!Array.isArray(allNodes)) return consumptionMap;
  
  for (const node of allNodes) {
    if (!node.fusionLinks || !Array.isArray(node.fusionLinks)) continue;
    
    for (const fusion of node.fusionLinks) {
      const { src, dst } = fusion;
      
      // Obtener IDs de buffers de ambos lados de la fusión
      const srcBufferId = src?.bufferId || src?.fiberId;
      const dstBufferId = dst?.bufferId || dst?.fiberId;
      
      // Registrar consumo del buffer SRC
      if (srcBufferId) {
        if (!consumptionMap.has(srcBufferId)) {
          consumptionMap.set(srcBufferId, []);
        }
        consumptionMap.get(srcBufferId).push(recordBufferConsumption(node, srcBufferId, fusion));
      }
      
      // Registrar consumo del buffer DST
      if (dstBufferId && dstBufferId !== srcBufferId) {
        if (!consumptionMap.has(dstBufferId)) {
          consumptionMap.set(dstBufferId, []);
        }
        consumptionMap.get(dstBufferId).push(recordBufferConsumption(node, dstBufferId, fusion));
      }
    }
  }
  
  return consumptionMap;
};

/**
 * Obtiene dónde fue consumido un buffer específico
 * 
 * @param {string} bufferId - ID del buffer
 * @param {Map} consumptionMap - Mapa de consumo (creado con buildBufferConsumptionMap)
 * @returns {Array} Array de consumos ordenados por timestamp
 */
export const getBufferConsumptionInfo = (bufferId, consumptionMap) => {
  const consumptions = consumptionMap.get(bufferId) || [];
  
  // Ordenar por timestamp para ver la secuencia
  return consumptions.sort((a, b) => 
    new Date(a.timestamp) - new Date(b.timestamp)
  );
};

/**
 * Verifica si un buffer fue completamente consumido en un nodo específico
 * (todos sus 12 hilos están fusionados)
 * 
 * @param {Object} buffer - El buffer (debe tener id y threads)
 * @param {Object} node - El nodo a verificar
 * @returns {boolean} true si todos los hilos del buffer están fusionados en este nodo
 */
export const isBufferFullyConsumedInNode = (buffer, node) => {
  if (!buffer || !node || !Array.isArray(buffer.threads)) return false;
  
  const bufferId = buffer.id;
  const totalActiveThreads = buffer.threads.filter(t => t.active).length;
  let fusedThreads = 0;
  
  if (node.fusionLinks && Array.isArray(node.fusionLinks)) {
    const fusedSet = new Set();
    
    node.fusionLinks.forEach(fusion => {
      const { src, dst } = fusion;
      
      // Contar threads únicos de este buffer que están fusionados
      if ((src?.bufferId === bufferId || src?.fiberId === bufferId) && src?.thread !== undefined) {
        fusedSet.add(src.thread);
      }
      if ((dst?.bufferId === bufferId || dst?.fiberId === bufferId) && dst?.thread !== undefined) {
        fusedSet.add(dst.thread);
      }
    });
    
    fusedThreads = fusedSet.size;
  }
  
  // Buffer completamente consumido si todos sus hilos activos están fusionados
  return fusedThreads > 0 && fusedThreads >= totalActiveThreads;
};

/**
 * Obtiene el "estado" de un buffer en un nodo
 * 
 * @param {Object} buffer - El buffer
 * @param {Object} node - El nodo
 * @returns {string} 'not-started', 'partial', o 'completed'
 */
export const getBufferStatusInNode = (buffer, node) => {
  if (!buffer || !node || !node.fusionLinks) return 'not-started';
  
  const bufferId = buffer.id;
  const totalActiveThreads = buffer.threads?.filter(t => t.active).length || 12;
  
  let fusedThreads = 0;
  const fusedSet = new Set();
  
  node.fusionLinks.forEach(fusion => {
    const { src, dst } = fusion;
    
    if ((src?.bufferId === bufferId || src?.fiberId === bufferId) && src?.thread !== undefined) {
      fusedSet.add(src.thread);
    }
    if ((dst?.bufferId === bufferId || dst?.fiberId === bufferId) && dst?.thread !== undefined) {
      fusedSet.add(dst.thread);
    }
  });
  
  fusedThreads = fusedSet.size;
  
  if (fusedThreads === 0) return 'not-started';
  if (fusedThreads >= totalActiveThreads) return 'completed';
  return 'partial';
};

/**
 * Genera un reporte de consumo para debugging
 * 
 * @param {Array} allNodes - Todos los nodos
 * @returns {Object} Reporte detallado
 */
export const generateConsumptionReport = (allNodes = []) => {
  const consumptionMap = buildBufferConsumptionMap(allNodes);
  const report = {
    totalBuffersTracked: consumptionMap.size,
    bufferDetails: [],
    nodesSummary: {}
  };
  
  // Detalles por buffer
  for (const [bufferId, consumptions] of consumptionMap) {
    report.bufferDetails.push({
      bufferId,
      consumptionCount: consumptions.length,
      nodes: consumptions.map(c => c.nodeLabel)
    });
  }
  
  // Resumen por nodo
  for (const node of allNodes) {
    if (node.fusionLinks && node.fusionLinks.length > 0) {
      report.nodesSummary[node.label] = {
        fusionCount: node.fusionLinks.length,
        buffersInvolved: new Set()
      };
      
      node.fusionLinks.forEach(fusion => {
        if (fusion.src?.bufferId) report.nodesSummary[node.label].buffersInvolved.add(fusion.src.bufferId);
        if (fusion.dst?.bufferId) report.nodesSummary[node.label].buffersInvolved.add(fusion.dst.bufferId);
      });
      
      report.nodesSummary[node.label].buffersInvolved = Array.from(report.nodesSummary[node.label].buffersInvolved);
    }
  }
  
  return report;
};

export default {
  recordBufferConsumption,
  buildBufferConsumptionMap,
  getBufferConsumptionInfo,
  isBufferFullyConsumedInNode,
  getBufferStatusInNode,
  generateConsumptionReport
};
