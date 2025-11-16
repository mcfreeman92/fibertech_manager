// hooks/useFiberPath.js
import { useMemo } from 'react';

export function useFiberPath(graph, fibers) {
  const pathFinder = useMemo(() => ({
    findPath: (startUnitId, endUnitId) => findFiberPath(graph, fibers, startUnitId, endUnitId)
  }), [graph, fibers]);

  return pathFinder;
}

// utils/fiberPathFinder.js
export function findFiberPath(graph, fibers, startUnitId, endUnitId) {
  // Validaciones básicas
  if (startUnitId === endUnitId) {
    return {
      success: false,
      path: [],
      totalHops: 0,
      error: 'Las unidades de inicio y fin son la misma'
    };
  }

  // Crear mapa de unidades y fibras
  const unitMap = new Map();
  const fiberMap = new Map();
  
  graph.forEach(unit => {
    unitMap.set(unit.id, unit);
  });
  
  fibers.forEach(fiber => {
    fiberMap.set(fiber.id, fiber);
  });

  // Verificar que existen las unidades
  if (!unitMap.has(startUnitId) || !unitMap.has(endUnitId)) {
    return {
      success: false,
      path: [],
      totalHops: 0,
      error: 'Una o ambas unidades no existen en el grafo'
    };
  }

  // BFS para encontrar la ruta
  const visited = new Set();
  const queue = [{
    currentUnitId: startUnitId,
    path: [],
    visitedUnits: new Set([startUnitId])
  }];

  while (queue.length > 0) {
    const currentState = queue.shift();
    const currentUnitId = currentState.currentUnitId;
    const currentPath = currentState.path;
    const currentVisitedUnits = currentState.visitedUnits;

    // Si llegamos a la unidad objetivo
    if (currentUnitId === endUnitId) {
      const startUnit = unitMap.get(startUnitId);
      const endUnit = unitMap.get(endUnitId);
      
      return {
        success: true,
        path: currentPath,
        totalHops: currentPath.length,
        start: { 
          unitId: startUnitId, 
          unitLabel: startUnit?.label || `Unit_${startUnitId}`
        },
        end: { 
          unitId: endUnitId, 
          unitLabel: endUnit?.label || `Unit_${endUnitId}`
        }
      };
    }

    if (visited.has(currentUnitId)) continue;
    visited.add(currentUnitId);

    const currentUnit = unitMap.get(currentUnitId);
    if (!currentUnit) continue;

    // Explorar todos los dispositivos y sus conexiones en esta unidad
    for (const device of currentUnit.devices) {
      if (device.links && device.links.length > 0) {
        for (const link of device.links) {
          const fiberInfo = link.src;
          
          // Encontrar todas las unidades conectadas a esta fibra/hilo
          const connectedUnits = findConnectedUnits(graph, currentUnitId, fiberInfo);

          for (const connectedUnit of connectedUnits) {
            const nextUnitId = connectedUnit.unit.id;

            // Evitar ciclos
            if (currentVisitedUnits.has(nextUnitId)) continue;

            // Obtener información de la fibra
            const fiber = fiberMap.get(fiberInfo.fiberId);
            const threadColor = getThreadColor(fiber, fiberInfo.thread);

            // Crear nuevo paso en el camino
            const newStep = {
              from: {
                unitId: currentUnitId,
                unitLabel: currentUnit.label,
                deviceHash: device.hash,
                deviceLabel: device.label + " " + device.description,
                port: link.port
              },
              through: {
                fiberId: fiberInfo.fiberId,
                fiberLabel: fiber?.label || `Fiber_${fiberInfo.fiberId}`,
                bufferId: fiberInfo.bufferId,
                thread: fiberInfo.thread,
                threadColor: threadColor
              },
              to: {
                unitId: connectedUnit.unit.id,
                unitLabel: connectedUnit.unit.label,
                deviceHash: connectedUnit.device.hash,
                deviceLabel: connectedUnit.device.label + connectedUnit.device.description,
                port: connectedUnit.port
              }
            };

            // Crear nuevos arrays/sets para el siguiente estado
            const newPath = [...currentPath, newStep];
            const newVisitedUnits = new Set([...currentVisitedUnits, nextUnitId]);

            // Agregar a la cola
            queue.push({
              currentUnitId: nextUnitId,
              path: newPath,
              visitedUnits: newVisitedUnits
            });
          }
        }
      }
    }
  }

  return {
    success: false,
    path: [],
    totalHops: 0,
    error: 'No se encontró ruta entre las unidades especificadas'
  };
}

// Función auxiliar para encontrar unidades conectadas
function findConnectedUnits(graph, sourceUnitId, fiberInfo) {
  const results = [];
  
  for (const unit of graph) {
    // Excluir la unidad de origen
    if (unit.id === sourceUnitId) continue;
    
    for (const device of unit.devices) {
      if (device.links) {
        for (const link of device.links) {
          const src = link.src;
          // Buscar conexiones en la misma fibra/hilo
          if (src.fiberId === fiberInfo.fiberId && 
              src.bufferId === fiberInfo.bufferId && 
              src.thread === fiberInfo.thread) {
            results.push({
              unit,
              device,
              port: link.port
            });
          }
        }
      }
    }
  }
  
  return results;
}

// Función para obtener el color del hilo
function getThreadColor(fiber, threadNumber) {
  if (!fiber || !fiber.threads) return '#CCCCCC';
  
  const thread = fiber.threads.find(t => t.number === threadNumber);
  return thread ? thread.color : '#CCCCCC';
}

// Utilidad para formatear la ruta para display
export function formatPathForDisplay(pathResult) {
  if (!pathResult.success) {
    return { title: 'No se encontró ruta', steps: [] };
  }

  const steps = pathResult.path.map((step, index) => ({
    number: index + 1,
    from: `${step.from.unitLabel} (${step.from.deviceLabel}:Puerto ${step.from.port})`,
    through: `${step.through.fiberLabel} - Hilo ${step.through.thread}`,
    to: `${step.to.unitLabel} (${step.to.deviceLabel}:Puerto ${step.to.port})`,
    color: step.through.threadColor
  }));

  return {
    title: `Ruta de ${pathResult.start.unitLabel} a ${pathResult.end.unitLabel}`,
    steps: steps,
    totalHops: pathResult.totalHops
  };
}