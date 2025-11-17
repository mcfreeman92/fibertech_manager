/**
 * Herramienta de diagnóstico para verificar la consistencia de datos de enlaces y fusiones
 */

export function checkDataConsistency(nodes, fibers) {
  console.log('\n🔍 ========== VERIFICACIÓN DE CONSISTENCIA DE DATOS ==========\n');

  const issues = [];
  const stats = {
    totalNodes: nodes.length,
    totalFibers: fibers.length,
    totalDeviceLinks: 0,
    totalFusionLinks: 0,
    nodesWithDevices: 0,
    nodesWithFusions: 0,
    orphanLinks: 0,
    invalidFiberReferences: 0,
    threadsOutOfRange: 0,
  };

  // Crear mapa de fibras para búsqueda rápida
  const fiberMap = new Map();
  fibers.forEach(fiber => {
    fiberMap.set(fiber.id, fiber);
  });

  console.log('📊 Resumen de datos cargados:');
  console.log(`   - Nodos: ${nodes.length}`);
  console.log(`   - Fibras principales: ${fibers.length}`);
  console.log('');

  // ============================================================
  // VERIFICAR CADA NODO
  // ============================================================
  nodes.forEach((node, nodeIndex) => {
    console.log(`\n📍 Nodo [${nodeIndex + 1}/${nodes.length}]: ${node.label} (ID: ${node.id})`);

    // Verificar estructura del nodo
    if (!node.id) {
      issues.push({
        type: 'ERROR',
        node: node.label,
        message: 'Nodo sin ID',
      });
    }

    // ============================================================
    // VERIFICAR DEVICE LINKS
    // ============================================================
    let nodeDeviceLinkCount = 0;
    if (node.devices && Array.isArray(node.devices)) {
      stats.nodesWithDevices++;
      console.log(`   🔧 Dispositivos: ${node.devices.length}`);

      node.devices.forEach((device, devIndex) => {
        console.log(`      - Device [${devIndex}]: ${device.label || 'Sin etiqueta'} (Hash: ${device.hash})`);

        if (device.links && Array.isArray(device.links)) {
          device.links.forEach((link, linkIndex) => {
            nodeDeviceLinkCount++;
            stats.totalDeviceLinks++;

            console.log(`         🔗 Link [${linkIndex}]: Puerto ${link.port}`);

            // Verificar estructura del link
            if (!link.src) {
              issues.push({
                type: 'ERROR',
                node: node.label,
                device: device.label,
                port: link.port,
                message: 'Link sin objeto src',
              });
              console.log(`            ❌ ERROR: Link sin objeto src`);
              return;
            }

            const { fiberId, bufferId, thread } = link.src;
            console.log(`            Fiber: ${fiberId}, Buffer: ${bufferId}, Thread: ${thread}`);

            // Verificar que la fibra existe
            const fiber = fiberMap.get(fiberId);
            if (!fiber) {
              stats.invalidFiberReferences++;
              issues.push({
                type: 'ERROR',
                node: node.label,
                device: device.label,
                port: link.port,
                message: `Referencia a fibra inexistente: ${fiberId}`,
                data: link.src,
              });
              console.log(`            ❌ ERROR: Fibra ${fiberId} no existe en el mapa`);
              return;
            }

            console.log(`            ✅ Fibra encontrada: ${fiber.label}`);

            // Verificar threads (hilos)
            const fiberMetadata = typeof fiber.metadata === 'string' 
              ? JSON.parse(fiber.metadata) 
              : fiber.metadata;

            let maxThreads = 0;
            if (Array.isArray(fiberMetadata)) {
              maxThreads = fiberMetadata.length;
            }

            if (thread && (thread < 1 || thread > maxThreads)) {
              stats.threadsOutOfRange++;
              issues.push({
                type: 'WARNING',
                node: node.label,
                device: device.label,
                port: link.port,
                message: `Thread ${thread} fuera de rango (1-${maxThreads})`,
                data: link.src,
              });
              console.log(`            ⚠️  WARNING: Thread ${thread} fuera de rango (máx: ${maxThreads})`);
            }
          });
        }
      });
    } else {
      console.log('   🔧 Dispositivos: 0 (no tiene propiedad devices o no es array)');
    }

    // ============================================================
    // VERIFICAR FUSION LINKS
    // ============================================================
    let nodeFusionLinkCount = 0;
    if (node.fusionLinks && Array.isArray(node.fusionLinks)) {
      stats.nodesWithFusions++;
      console.log(`   ⚡ Fusiones: ${node.fusionLinks.length}`);

      node.fusionLinks.forEach((fusion, fusionIndex) => {
        nodeFusionLinkCount++;
        stats.totalFusionLinks++;

        console.log(`      - Fusión [${fusionIndex}]:`);

        // Verificar estructura de la fusión
        if (!fusion.src || !fusion.dst) {
          issues.push({
            type: 'ERROR',
            node: node.label,
            message: `Fusión incompleta (falta src o dst)`,
            data: fusion,
          });
          console.log(`         ❌ ERROR: Fusión sin src o dst completo`);
          return;
        }

        const { src, dst } = fusion;
        console.log(`         SRC: Fiber ${src.fiberId}, Buffer ${src.bufferId}, Thread ${src.thread}`);
        console.log(`         DST: Fiber ${dst.fiberId}, Buffer ${dst.bufferId}, Thread ${dst.thread}`);

        // Verificar fibra SRC
        const srcFiber = fiberMap.get(src.fiberId);
        if (!srcFiber) {
          stats.invalidFiberReferences++;
          issues.push({
            type: 'ERROR',
            node: node.label,
            message: `Fusión referencia fibra SRC inexistente: ${src.fiberId}`,
            data: fusion,
          });
          console.log(`         ❌ ERROR: Fibra SRC ${src.fiberId} no existe`);
        } else {
          console.log(`         ✅ Fibra SRC encontrada: ${srcFiber.label}`);
        }

        // Verificar fibra DST
        const dstFiber = fiberMap.get(dst.fiberId);
        if (!dstFiber) {
          stats.invalidFiberReferences++;
          issues.push({
            type: 'ERROR',
            node: node.label,
            message: `Fusión referencia fibra DST inexistente: ${dst.fiberId}`,
            data: fusion,
          });
          console.log(`         ❌ ERROR: Fibra DST ${dst.fiberId} no existe`);
        } else {
          console.log(`         ✅ Fibra DST encontrada: ${dstFiber.label}`);
        }
      });
    } else {
      console.log('   ⚡ Fusiones: 0 (no tiene propiedad fusionLinks o no es array)');
    }

    console.log(`   📊 Total enlaces en este nodo: ${nodeDeviceLinkCount} device links, ${nodeFusionLinkCount} fusion links`);
  });

  // ============================================================
  // RESUMEN FINAL
  // ============================================================
  console.log('\n\n📊 ========== RESUMEN DE ESTADÍSTICAS ==========');
  console.log(`   Total de nodos: ${stats.totalNodes}`);
  console.log(`   Total de fibras: ${stats.totalFibers}`);
  console.log(`   Nodos con dispositivos: ${stats.nodesWithDevices}`);
  console.log(`   Nodos con fusiones: ${stats.nodesWithFusions}`);
  console.log(`   Total device links: ${stats.totalDeviceLinks}`);
  console.log(`   Total fusion links: ${stats.totalFusionLinks}`);
  console.log('');

  if (issues.length === 0) {
    console.log('✅ No se encontraron problemas de consistencia');
  } else {
    console.log(`⚠️  Se encontraron ${issues.length} problemas:`);
    console.log(`   - Referencias inválidas a fibras: ${stats.invalidFiberReferences}`);
    console.log(`   - Threads fuera de rango: ${stats.threadsOutOfRange}`);
    console.log(`   - Enlaces huérfanos: ${stats.orphanLinks}`);
    console.log('');
    
    console.log('📋 DETALLE DE PROBLEMAS:');
    issues.forEach((issue, index) => {
      console.log(`\n   [${index + 1}] ${issue.type}: ${issue.message}`);
      if (issue.node) console.log(`       Nodo: ${issue.node}`);
      if (issue.device) console.log(`       Dispositivo: ${issue.device}`);
      if (issue.port) console.log(`       Puerto: ${issue.port}`);
      if (issue.data) console.log(`       Datos:`, issue.data);
    });
  }

  console.log('\n🔍 ========== FIN DE VERIFICACIÓN ==========\n');

  return {
    issues,
    stats,
    isValid: issues.filter(i => i.type === 'ERROR').length === 0,
  };
}

/**
 * Verifica la estructura de metadata de un nodo específico
 */
export function checkNodeMetadata(node) {
  console.log(`\n🔬 Verificación detallada de metadata para: ${node.label}`);
  
  console.log('\n📦 Estructura completa del nodo:');
  console.log(JSON.stringify(node, null, 2));

  // Verificar si metadata es string y necesita parsing
  if (node.metadata && typeof node.metadata === 'string') {
    console.log('\n⚠️  Metadata es string, intentando parsear...');
    try {
      const parsed = JSON.parse(node.metadata);
      console.log('✅ Metadata parseado exitosamente:');
      console.log(JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('❌ ERROR al parsear metadata:', e.message);
    }
  } else if (node.metadata) {
    console.log('\n✅ Metadata ya es objeto:');
    console.log(JSON.stringify(node.metadata, null, 2));
  } else {
    console.log('\n⚠️  No hay metadata en este nodo');
  }

  // Verificar devices
  if (node.devices) {
    console.log(`\n🔧 Devices (${node.devices.length}):`);
    node.devices.forEach((device, i) => {
      console.log(`   [${i}] ${device.label || 'Sin label'}`);
      if (device.links) {
        console.log(`       Links: ${device.links.length}`);
        device.links.forEach((link, j) => {
          console.log(`       [${j}] Puerto ${link.port}:`, link.src);
        });
      }
    });
  }

  // Verificar fusionLinks
  if (node.fusionLinks) {
    console.log(`\n⚡ FusionLinks (${node.fusionLinks.length}):`);
    node.fusionLinks.forEach((fusion, i) => {
      console.log(`   [${i}]:`);
      console.log(`      SRC:`, fusion.src);
      console.log(`      DST:`, fusion.dst);
    });
  }
}

/**
 * Verifica que los datos estén correctamente parseados desde la BD
 */
export function checkDatabaseParsing(rawNodes) {
  console.log('\n🗄️  ========== VERIFICACIÓN DE PARSING DE BD ==========\n');

  rawNodes.forEach((node, index) => {
    console.log(`\n[${index + 1}] Nodo: ${node.label || node.Label}`);
    console.log('   Campos del nodo:');
    console.log('   - id:', node.id, '| Id:', node.Id);
    console.log('   - label:', node.label, '| Label:', node.Label);
    console.log('   - metadata:', typeof node.metadata, '| Metadata:', typeof node.Metadata);
    
    if (node.metadata) {
      console.log('   - node.metadata es string?', typeof node.metadata === 'string');
      if (typeof node.metadata === 'string') {
        console.log('   - metadata length:', node.metadata.length);
        console.log('   - metadata preview:', node.metadata.substring(0, 100) + '...');
      } else {
        console.log('   - metadata keys:', Object.keys(node.metadata));
      }
    }

    if (node.Metadata) {
      console.log('   - node.Metadata es string?', typeof node.Metadata === 'string');
      if (typeof node.Metadata === 'string') {
        console.log('   - Metadata length:', node.Metadata.length);
        console.log('   - Metadata preview:', node.Metadata.substring(0, 100) + '...');
      } else {
        console.log('   - Metadata keys:', Object.keys(node.Metadata));
      }
    }

    console.log('   - devices:', node.devices ? `Array[${node.devices.length}]` : 'undefined');
    console.log('   - fusionLinks:', node.fusionLinks ? `Array[${node.fusionLinks.length}]` : 'undefined');
  });

  console.log('\n🗄️  ========== FIN DE VERIFICACIÓN ==========\n');
}
