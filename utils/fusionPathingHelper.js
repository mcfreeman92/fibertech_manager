/**
 * FusionPathingHelper.js
 * 
 * Mejoras para manejar fusiones de manera bidireccional en el pathfinding
 */

/**
 * Normaliza IDs para comparación consistente
 */
function normalizeId(id) {
  if (id === null || id === undefined) return null;
  const parsed = parseInt(id);
  return isNaN(parsed) ? String(id) : parsed;
}

/**
 * Obtiene ambos lados de una fusión de manera consistente
 * 
 * @param {Object} fusionLink - La fusión
 * @returns {Object} { side1, side2 } - Dos lados de la fusión
 */
export const getFusionSides = (fusionLink) => {
  if (!fusionLink) return { side1: null, side2: null };
  
  return {
    side1: {
      fiberId: fusionLink.src?.fiberId,
      bufferId: fusionLink.src?.bufferId,
      thread: fusionLink.src?.thread,
      fiberLabel: fusionLink.src?.fiberLabel,
      bufferLabel: fusionLink.src?.bufferLabel
    },
    side2: {
      fiberId: fusionLink.dst?.fiberId,
      bufferId: fusionLink.dst?.bufferId,
      thread: fusionLink.dst?.thread,
      fiberLabel: fusionLink.dst?.fiberLabel,
      bufferLabel: fusionLink.dst?.bufferLabel
    }
  };
};

/**
 * Obtiene el lado OPUESTO de una fusión dado uno de los lados
 * 
 * @param {Object} fusionLink - La fusión
 * @param {Object} knownSide - El lado que ya conocemos (fiberId, bufferId, thread)
 * @returns {Object} El lado opuesto de la fusión
 */
export const getOppositeFusionSide = (fusionLink, knownSide) => {
  if (!fusionLink || !knownSide) return null;
  
  const { fiberId, bufferId, thread } = knownSide;
  const { src, dst } = fusionLink;
  
  // Verificar si knownSide es el SRC
  const isKnownSideSrc = 
    (normalizeId(src?.fiberId) === normalizeId(fiberId) || normalizeId(src?.bufferId) === normalizeId(bufferId)) &&
    src?.thread === thread;
  
  // Si es SRC, retornar DST; si es DST, retornar SRC
  if (isKnownSideSrc) {
    return dst;
  } else {
    return src;
  }
};

/**
 * Verifica si una fusión involucra un hilo específico
 * (en CUALQUIERA de los dos lados)
 * 
 * @param {Object} fusionLink - La fusión
 * @param {string} fiberId - ID de la fibra
 * @param {string} bufferId - ID del buffer (opcional)
 * @param {number} thread - Número del hilo
 * @returns {boolean} true si la fusión involucra este hilo
 */
export const doesFusionInvolveThread = (fusionLink, fiberId, bufferId = null, thread = null) => {
  if (!fusionLink) return false;
  
  const { src, dst } = fusionLink;
  
  // Verificar lado SRC
  const srcMatch = 
    (normalizeId(src?.fiberId) === normalizeId(fiberId) || 
     normalizeId(src?.bufferId) === normalizeId(bufferId)) &&
    (thread === null || src?.thread === thread);
  
  // Verificar lado DST
  const dstMatch = 
    (normalizeId(dst?.fiberId) === normalizeId(fiberId) || 
     normalizeId(dst?.bufferId) === normalizeId(bufferId)) &&
    (thread === null || dst?.thread === thread);
  
  return srcMatch || dstMatch;
};

/**
 * Construye el historial completo bidireccional de una fusión
 * Útil para mostrar "de dónde vino" y "a dónde va"
 * 
 * @param {Object} fusionLink - La fusión
 * @param {Object} fromNode - El nodo desde donde llegamos
 * @param {string} fromFiberId - La fibra de entrada
 * @returns {Object} Descripción bidireccional clara de la fusión
 */
export const buildFusionContext = (fusionLink, fromNode, fromFiberId) => {
  const { src, dst } = fusionLink;
  
  // Determinar cuál es la entrada y cuál es la salida
  const entryIsSrc = normalizeId(src?.fiberId) === normalizeId(fromFiberId);
  
  return {
    fusionHash: fusionLink.hash,
    bidirectional: true,
    entry: entryIsSrc ? src : dst,
    exit: entryIsSrc ? dst : src,
    reversal: !entryIsSrc, // true si la fusión se atraviesa en dirección opuesta al almacenamiento
    description: `${entryIsSrc ? 'SRC→DST' : 'DST→SRC'} (fusión bidireccional)`
  };
};

/**
 * Valida la integridad de una fusión bidireccional
 * Asegura que ambos lados tengan información válida
 * 
 * @param {Object} fusionLink - La fusión a validar
 * @returns {Object} Resultado de validación con detalles de errores
 */
export const validateFusionIntegrity = (fusionLink) => {
  const errors = [];
  const warnings = [];
  
  if (!fusionLink) {
    errors.push('fusionLink es null o undefined');
    return { valid: false, errors, warnings };
  }
  
  const { src, dst, hash } = fusionLink;
  
  if (!src) errors.push('Side SRC is missing');
  if (!dst) errors.push('Side DST is missing');
  
  if (src) {
    if (!src.fiberId && !src.bufferId) errors.push('SRC: Neither fiberId nor bufferId provided');
    if (src.thread === null || src.thread === undefined) errors.push('SRC: thread is missing');
  }
  
  if (dst) {
    if (!dst.fiberId && !dst.bufferId) errors.push('DST: Neither fiberId nor bufferId provided');
    if (dst.thread === null || dst.thread === undefined) errors.push('DST: thread is missing');
  }
  
  if (!hash) warnings.push('hash is missing - fusion may not be persisted correctly');
  
  // Validar que no sea una auto-fusión (un hilo consigo mismo)
  if (src && dst) {
    const srcId = normalizeId(src.fiberId || src.bufferId);
    const dstId = normalizeId(dst.fiberId || dst.bufferId);
    
    if (srcId === dstId && src.thread === dst.thread) {
      errors.push('Self-fusion detected: same fiber/buffer and thread on both sides');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Genera un reporte bidireccional de todas las fusiones en un nodo
 * 
 * @param {Object} node - El nodo
 * @returns {Array} Array de fusiones documentadas bidireccionally
 */
export const generateFusionReport = (node) => {
  if (!node || !Array.isArray(node.fusionLinks)) return [];
  
  return node.fusionLinks.map(fusion => {
    const validation = validateFusionIntegrity(fusion);
    const { side1, side2 } = getFusionSides(fusion);
    
    return {
      fusionHash: fusion.hash,
      node: node.label,
      sides: { side1, side2 },
      bidirectionalValid: validation.valid,
      validationErrors: validation.errors,
      validationWarnings: validation.warnings,
      canTraverseBothWays: validation.valid
    };
  });
};

export default {
  getFusionSides,
  getOppositeFusionSide,
  doesFusionInvolveThread,
  buildFusionContext,
  validateFusionIntegrity,
  generateFusionReport
};
