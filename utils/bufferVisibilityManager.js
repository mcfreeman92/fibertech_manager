/**
 * BufferVisibilityManager.js
 * 
 * Gestiona la visibilidad dinámica de buffers en nodos intermedios.
 * 
 * Regla clave: Un buffer desaparece de un nodo tan pronto como
 * al menos 1 hilo se fusiona en ese nodo.
 */

/**
 * Verifica si un buffer ha sido consumido (fusionado) en un nodo específico
 * 
 * @param {Object} buffer - El buffer a verificar (con id y tipo)
 * @param {Object} node - El nodo donde verificar
 * @returns {boolean} true si el buffer tiene al menos una fusión en este nodo
 */
export const isBufferConsumedInNode = (buffer, node) => {
  if (!buffer || !node) return false;
  
  const bufferId = buffer.id;
  
  // Revisar si existe al menos una fusión que use este buffer en este nodo
  if (node.fusionLinks && Array.isArray(node.fusionLinks)) {
    return node.fusionLinks.some(fusion => {
      const { src, dst } = fusion;
      
      // Verificar si el buffer aparece en SRC o DST
      // ⚠️ IMPORTANTE: Comparar SOLO bufferId, NO con fiberId
      // Los buffers son elementos hijos de las fibras
      const bufferInSrc = src?.bufferId === bufferId;
      const bufferInDst = dst?.bufferId === bufferId;
      
      return bufferInSrc || bufferInDst;
    });
  }
  
  return false;
};

/**
 * Filtra buffers de una fibra removiendo los que ya fueron consumidos en un nodo
 * 
 * @param {Object} fiber - La fibra con sus buffers
 * @param {Object} currentNode - El nodo donde se está haciendo la operación
 * @param {Array} previousNodes - Nodos anteriores por donde pasó la fibra (opcional)
 * @returns {Object} Fibra con buffers filtrados
 */
export const getVisibleBuffersForNode = (fiber, currentNode, previousNodes = []) => {
  if (!fiber || !fiber.buffers || fiber.buffers.length === 0) {
    return fiber;
  }
  
  // Filtrar buffers que NO hayan sido consumidos en nodos anteriores
  const visibleBuffers = fiber.buffers.filter(buffer => {
    // Revisar si el buffer fue consumido en algún nodo anterior
    const consumedInPrevious = previousNodes.some(prevNode => 
      isBufferConsumedInNode(buffer, prevNode)
    );
    
    return !consumedInPrevious;
  });
  
  return {
    ...fiber,
    buffers: visibleBuffers
  };
};

/**
 * Obtiene el path de consumo de un buffer (en qué nodos fue fusionado)
 * 
 * @param {string} bufferId - ID del buffer a rastrear
 * @param {Array} allNodes - Todos los nodos del proyecto
 * @returns {Array} Array de nodos donde el buffer fue consumido
 */
export const getBufferConsumptionPath = (bufferId, allNodes) => {
  const consumptionPath = [];
  
  if (!allNodes || !Array.isArray(allNodes)) return consumptionPath;
  
  for (const node of allNodes) {
    if (isBufferConsumedInNode({ id: bufferId }, node)) {
      consumptionPath.push({
        nodeId: node.id,
        nodeLabel: node.label,
        nodeType: node.typeId,
        fusionCount: (node.fusionLinks || []).filter(f => {
          return (f.src?.bufferId === bufferId || f.src?.fiberId === bufferId) ||
                 (f.dst?.bufferId === bufferId || f.dst?.fiberId === bufferId);
        }).length
      });
    }
  }
  
  return consumptionPath;
};

/**
 * Determina si un buffer "pasa de largo" sin ser completamente consumido
 * 
 * @param {Object} buffer - El buffer
 * @param {Object} node - El nodo
 * @param {number} totalThreads - Total de hilos en el buffer (típicamente 12)
 * @returns {boolean} true si al menos 1 hilo está fusionado pero no todos
 */
export const doesBufferPassThrough = (buffer, node, totalThreads = 12) => {
  if (!buffer || !node) return false;
  
  const bufferId = buffer.id;
  let fusionCount = 0;
  
  if (node.fusionLinks && Array.isArray(node.fusionLinks)) {
    node.fusionLinks.forEach(fusion => {
      const { src, dst } = fusion;
      
      // Contar fusiones únicas de este buffer
      if ((src?.bufferId === bufferId || src?.fiberId === bufferId) ||
          (dst?.bufferId === bufferId || dst?.fiberId === bufferId)) {
        fusionCount++;
      }
    });
  }
  
  // Si hay al menos 1 fusión pero no están todos los hilos, "pasa de largo"
  return fusionCount > 0 && fusionCount < totalThreads;
};

export default {
  isBufferConsumedInNode,
  getVisibleBuffersForNode,
  getBufferConsumptionPath,
  doesBufferPassThrough
};
