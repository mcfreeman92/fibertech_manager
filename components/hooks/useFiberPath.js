// hooks/useFiberPath.js
import { useMemo } from 'react';

export function useFiberPath(graph, fibers) {
  const pathFinder = useMemo(() => ({
    findPath: (startUnitId, endUnitId) => findAllFiberPaths(graph, fibers, startUnitId, endUnitId)
  }), [graph, fibers]);

  return pathFinder;
}

/**
 * Normaliza IDs para comparación consistente
 * Maneja tanto números como strings
 */
function normalizeId(id) {
  if (id === null || id === undefined) return null;
  const parsed = parseInt(id);
  return isNaN(parsed) ? String(id) : parsed;
}

/**
 * Convierte número de thread a etiqueta legible
 * Thread 1 → H1, Thread 2 → H2, etc.
 */
function getThreadLabel(threadNumber) {
  if (!threadNumber && threadNumber !== 0) return 'Unknown';
  return `H${threadNumber}`;
}

/**
 * Encuentra todos los nodos conectados a una fibra/hilo específico
 * Busca TANTO en device links COMO en fusion links
 * 
 * CRÍTICO: Si una fibra está fusionada en un nodo, este nodo debe aparecer como conexión
 */
function findNodesConnectedToFiber(nodeMap, excludeNodeId, fiberInfo, fiberMap) {
  const { fiberId, bufferId, thread } = fiberInfo;
  const connections = [];

  console.log(`      🔎 Buscando conexiones para Fiber:${fiberId} Buffer:${bufferId} Thread:${thread}`);

  for (const [nodeId, node] of nodeMap) {
    if (nodeId === excludeNodeId) continue; // No conectar con uno mismo

    // ============================================================
    // BÚSQUEDA 1: Device Links (conexiones directas en dispositivos)
    // ============================================================
    if (node.devices) {
      for (const device of node.devices) {
        if (!device.links) continue;

        for (const link of device.links) {
          const src = link.src;
          if (src?.fiberId === fiberId && 
              src?.bufferId === bufferId && 
              src?.thread === thread) {
            
            // Verificar que el hilo esté disponible
            const fiber = fiberMap.get(normalizeId(fiberId));
            const threadObj = fiber?.threads?.find(t => t.number === thread);
            
            if (threadObj && threadObj.active) {
              console.log(`        ✅ Device Link encontrado: ${node.label} | ${device.label} | Puerto ${link.port}`);
              connections.push({
                nodeId: nodeId,
                nodeLabel: node.label,
                deviceLabel: device.label + ' ' + (device.description || ''),
                port: link.port,
                type: 'device-link'
              });
            }
          }
        }
      }
    }

    // ============================================================
    // BÚSQUEDA 2: Fusion Links (fusiones en el nodo) - BIDIRECCIONAL
    // ============================================================
    // CRÍTICO: Una fusión es BIDIRECCIONAL
    // Si llegamos por un hilo en SRC, podemos salir por DST (y vice versa)
    // La búsqueda debe funcionar en AMBAS direcciones
    // IMPORTANTE: Los threads en devices son 1-indexed, en fusiones son 0-indexed
    if (node.fusionLinks) {
      for (const fusionLink of node.fusionLinks) {
        const { src, dst } = fusionLink;
        
        // Normalizar: thread de device (1-indexed) a fusion (0-indexed)
        const threadNormalized = thread ? thread - 1 : 0;
        
        // ¿La fusión tiene este hilo en el lado SRC?
        const matchesSrc = src?.fiberId === fiberId && 
                          (src?.bufferId === bufferId || (bufferId === null && src?.bufferId === null)) &&
                          (src?.thread === thread || src?.thread === threadNormalized);
        
        // ¿La fusión tiene este hilo en el lado DST?
        const matchesDst = dst?.fiberId === fiberId && 
                          (dst?.bufferId === bufferId || (bufferId === null && dst?.bufferId === null)) &&
                          (dst?.thread === thread || dst?.thread === threadNormalized);
        
        if (matchesSrc || matchesDst) {
          const entryPoint = matchesSrc ? 'SRC' : 'DST';
          const exitPoint = matchesSrc ? 'DST' : 'SRC';
          console.log(`        ✅ Fusion Link BIDIRECCIONAL encontrado: ${node.label} | Entrada: ${entryPoint} → Salida: ${exitPoint}`);
          console.log(`           Fibra: ${fiberId} | Buffer: ${bufferId} | Thread: ${thread} (normalized: ${threadNormalized})`);
          // Este nodo tiene una fusión con la fibra que buscamos
          // Lo agregamos como conexión para que el pathfinding explore la fusión en ambas direcciones
          connections.push({
            nodeId: nodeId,
            nodeLabel: node.label,
            deviceLabel: 'Fusion Point',
            port: 'fusion',
            type: 'fusion-point',
            fusionLink: fusionLink,
            matchedSide: matchesSrc ? 'src' : 'dst'  // Qué lado de la fusión coincide
          });
        }
      }
    }
  }

  console.log(`      📊 Total conexiones encontradas: ${connections.length}`);
  return connections;
}

/**
 * Obtiene el color de un hilo específico
 */
function getThreadColor(fiber, threadNumber) {
  if (!fiber || !fiber.threads) return '#CCCCCC';
  const thread = fiber.threads.find(t => t.number === threadNumber);
  return thread ? thread.color : '#CCCCCC';
}

/**
 * ALGORITMO PRINCIPAL DE PATHFINDING
 * 
 * Encuentra TODOS los caminos válidos desde un nodo origen hasta un nodo destino
 * 
 * Estrategia:
 * 1. BFS para explorar todos los caminos posibles
 * 2. Maneja device links (conexiones directas en dispositivos)
 * 3. Maneja fusion links (fusiones entre fibras en nodos)
 * 4. Bidireccional: puede atravesar fusiones en cualquier dirección
 * 5. Evita ciclos usando set de nodos visitados por cada camino
 * 6. Retorna múltiples rutas ordenadas por número de saltos
 */
export function findAllFiberPaths(graph, fibers, startNodeId, endNodeId) {
  console.log(`\n${'='.repeat(60)}\n🔍 [FP-100] PATHFINDING INICIADO\n${'='.repeat(60)}`);
  console.log(`  Origen: ${startNodeId}`);
  console.log(`  Destino: ${endNodeId}`);
  console.log(`  Grafo: ${graph?.length || 0} nodos`);
  console.log(`  Fibras: ${fibers?.length || 0} fibras`);

  // Validaciones básicas
  if (!graph || !fibers || graph.length === 0 || fibers.length === 0) {
    console.error(`❌ [FP-101] ERROR: Grafo o fibras inválidos`);
    return {
      success: false,
      paths: [],
      error: 'Grafo o fibras no inicializados'
    };
  }

  if (startNodeId === endNodeId) {
    console.error(`❌ [FP-102] ERROR: Origen = Destino`);
    return {
      success: false,
      paths: [],
      error: 'El nodo de inicio y fin son el mismo'
    };
  }

  // Crear índices para acceso rápido
  const nodeMap = new Map();
  const fiberMap = new Map();

  // Indexar nodos
  console.log(`\n📍 [FP-110] Indexando ${graph.length} nodos...`);
  graph.forEach((node, idx) => {
    const nodeId = normalizeId(node.id || node.hash);
    nodeMap.set(nodeId, node);
    
    const deviceCount = node.devices?.length || 0;
    const linkCount = node.devices?.reduce((sum, d) => sum + (d.links?.length || 0), 0) || 0;
    const fusionCount = node.fusionLinks?.length || 0;
    
    console.log(`  [${idx + 1}] ${node.label} [ID:${nodeId}] Devices:${deviceCount} Links:${linkCount} Fusions:${fusionCount}`);
  });

  // Indexar fibras
  console.log(`\n🔷 [FP-120] Indexando ${fibers.length} fibras...`);
  fibers.forEach((fiber, idx) => {
    const fiberId = normalizeId(fiber.id || fiber.hash);
    fiberMap.set(fiberId, fiber);
    
    const totalThreads = fiber.threads?.length || 0;
    const activeThreads = fiber.threads?.filter(t => t.active && !t.inUse).length || 0;
    console.log(`  [${idx + 1}] ${fiber.label} [ID:${fiberId}] Threads:${totalThreads} (${activeThreads} disponibles)`);
  });

  console.log(`\n✅ [FP-130] Índices creados: ${nodeMap.size} nodos, ${fiberMap.size} fibras`);

  // Normalizar IDs de búsqueda
  const normalizedStartId = normalizeId(startNodeId);
  const normalizedEndId = normalizeId(endNodeId);

  console.log(`\n🎯 [FP-140] IDs normalizados: ${normalizedStartId} → ${normalizedEndId}`);

  // Verificar existencia
  if (!nodeMap.has(normalizedStartId)) {
    console.error(`❌ [FP-141] Nodo origen NO encontrado: ${startNodeId}`);
    return {
      success: false,
      paths: [],
      error: `Nodo de inicio ${startNodeId} no encontrado`
    };
  }

  if (!nodeMap.has(normalizedEndId)) {
    console.error(`❌ [FP-142] Nodo destino NO encontrado: ${endNodeId}`);
    return {
      success: false,
      paths: [],
      error: `Nodo de destino ${endNodeId} no encontrado`
    };
  }

  // Array para almacenar TODOS los caminos encontrados
  const allPaths = [];

  // Cola para BFS: cada elemento tiene el estado completo del camino
  const queue = [{
    currentNodeId: normalizedStartId,
    path: [],
    visited: new Set([normalizedStartId])
  }];

  let iterations = 0;
  const MAX_ITERATIONS = 10000;

  console.log(`\n🚀 [FP-150] Iniciando BFS (máx ${MAX_ITERATIONS} iteraciones)...\n`);

  while (queue.length > 0 && iterations < MAX_ITERATIONS) {
    iterations++;
    const state = queue.shift();
    const { currentNodeId, path, visited } = state;

    // ¿Llegamos al destino?
    if (currentNodeId === normalizedEndId) {
      console.log(`✅ [FP-200] ¡CAMINO ENCONTRADO! Saltos: ${path.length}`);
      console.log(`   Ruta: ${[nodeMap.get(normalizedStartId)?.label, ...path.map(p => p.node), nodeMap.get(normalizedEndId)?.label].join(' → ')}`);
      allPaths.push({
        path: [...path],
        hops: path.length,
        start: nodeMap.get(normalizedStartId)?.label || 'Unknown',
        end: nodeMap.get(normalizedEndId)?.label || 'Unknown'
      });
      continue; // Seguir buscando más caminos
    }

    const currentNode = nodeMap.get(currentNodeId);
    if (!currentNode) {
      console.warn(`⚠️ [FP-151] Nodo ${currentNodeId} no encontrado en mapa`);
      continue;
    }

    console.log(`🔄 [${iterations}] Explorando: ${currentNode.label} (${currentNodeId}) | Visitados: ${visited.size}`);

    // ============================================================
    // EXPLORACIÓN 1: Device Links (conexiones en dispositivos)
    // ============================================================
    if (currentNode.devices) {
      for (const device of currentNode.devices) {
        if (!device.links) continue;

        for (const link of device.links) {
          const linkInfo = link.src;
          if (!linkInfo?.fiberId) continue;

          console.log(`  🔗 Device: ${device.label} | Port: ${link.port} | Fiber: ${linkInfo.fiberId} | Thread: ${linkInfo.thread}`);

          // Buscar otros nodos conectados a la misma fibra/hilo
          const connections = findNodesConnectedToFiber(
            nodeMap, 
            currentNodeId, 
            linkInfo, 
            fiberMap
          );

          console.log(`    ↳ Conexiones encontradas: ${connections.length}`);

          for (const conn of connections) {
            if (visited.has(conn.nodeId)) {
              console.log(`      ⏭️ ${conn.nodeLabel} ya visitado`);
              continue;
            }

            const fiber = fiberMap.get(normalizeId(linkInfo.fiberId));

            // Si la conexión es un "fusion-point", significa que llegamos a un nodo con fusión
            // La fusión conecta dos fibras: necesitamos buscar qué nodos están conectados al OTRO lado
            if (conn.type === 'fusion-point') {
              const fusionLink = conn.fusionLink;
              const matchedSide = conn.matchedSide; // 'src' o 'dst' - qué lado coincide con la fibra actual
              
              // El otro lado de la fusión es por donde debemos continuar buscando
              const exitFiberInfo = matchedSide === 'src' ? fusionLink.dst : fusionLink.src;
              const exitFiber = fiberMap.get(normalizeId(exitFiberInfo.fiberId));

              console.log(`      🔀 Fusion-point encontrado en ${conn.nodeLabel}`);
              console.log(`         Entrada: Fiber ${linkInfo.fiberId}:${linkInfo.thread} (${fiber?.label})`);
              console.log(`         Salida:  Fiber ${exitFiberInfo.fiberId}:${exitFiberInfo.thread} (${exitFiber?.label})`);

              // Ahora buscar nodos conectados al OTRO lado de la fusión (exitFiberInfo)
              // IMPORTANTE: La fusión puede conectarse a CUALQUIER thread disponible de la fibra de salida
              // No solo al thread específico de la fusión
              console.log(`      🔎 Buscando nodos conectados al otro lado de la fusión...`);
              
              // IMPORTANTE: La fusión almacena threads 0-indexed, pero MDF usa 1-indexed
              // Necesito convertir: fusion thread 0 → MDF thread 1, fusion thread 1 → MDF thread 2
              const exitThreadForMDF = exitFiberInfo.thread ? exitFiberInfo.thread + 1 : 1;
              
              const threadFiberInfoForMDF = {
                fiberId: exitFiberInfo.fiberId,
                bufferId: exitFiberInfo.bufferId,
                thread: exitThreadForMDF
              };
              
              const connsForThread = findNodesConnectedToFiber(
                nodeMap,
                conn.nodeId, // Excluir el nodo de la fusión
                threadFiberInfoForMDF,
                fiberMap
              );
              
              // Guardar conexiones con el thread convertido
              const nextConnections = connsForThread.map(c => ({
                ...c,
                actualThreadUsed: exitThreadForMDF,
                actualThreadLabel: getThreadLabel(exitThreadForMDF)
              }));

              console.log(`      📊 Nodos encontrados después de la fusión: ${nextConnections.length}`);

              // Para cada nodo encontrado, crear un camino que pasa por la fusión
              for (const nextConn of nextConnections) {
                if (visited.has(nextConn.nodeId)) {
                  console.log(`         ⏭️ ${nextConn.nodeLabel} ya visitado`);
                  continue;
                }

                  // Crear paso que representa: Device → Fusión → Device
                const step = {
                  type: 'device-to-fusion-to-device',
                  from: {
                    nodeId: currentNodeId,
                    nodeLabel: currentNode.label,
                    deviceLabel: device.label + ' ' + (device.description || ''),
                    port: link.port
                  },
                  throughFusion: {
                    fusionNodeId: conn.nodeId,
                    fusionNodeLabel: conn.nodeLabel,
                    // Fibra de entrada (desde el device actual)
                    entryFiberId: linkInfo.fiberId,
                    entryFiberLabel: fiber?.label || `Fiber_${linkInfo.fiberId}`,
                    entryBufferId: linkInfo.bufferId,
                    entryThread: linkInfo.thread,
                    entryThreadLabel: getThreadLabel(linkInfo.thread),
                    entryColor: getThreadColor(fiber, linkInfo.thread),
                    // Fibra de salida (hacia el próximo device)
                    // IMPORTANTE: Usar el thread REAL que se encontró en MDF, no el de la fusión
                    exitFiberId: exitFiberInfo.fiberId,
                    exitFiberLabel: exitFiber?.label || `Fiber_${exitFiberInfo.fiberId}`,
                    exitBufferId: exitFiberInfo.bufferId,
                    exitThread: nextConn.actualThreadUsed || exitFiberInfo.thread,
                    exitThreadLabel: nextConn.actualThreadLabel || getThreadLabel(exitFiberInfo.thread),
                    exitColor: getThreadColor(exitFiber, nextConn.actualThreadUsed || exitFiberInfo.thread)
                  },
                  to: {
                    nodeId: nextConn.nodeId,
                    nodeLabel: nextConn.nodeLabel,
                    deviceLabel: nextConn.deviceLabel,
                    port: nextConn.port
                  }
                };

                console.log(`         ➕ Agregando camino completo: ${currentNode.label} → ${conn.nodeLabel} (fusión) → ${nextConn.nodeLabel}`);

                const newVisited = new Set(visited);
                newVisited.add(nextConn.nodeId); // Marcar el nodo destino como visitado

                queue.push({
                  currentNodeId: nextConn.nodeId,
                  path: [...path, step],
                  visited: newVisited
                });
              }
            } else {
              // Conexión normal (device-to-device)
              const step = {
                type: 'device-link',
                from: {
                  nodeId: currentNodeId,
                  nodeLabel: currentNode.label,
                  deviceLabel: device.label + ' ' + (device.description || ''),
                  port: link.port
                },
                through: {
                  fiberId: linkInfo.fiberId,
                  fiberLabel: fiber?.label || `Fiber_${linkInfo.fiberId}`,
                  bufferId: linkInfo.bufferId,
                  thread: linkInfo.thread,
                  threadColor: getThreadColor(fiber, linkInfo.thread)
                },
                to: {
                  nodeId: conn.nodeId,
                  nodeLabel: conn.nodeLabel,
                  deviceLabel: conn.deviceLabel,
                  port: conn.port
                }
              };

              console.log(`      ➕ Agregando (device-link): ${conn.nodeLabel}`);

              const newVisited = new Set(visited);
              newVisited.add(conn.nodeId);

              queue.push({
                currentNodeId: conn.nodeId,
                path: [...path, step],
                visited: newVisited
              });
            }
          }
        }
      }
    }

    // ============================================================
    // EXPLORACIÓN 2: Fusion Links (fusiones entre fibras)
    // ============================================================
    if (currentNode.fusionLinks) {
      console.log(`  🔥 Fusion Links: ${currentNode.fusionLinks.length}`);
      
      for (const fusionLink of currentNode.fusionLinks) {
        const { src, dst } = fusionLink;
        
        if (!src?.fiberId || !dst?.fiberId) continue;

        console.log(`  🔥 Fusión: Fiber ${src.fiberId}:${src.thread} ↔ Fiber ${dst.fiberId}:${dst.thread}`);

        // Una fusión conecta dos hilos bidireccional: src ↔ dst
        // Podemos atravesarla en AMBAS direcciones

        // Dirección A: Explorar nodos conectados al lado SRC
        const connectionsSrc = findNodesConnectedToFiber(
          nodeMap, 
          currentNodeId, 
          src, 
          fiberMap
        );

        console.log(`    ↳ Conexiones por SRC: ${connectionsSrc.length}`);

        for (const conn of connectionsSrc) {
          if (visited.has(conn.nodeId)) {
            console.log(`      ⏭️ ${conn.nodeLabel} ya visitado`);
            continue;
          }

          const fiberSrc = fiberMap.get(normalizeId(src.fiberId));
          const fiberDst = fiberMap.get(normalizeId(dst.fiberId));

          const step = {
            type: 'fusion-via-src',
            from: {
              nodeId: currentNodeId,
              nodeLabel: currentNode.label,
              fusionSide: 'DST'  // Venimos del lado DST y salimos por SRC
            },
            through: {
              fusionSrc: {
                fiberId: src.fiberId,
                fiberLabel: fiberSrc?.label || `Fiber_${src.fiberId}`,
                bufferId: src.bufferId,
                thread: src.thread,
                threadColor: getThreadColor(fiberSrc, src.thread)
              },
              fusionDst: {
                fiberId: dst.fiberId,
                fiberLabel: fiberDst?.label || `Fiber_${dst.fiberId}`,
                bufferId: dst.bufferId,
                thread: dst.thread,
                threadColor: getThreadColor(fiberDst, dst.thread)
              }
            },
            to: {
              nodeId: conn.nodeId,
              nodeLabel: conn.nodeLabel,
              deviceLabel: conn.deviceLabel,
              port: conn.port
            }
          };

          console.log(`      ➕ Agregando por SRC: ${conn.nodeLabel}`);

          const newVisited = new Set(visited);
          newVisited.add(conn.nodeId);

          queue.push({
            currentNodeId: conn.nodeId,
            path: [...path, step],
            visited: newVisited
          });
        }

        // Dirección B: Explorar nodos conectados al lado DST
        const connectionsDst = findNodesConnectedToFiber(
          nodeMap, 
          currentNodeId, 
          dst, 
          fiberMap
        );

        console.log(`    ↳ Conexiones por DST: ${connectionsDst.length}`);

        for (const conn of connectionsDst) {
          if (visited.has(conn.nodeId)) {
            console.log(`      ⏭️ ${conn.nodeLabel} ya visitado`);
            continue;
          }

          const fiberSrc = fiberMap.get(normalizeId(src.fiberId));
          const fiberDst = fiberMap.get(normalizeId(dst.fiberId));

          const step = {
            type: 'fusion-via-dst',
            from: {
              nodeId: currentNodeId,
              nodeLabel: currentNode.label,
              fusionSide: 'SRC'  // Venimos del lado SRC y salimos por DST
            },
            through: {
              fusionSrc: {
                fiberId: src.fiberId,
                fiberLabel: fiberSrc?.label || `Fiber_${src.fiberId}`,
                bufferId: src.bufferId,
                thread: src.thread,
                threadColor: getThreadColor(fiberSrc, src.thread)
              },
              fusionDst: {
                fiberId: dst.fiberId,
                fiberLabel: fiberDst?.label || `Fiber_${dst.fiberId}`,
                bufferId: dst.bufferId,
                thread: dst.thread,
                threadColor: getThreadColor(fiberDst, dst.thread)
              }
            },
            to: {
              nodeId: conn.nodeId,
              nodeLabel: conn.nodeLabel,
              deviceLabel: conn.deviceLabel,
              port: conn.port
            }
          };

          console.log(`      ➕ Agregando por DST: ${conn.nodeLabel}`);

          const newVisited = new Set(visited);
          newVisited.add(conn.nodeId);

          queue.push({
            currentNodeId: conn.nodeId,
            path: [...path, step],
            visited: newVisited
          });
        }
      }
    }

    console.log(''); // Línea en blanco para legibilidad
  }

  if (iterations >= MAX_ITERATIONS) {
    console.warn('⚠️ Límite de iteraciones alcanzado');
  }

  console.log(`\n📊 ==================== RESULTADO ====================`);
  console.log(`Caminos encontrados: ${allPaths.length}`);
  console.log(`Iteraciones: ${iterations}`);
  console.log(`=====================================================\n`);

  // Ordenar por número de saltos (más corto primero)
  allPaths.sort((a, b) => a.hops - b.hops);

  // Log de resumen de caminos
  allPaths.forEach((p, i) => {
    console.log(`Camino ${i + 1}: ${p.hops} saltos | ${p.start} → ${p.end}`);
  });

  return {
    success: allPaths.length > 0,
    paths: allPaths,
    totalPaths: allPaths.length,
    shortestPath: allPaths.length > 0 ? allPaths[0] : null,
    error: allPaths.length === 0 ? 'No se encontraron caminos válidos' : null
  };
}

/**
 * Función legacy para compatibilidad con código existente
 * Retorna solo el camino más corto en el formato antiguo
 */
export function findFiberPath(graph, fibers, startUnitId, endUnitId) {
  const result = findAllFiberPaths(graph, fibers, startUnitId, endUnitId);
  
  if (!result.success || !result.shortestPath) {
    return {
      success: false,
      path: [],
      totalHops: 0,
      error: result.error
    };
  }

  return {
    success: true,
    path: result.shortestPath.path,
    totalHops: result.shortestPath.hops,
    start: { 
      unitId: startUnitId, 
      unitLabel: result.shortestPath.start
    },
    end: { 
      unitId: endUnitId, 
      unitLabel: result.shortestPath.end
    }
  };
}

/**
 * Formatea un camino para visualización
 */
export function formatPathForDisplay(pathResult) {
  if (!pathResult.success) {
    return { 
      title: 'No se encontró ruta', 
      steps: [],
      error: pathResult.error 
    };
  }

  // Si es resultado del nuevo algoritmo (múltiples caminos)
  if (pathResult.paths && pathResult.paths.length > 0) {
    const shortest = pathResult.shortestPath;
    
    const steps = shortest.path.map((step, index) => {
      if (step.type === 'device-link') {
        return {
          number: index + 1,
          type: 'Device Link',
          from: `${step.from.nodeLabel} (${step.from.deviceLabel} - Puerto ${step.from.port})`,
          through: `${step.through.fiberLabel} - Hilo ${step.through.thread}`,
          to: `${step.to.nodeLabel} (${step.to.deviceLabel} - Puerto ${step.to.port})`,
          color: step.through.threadColor
        };
      } else if (step.type === 'device-to-fusion-to-device') {
        // Camino completo: Device → Fusión → Device
        return {
          number: index + 1,
          type: 'Conexión con Fusión',
          from: `${step.from.nodeLabel} (${step.from.deviceLabel} - Puerto ${step.from.port})`,
          through: `${step.throughFusion.entryFiberLabel}:${step.throughFusion.entryThread} → [Fusión en ${step.throughFusion.fusionNodeLabel}] → ${step.throughFusion.exitFiberLabel}:${step.throughFusion.exitThread}`,
          to: `${step.to.nodeLabel} (${step.to.deviceLabel} - Puerto ${step.to.port})`,
          color: step.throughFusion.entryColor
        };
      } else {
        // Fusion link directo (cuando el nodo actual YA está en un punto de fusión)
        return {
          number: index + 1,
          type: 'Fusion Link',
          from: `${step.from.nodeLabel} (Fusión)`,
          through: `${step.through.fusionSrc.fiberLabel}:${step.through.fusionSrc.thread} ↔ ${step.through.fusionDst.fiberLabel}:${step.through.fusionDst.thread}`,
          to: `${step.to.nodeLabel} (${step.to.deviceLabel} - Puerto ${step.to.port})`,
          color: step.through.fusionSrc.threadColor
        };
      }
    });

    return {
      title: `Ruta de ${shortest.start} a ${shortest.end} (${pathResult.totalPaths} camino${pathResult.totalPaths > 1 ? 's' : ''} encontrado${pathResult.totalPaths > 1 ? 's' : ''})`,
      steps: steps,
      totalHops: shortest.hops,
      totalPaths: pathResult.totalPaths
    };
  }

  // Formato antiguo (single path)
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
