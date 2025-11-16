/**
   * Encuentra la ruta siguiendo las conexiones físicas entre nodos
   * @param {string} startNodeId - ID del nodo inicial
   * @param {string} endNodeId - ID del nodo final
   * @param {Array} nodes - Array de nodos
   * @param {Array} fibers - Array de fibras
   * @returns {Object|null} - Objeto con la ruta detallada o null si no existe ruta
   */
  function findPhysicalPathBetweenNodes(startNodeId, endNodeId, nodes, fibers) {
    if (!startNodeId || !endNodeId || !nodes || !fibers) {
      return null;
    }

    if (startNodeId === endNodeId) {
      const startNode = nodes.find((n) => n.id === startNodeId);
      return startNode
        ? {
          path: [
            {
              node: {
                id: startNode.id,
                label: startNode.label || startNode.labe,
              },
            },
          ],
          totalHops: 0,
        }
        : null;
    }

    // Construir mapa de todas las conexiones físicas
    const physicalConnections = buildPhysicalConnectionsMap(nodes, fibers);

    // BFS para encontrar ruta siguiendo conexiones físicas
    const queue = [
      {
        nodeId: startNodeId,
        path: [],
        visited: new Set([startNodeId]),
      },
    ];

    while (queue.length > 0) {
      const {
        nodeId: currentNodeId,
        path: currentPath,
        visited,
      } = queue.shift();

      // Obtener todas las conexiones físicas desde este nodo
      const connections = physicalConnections.get(currentNodeId) || [];

      for (const connection of connections) {
        const nextNodeId = connection.toNodeId;

        if (nextNodeId === endNodeId) {
          // Encontramos el destino
          const finalPath = [...currentPath, connection];
          return buildDetailedResult(startNodeId, finalPath, nodes);
        }

        if (!visited.has(nextNodeId)) {
          const newVisited = new Set(visited);
          newVisited.add(nextNodeId);

          queue.push({
            nodeId: nextNodeId,
            path: [...currentPath, connection],
            visited: newVisited,
          });
        }
      }
    }

    return null;
  }

  /**
   * Construye un mapa de todas las conexiones físicas entre nodos
   */
  function buildPhysicalConnectionsMap(nodes, fibers) {
    const connectionsMap = new Map();

    // Crear un índice de todos los links por fibra y thread
    const fiberThreadIndex = new Map();

    nodes.forEach((node) => {
      node.devices?.forEach((device) => {
        device.links?.forEach((link) => {
          const fiberId = String(link.fiberId);
          const threadNumber = link.threadNumber;
          const key = `${fiberId}-${threadNumber}`;

          if (!fiberThreadIndex.has(key)) {
            fiberThreadIndex.set(key, []);
          }

          const fiber = fibers.find((f) => String(f.id) === fiberId);

          fiberThreadIndex.get(key).push({
            nodeId: node.id,
            nodeLabel: node.label || node.labe,
            deviceId: device.id,
            deviceLabel: device.label,
            portNumber: link.portNumber || link.portNumbre,
            fiberId: fiberId,
            fiberLabel: fiber?.label || `Fiber ${fiberId}`,
            threadNumber: threadNumber,
          });
        });
      });
    });

    // Crear conexiones bidireccionales para cada par de endpoints en la misma fibra/thread
    fiberThreadIndex.forEach((endpoints, key) => {
      for (let i = 0; i < endpoints.length; i++) {
        const from = endpoints[i];

        if (!connectionsMap.has(from.nodeId)) {
          connectionsMap.set(from.nodeId, []);
        }

        for (let j = 0; j < endpoints.length; j++) {
          if (i !== j) {
            const to = endpoints[j];

            connectionsMap.get(from.nodeId).push({
              fromNodeId: from.nodeId,
              fromNodeLabel: from.nodeLabel,
              fromDeviceId: from.deviceId,
              fromDeviceLabel: from.deviceLabel,
              fromPortNumber: from.portNumber,

              toNodeId: to.nodeId,
              toNodeLabel: to.nodeLabel,
              toDeviceId: to.deviceId,
              toDeviceLabel: to.deviceLabel,
              toPortNumber: to.portNumber,

              fiberId: from.fiberId,
              fiberLabel: from.fiberLabel,
              threadNumber: from.threadNumber,
            });
          }
        }
      }
    });

    return connectionsMap;
  }

  /**
   * Construye el resultado detallado con la información de la ruta
   */
  function buildDetailedResult(startNodeId, connectionPath, nodes) {
    const detailedPath = [];

    // Agregar el nodo inicial
    const startNode = nodes.find((n) => n.id === startNodeId);
    const firstConnection = connectionPath[0];

    detailedPath.push({
      node: {
        id: startNode.id,
        label: startNode.label || startNode.labe,
      },
      exitPort: {
        deviceId: firstConnection.fromDeviceId,
        deviceLabel: firstConnection.fromDeviceLabel,
        portNumber: firstConnection.fromPortNumber,
      },
      connection: {
        fiber: {
          id: firstConnection.fiberId,
          label: firstConnection.fiberLabel,
          threadNumber: firstConnection.threadNumber,
        },
        toNextNode: {
          nodeId: firstConnection.toNodeId,
          nodeLabel: firstConnection.toNodeLabel,
          entryPort: {
            deviceId: firstConnection.toDeviceId,
            deviceLabel: firstConnection.toDeviceLabel,
            portNumber: firstConnection.toPortNumber,
          },
        },
      },
    });

    // Agregar nodos intermedios
    for (let i = 0; i < connectionPath.length - 1; i++) {
      const currentConnection = connectionPath[i];
      const nextConnection = connectionPath[i + 1];
      const node = nodes.find((n) => n.id === currentConnection.toNodeId);

      detailedPath.push({
        node: {
          id: node.id,
          label: node.label || node.labe,
        },
        entryPort: {
          deviceId: currentConnection.toDeviceId,
          deviceLabel: currentConnection.toDeviceLabel,
          portNumber: currentConnection.toPortNumber,
        },
        exitPort: {
          deviceId: nextConnection.fromDeviceId,
          deviceLabel: nextConnection.fromDeviceLabel,
          portNumber: nextConnection.fromPortNumber,
        },
        connection: {
          fiber: {
            id: nextConnection.fiberId,
            label: nextConnection.fiberLabel,
            threadNumber: nextConnection.threadNumber,
          },
          toNextNode: {
            nodeId: nextConnection.toNodeId,
            nodeLabel: nextConnection.toNodeLabel,
            entryPort: {
              deviceId: nextConnection.toDeviceId,
              deviceLabel: nextConnection.toDeviceLabel,
              portNumber: nextConnection.toPortNumber,
            },
          },
        },
      });
    }

    // Agregar el nodo final
    const lastConnection = connectionPath[connectionPath.length - 1];
    const endNode = nodes.find((n) => n.id === lastConnection.toNodeId);

    detailedPath.push({
      node: {
        id: endNode.id,
        label: endNode.label || endNode.labe,
      },
      entryPort: {
        deviceId: lastConnection.toDeviceId,
        deviceLabel: lastConnection.toDeviceLabel,
        portNumber: lastConnection.toPortNumber,
      },
    });

    return {
      path: detailedPath,
      totalHops: connectionPath.length,
      summary: detailedPath.map((segment) => segment.node.label).join(" → "),
      fibers: connectionPath.map((conn) => ({
        id: conn.fiberId,
        label: conn.fiberLabel,
        thread: conn.threadNumber,
      })),
    };
  }

  /**
   * Función simplificada que retorna lista de nodos con puertos
   */
  function getPathWithPortDetails(startNodeId, endNodeId, nodes, fibers) {
    const result = findPhysicalPathBetweenNodes(
      startNodeId,
      endNodeId,
      nodes,
      fibers
    );

    if (!result) {
      return null;
    }

    return {
      nodes: result.path.map((segment) => ({
        nodeId: segment.node.id,
        nodeLabel: segment.node.label,
        entryDevice: segment.entryPort
          ? {
            deviceId: segment.entryPort.deviceId,
            deviceLabel: segment.entryPort.deviceLabel,
            portNumber: segment.entryPort.portNumber,
          }
          : null,
        exitDevice: segment.exitPort
          ? {
            deviceId: segment.exitPort.deviceId,
            deviceLabel: segment.exitPort.deviceLabel,
            portNumber: segment.exitPort.portNumber,
          }
          : null,
      })),
      fibersUsed: result.fibers,
      totalHops: result.totalHops,
      summary: result.summary,
    };
  }

  /**
   * Encuentra todas las rutas posibles entre dos nodos
   */
  function findAllPhysicalPaths(
    startNodeId,
    endNodeId,
    nodes,
    fibers,
    maxPaths = 10
  ) {
    const physicalConnections = buildPhysicalConnectionsMap(nodes, fibers);
    const allPaths = [];

    function dfs(currentNodeId, targetNodeId, currentPath, visited) {
      if (allPaths.length >= maxPaths) return;

      if (currentNodeId === targetNodeId) {
        allPaths.push([...currentPath]);
        return;
      }

      const connections = physicalConnections.get(currentNodeId) || [];

      for (const connection of connections) {
        const nextNodeId = connection.toNodeId;

        if (!visited.has(nextNodeId)) {
          visited.add(nextNodeId);
          currentPath.push(connection);

          dfs(nextNodeId, targetNodeId, currentPath, visited);

          currentPath.pop();
          visited.delete(nextNodeId);
        }
      }
    }

    const visited = new Set([startNodeId]);
    dfs(startNodeId, endNodeId, [], visited);

    return allPaths.map((path) =>
      buildDetailedResult(startNodeId, path, nodes)
    );
  }