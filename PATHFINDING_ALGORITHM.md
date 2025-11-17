# ALGORITMO DE PATHFINDING MEJORADO - FIBERTECH MANAGER

## 📋 RESUMEN

He realizado un análisis completo del sistema de pathfinding y creado un **algoritmo completamente nuevo** que resuelve todos los problemas detectados.

---

## 🔍 PROBLEMAS IDENTIFICADOS EN EL ALGORITMO ANTERIOR

### 1. **Exploración Incompleta**
- Solo encontraba el primer camino y se detenía
- No exploraba todas las posibilidades

### 2. **Manejo Incorrecto de Fusion Links**
- La lógica bidireccional estaba mal implementada
- No podía atravesar fusiones en ambas direcciones correctamente
- Buscaba conexiones en ambos lados (src y dst) pero no diferenciaba direcciones

### 3. **IDs Inconsistentes**
- Mezclaba `node.id` (base de datos) con `node.hash` (temporal)
- Las comparaciones fallaban por tipos inconsistentes (string vs number)

### 4. **Sin Validación de Hilos**
- No verificaba si los hilos estaban activos (`active: true`)
- No distinguía entre hilos en uso y disponibles

### 5. **Estructura de Datos Confusa**
- Device links: `{port, src: {fiberId, bufferId, thread}}`
- Fusion links: `{src: {fiberId, bufferId, thread}, dst: {fiberId, bufferId, thread}}`
- La búsqueda no manejaba ambos casos correctamente

---

## ✨ NUEVO ALGORITMO - CARACTERÍSTICAS

### **Búsqueda Exhaustiva (BFS Modificado)**
- Encuentra **TODOS** los caminos posibles, no solo el primero
- Ordena resultados por número de saltos (más corto primero)
- Retorna múltiples rutas para que el usuario elija la mejor

### **Manejo Correcto de Conexiones**

#### Device Links (Conexiones Directas)
```
UNIT → Pedestal
```
- Busca en `device.links` de cada nodo
- Compara: `fiberId`, `bufferId`, `thread`
- Verifica que el hilo esté `active: true`

#### Fusion Links (Fusiones Bidireccionales)
```
Pedestal (fusión) ↔ IDF (fusión) ↔ MDF
```
- Una fusión tiene dos lados: `src` y `dst`
- El algoritmo puede entrar por cualquier lado y salir por el otro
- Explora ambas direcciones independientemente
- Rastreabilidad completa del flujo de la fibra

### **Normalización de IDs**
```javascript
function normalizeId(id) {
  const parsed = parseInt(id);
  return isNaN(parsed) ? String(id) : parsed;
}
```
- Convierte IDs a tipo consistente para comparación
- Maneja tanto números como strings correctamente

### **Evita Ciclos**
- Cada camino mantiene su propio `Set` de nodos visitados
- Previene loops infinitos
- Permite explorar rutas alternativas sin repetir nodos

### **Logging Detallado**
- Muestra todo el proceso de búsqueda en consola
- Indica qué nodos se están explorando
- Muestra conexiones encontradas en cada paso
- Facilita debugging

---

## 📊 ESTRUCTURA DEL RESULTADO

### Formato de Respuesta
```javascript
{
  success: true,
  paths: [
    {
      path: [...],        // Array de pasos
      hops: 2,            // Número de saltos
      start: "UNIT_1",    // Nodo origen
      end: "MDF_1"        // Nodo destino
    },
    {
      path: [...],
      hops: 3,
      start: "UNIT_1",
      end: "MDF_1"
    }
  ],
  totalPaths: 2,
  shortestPath: {...},    // Referencia al camino más corto
  error: null
}
```

### Formato de Cada Paso

#### Device Link
```javascript
{
  type: 'device-link',
  from: {
    nodeId: 5,
    nodeLabel: "UNIT_1",
    deviceLabel: "ONT Huawei",
    port: 1
  },
  through: {
    fiberId: 8,
    fiberLabel: "2F_UNIT_1",
    bufferId: null,
    thread: 1,
    threadColor: "#0000FF"
  },
  to: {
    nodeId: 3,
    nodeLabel: "P_1",
    deviceLabel: "Splitter 1x8",
    port: 2
  }
}
```

#### Fusion Link
```javascript
{
  type: 'fusion-via-src',
  from: {
    nodeId: 3,
    nodeLabel: "P_1",
    fusionSide: 'DST'
  },
  through: {
    fusionSrc: {
      fiberId: 8,
      fiberLabel: "2F_UNIT_1",
      thread: 1,
      threadColor: "#0000FF"
    },
    fusionDst: {
      fiberId: 1,
      fiberLabel: "12F_1",
      thread: 1,
      threadColor: "#0000FF"
    }
  },
  to: {
    nodeId: 1,
    nodeLabel: "MDF_1",
    deviceLabel: "ODF 24F",
    port: 1
  }
}
```

---

## 🎨 VISUALIZACIÓN MEJORADA

### NodePath.js - Actualizado

#### Características:
1. **Badge de Resumen**
   - Muestra cuántos caminos se encontraron
   - Destaca la ruta más corta
   - Colores: verde (éxito), rojo (sin rutas)

2. **Timeline para Cada Camino**
   - Muestra todos los caminos encontrados
   - Cada camino tiene su propio timeline
   - Colores de hilos visibles en cada salto

3. **Información Detallada**
   - Tipo de conexión (Device Link / Fusion Link)
   - Nodos origen y destino
   - Fibras y hilos utilizados
   - Puertos involucrados

4. **Manejo de Errores**
   - Icono de alerta si no hay rutas
   - Mensaje descriptivo del error
   - Estado de "Buscando..." mientras procesa

---

## 🚀 CÓMO FUNCIONA EL ALGORITMO

### 1. **Inicialización**
```
- Crear índices (Maps) de nodos y fibras
- Normalizar IDs de origen y destino
- Validar que ambos nodos existan
```

### 2. **Búsqueda BFS**
```
Cola = [{ nodo: origen, path: [], visitados: {origen} }]

Mientras Cola no esté vacía:
  1. Sacar estado de la cola
  2. ¿Es el destino? → Guardar camino y continuar
  3. ¿Ya visitado? → Saltar
  4. Explorar device links del nodo actual
  5. Explorar fusion links del nodo actual
  6. Agregar nuevos estados a la cola
```

### 3. **Exploración de Device Links**
```
Para cada dispositivo en el nodo:
  Para cada link del dispositivo:
    Buscar otros nodos conectados a la misma fibra/hilo
    Crear paso de camino
    Agregar a cola (si no visitado)
```

### 4. **Exploración de Fusion Links**
```
Para cada fusión en el nodo:
  Explorar lado SRC:
    Buscar nodos conectados al hilo SRC
    Crear paso "fusion-via-src"
    Agregar a cola
  
  Explorar lado DST:
    Buscar nodos conectados al hilo DST
    Crear paso "fusion-via-dst"
    Agregar a cola
```

### 5. **Resultado Final**
```
- Ordenar caminos por número de saltos
- Retornar todos los caminos encontrados
- Indicar cuál es el más corto
```

---

## 🔧 FUNCIONES AUXILIARES

### `normalizeId(id)`
Convierte IDs a tipo consistente para comparación segura.

### `findNodesConnectedToFiber(nodeMap, excludeNodeId, fiberInfo, fiberMap)`
Encuentra todos los nodos que tienen un device link conectado a una fibra/hilo específico.
- Excluye el nodo actual (no conectar consigo mismo)
- Verifica que el hilo esté activo
- Retorna array de conexiones

### `getThreadColor(fiber, threadNumber)`
Obtiene el color hexadecimal de un hilo específico para visualización.

### `formatPathForDisplay(pathResult)`
Convierte el resultado del pathfinding en formato legible para TimelineVertical.

---

## 📝 EJEMPLO DE FLUJO COMPLETO

### Escenario: UNIT_1 → MDF_1

**Topología:**
```
UNIT_1 (ONT) 
  ↓ [2F_UNIT_1, hilo 1]
P_1 (Pedestal con fusión: 2F_UNIT_1:1 ↔ 12F_1:1)
  ↓ [12F_1, hilo 1]
MDF_1 (ODF)
```

**Pasos del Algoritmo:**

1. **Inicio**: Cola = [{nodo: UNIT_1, path: [], visitados: {UNIT_1}}]

2. **Iteración 1**: Explorar UNIT_1
   - Device link: ONT puerto 1 → Fibra 2F_UNIT_1:1
   - Buscar otros nodos en 2F_UNIT_1:1
   - Encontrado: P_1 (Splitter puerto 2)
   - Agregar: {nodo: P_1, path: [UNIT_1→P_1], visitados: {UNIT_1, P_1}}

3. **Iteración 2**: Explorar P_1
   - Fusion link: 2F_UNIT_1:1 ↔ 12F_1:1
   - Explorar lado DST (12F_1:1)
   - Buscar nodos en 12F_1:1
   - Encontrado: MDF_1 (ODF puerto 1)
   - Agregar: {nodo: MDF_1, path: [UNIT_1→P_1→MDF_1], visitados: {UNIT_1, P_1, MDF_1}}

4. **Iteración 3**: Explorar MDF_1
   - ¡Es el destino!
   - Guardar camino completo
   - Continuar buscando otros caminos

5. **Resultado**: 
   ```javascript
   {
     success: true,
     paths: [{
       path: [
         {type: 'device-link', from: UNIT_1, to: P_1, ...},
         {type: 'fusion-via-dst', from: P_1, to: MDF_1, ...}
       ],
       hops: 2
     }],
     totalPaths: 1
   }
   ```

---

## ✅ VENTAJAS DEL NUEVO ALGORITMO

1. **Completo**: Encuentra TODOS los caminos posibles
2. **Eficiente**: BFS garantiza encontrar el camino más corto primero
3. **Robusto**: Maneja IDs mixtos (BD + temporales)
4. **Flexible**: Puede atravesar fusiones en cualquier dirección
5. **Debuggeable**: Logging detallado para troubleshooting
6. **Escalable**: Límite de iteraciones previene loops infinitos
7. **UX Mejorado**: Usuario puede ver todas las opciones de ruta
8. **Validado**: Verifica hilos activos y disponibles

---

## 🧪 TESTING RECOMENDADO

### Test 1: Ruta Directa
```
UNIT_1 → Pedestal → MDF
```
Debería encontrar 1 camino de 2 saltos.

### Test 2: Múltiples Rutas
```
UNIT_1 → Pedestal_A → MDF
UNIT_1 → Pedestal_B → IDF → MDF
```
Debería encontrar 2 caminos (2 saltos y 3 saltos).

### Test 3: Sin Ruta
```
UNIT_1 (sin conexiones) → MDF
```
Debería retornar `success: false` con mensaje de error.

### Test 4: Fusión Bidireccional
```
MDF → IDF (fusión bidireccional) → Pedestal → UNIT
```
Debería poder recorrer la fusión en reversa.

---

## 📚 ARCHIVOS MODIFICADOS

### 1. `components/hooks/useFiberPath.js` (REESCRITO COMPLETO)
- Función principal: `findAllFiberPaths()`
- Función legacy: `findFiberPath()` (compatibilidad)
- Helpers: `normalizeId()`, `findNodesConnectedToFiber()`, `getThreadColor()`
- Formato: `formatPathForDisplay()`

### 2. `components/screens/NodePath.js` (ACTUALIZADO)
- Componente: `RenderPath` (un solo camino)
- Componente: `RenderAllPaths` (todos los caminos + resumen)
- Hook: `useEffect` para ejecutar búsqueda al montar
- Estado: `finalPath` para almacenar resultado

---

## 🎯 PRÓXIMOS PASOS

1. **Probar en un proyecto real**
   - Crear UNIT con DROP fiber
   - Conectar a Pedestal
   - Crear fusión Pedestal → MDF
   - Ver rutas en NodePath

2. **Verificar logs en consola**
   - Debe mostrar todo el proceso de búsqueda
   - Indicar nodos explorados
   - Mostrar conexiones encontradas

3. **Validar visualización**
   - Timeline debe mostrar todos los saltos
   - Colores de hilos deben ser correctos
   - Badge debe indicar cantidad de caminos

4. **Reportar resultados**
   - Si encuentra caminos: ¡Éxito! ✅
   - Si no encuentra: revisar logs para ver dónde falla la conexión

---

## 💡 TIPS DE DEBUGGING

Si no encuentra rutas, revisar en consola:

1. **¿Se indexaron todos los nodos?**
   ```
   📍 Nodo: UNIT_1 [ID: 5] | Devices: 1 | Links: 1 | Fusions: 0
   ```

2. **¿Se indexaron todas las fibras?**
   ```
   🔷 Fibra: 2F_UNIT_1 [ID: 8] | Hilos activos: 2
   ```

3. **¿Se están explorando los device links?**
   ```
   🔗 Device: ONT | Port: 1 | Fiber: 8 | Thread: 1
   ↳ Conexiones encontradas: 1
   ```

4. **¿Se están explorando los fusion links?**
   ```
   🔥 Fusión: Fiber 8:1 ↔ Fiber 1:1
   ↳ Conexiones por SRC: 0
   ↳ Conexiones por DST: 1
   ```

5. **¿Los IDs coinciden?**
   - Verificar que `fiberId` en links coincida con ID de fibra indexada
   - Verificar que `nodeId` sea consistente (no mezclar id y hash)

---

## 🏁 CONCLUSIÓN

El nuevo algoritmo es una **solución completa y robusta** que:
- Corrige todas las deficiencias del algoritmo anterior
- Encuentra TODOS los caminos válidos
- Maneja correctamente device links y fusion links
- Proporciona visualización clara y detallada
- Facilita debugging con logging exhaustivo

**¡Ahora el pathfinding debería funcionar correctamente!** 🎉

Prueba creando un proyecto nuevo con la estructura:
```
MDF_1 (ODF 24F)
  ↓ Fibra 12F_1
Pedestal_1 (Splitter + Fusión)
  ↓ Fibra 2F_UNIT_1
UNIT_1 (ONT)
```

Y verás todas las rutas desde UNIT_1 hasta MDF_1 con todos los detalles de cada salto.
