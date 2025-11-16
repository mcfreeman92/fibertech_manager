# Análisis de Bug: Nodos Desapareciendo

## 📋 Problema Reportado

Al crear un proyecto o editar uno existente, los nodos IDF/Pedestal agregados manualmente desaparecen después de guardar y reabrir. Las unidades también desaparecen pero siguen contando en el límite de unidades máximas.

## 🏗️ Arquitectura del Sistema

### Tipos de Nodos:

1. **MDF (Main Distribution Frame)** - `typeId: 1`
   - Único por proyecto
   - Se crea automáticamente al iniciar proyecto
   - NO se puede eliminar
   - Puede tener dispositivos conectados

2. **IDF (Intermediate Distribution Frame)** - `typeId: 2`
   - Puntos intermedios de conexión
   - Se agregan manualmente según necesidad
   - Pueden eliminarse
   - Para fusión de fibras

3. **PEDESTAL** - `typeId: 3`
   - Similar a IDF, punto intermedio
   - Se agregan manualmente
   - Para conexiones exteriores

4. **UNIT (Unidades)** - `typeId: 4`
   - Cantidad máxima definida por: living_unit + office_amenities + commercial_unit
   - Se agregan MANUALMENTE una por una hasta el límite
   - Pueden tener dispositivos
   - Nomenclatura secuencial: UNIT_1, UNIT_2, UNIT_3...

## 🔍 Problema Real Identificado

### **PROBLEMA CRÍTICO: Sistema de Filtros Destructivo**

**Ubicación**: `handleFilterNodeSelect()` línea ~227

**Código Problemático**:
```javascript
// Al seleccionar un filtro
const filtered = nodes.filter((x) => x.typeId == filter.id);
setNodes(filtered);  // ❌ SOBRESCRIBE el estado, perdiendo los demás nodos
```

**Flujo del Bug**:
1. Usuario carga proyecto → Estado tiene: [1 MDF, 2 IDF, 3 Units, 1 Pedestal]
2. Usuario aplica filtro "MDF" → `setNodes([solo MDF])`
3. Estado `nodes` ahora = [1 MDF solamente]
4. Usuario guarda proyecto → ❌ **Solo guarda el MDF porque es lo único en el estado**
5. Los demás nodos se pierden permanentemente

**Problema**: El sistema de filtros MODIFICA el estado en lugar de solo filtrar la visualización

---

### 2. **Inconsistencia de Capitalización de Campos**

**Problema**: La base de datos devuelve campos en PascalCase (`TypeId`, `ProjectId`, `Label`...) pero el código de la app usa camelCase (`typeId`, `projectId`, `label`...)

**Ejemplos**:
- DB: `node.TypeId` vs App: `node.typeId`
- DB: `node.ProjectId` vs App: `node.projectId`
- DB: `node.Label` vs App: `node.label`
- DB: `node.Metadata` vs App: `node.metadata`

**Impacto**: 
- Los filtros no funcionan correctamente
- Las comparaciones fallan
- Los datos no se actualizan

**Solución Aplicada**: Mapeo explícito entre formatos DB ↔ App en todos los puntos de entrada/salida

---

### 3. **Metadata No Se Parsea Correctamente**

**Problema**: `Metadata` se almacena como JSON string en DB pero no siempre se parsea al recuperar

**Código Problemático**:
```javascript
await createNode({
  metadata: JSON.stringify(meta),  // ❌ String pero adapter espera objeto
})
```

**Solución Aplicada**: Pasar objeto directamente, el adapter se encarga de stringify

---

### 4. **Filtros de Nodos Inconsistentes**

**Problema en `handleFilterNodeSelect`**: Usa `x.typeId` con minúscula cuando DB devuelve `TypeId` con mayúscula

**Solución Aplicada**: Mapear campos antes de filtrar

---

## ✅ Solución Implementada: Patrón de Estado Dual

### **Concepto: Separar Estado Completo de Vista Filtrada**

```javascript
const [allNodes, setAllNodes] = useState([]);  // ✅ Estado completo (fuente de verdad)
const [nodes, setNodes] = useState([]);         // ✅ Vista filtrada (solo para UI)
```

### 1. **Al Cargar Proyecto**

```javascript
const mappedNodes = dbNodes.map(node => ({
  id: node.Id,
  label: node.Label,
  typeId: node.TypeId,
  // ... resto de campos
}));

// Guardar TODOS los nodos
setAllNodes(mappedNodes);

// Aplicar filtro por defecto para visualización
const filtered = mappedNodes.filter(x => x.typeId === selectedNodesFilter.id);
setNodes(filtered);
```

### 2. **Al Filtrar (NO destructivo)**

```javascript
const handleFilterNodeSelect = (filter) => {
  // Filtrar desde allNodes, no recargar ni mutar
  let filtered = filter.id == 0 
    ? allNodes  // Todos
    : allNodes.filter((x) => x.typeId == filter.id);

  setNodes(filtered);  // Solo actualiza la vista
  // allNodes permanece intacto ✅
};
```

### 3. **Al Agregar Nodo**

```javascript
const newNode = { /* ... */ };

// Actualizar estado completo
setAllNodes((prev) => [...prev, newNode]);

// Si el filtro actual lo incluye, mostrarlo
if (selectedNodesFilter.id === 0 || selectedNodesFilter.id === nodeType.id) {
  setNodes((prev) => [...prev, newNode]);
}
```

### 4. **Al Guardar Proyecto**

```javascript
// Guardar desde allNodes, NO desde nodes (vista filtrada)
for (let i = 0; i < allNodes.length; i++) {
  const node = allNodes[i];
  // Guardar...
}
```

### 3. Mapeo al Crear Nodos en DB

```javascript
const dbNode = await createNode({
  Label: node.label,
  ProjectId: node.projectId,
  TypeId: node.typeId || "",
  Description: "",
  Metadata: meta,  // Objeto, no string
  CreatedDate: node.createdDate,
  ModifiedDate: node.modifiedDate,
});

// Devolver en formato app
return {
  id: dbNode.Id,
  label: dbNode.Label,
  // ... resto de campos
};
```

### 4. Mapeo al Actualizar Nodos

```javascript
await updateNode(node.id, {
  Label: node.label,
  TypeId: node.typeId,
  Description: node.description || "",
  Metadata: meta,  // Objeto, no string
  ModifiedDate: new Date().toISOString(),
});
```

### 5. Mapeo en Filtros

```javascript
const handleFilterNodeSelect = async (filter) => {
  const result = await getNodes(projectId);
  const mappedNodes = result.map(mapNodeFromDB);
  
  if (filter.id == 0) src = mappedNodes;
  else src = mappedNodes.filter((x) => x.typeId == filter.id);
  
  setNodes(src);
};
```

---

## 🧪 Cómo Probar la Corrección

1. **Crear Proyecto Nuevo**:
   - Crear proyecto con 5 unidades
   - Agregar 2 IDF, 3 Pedestales
   - Guardar proyecto
   - ✅ Verificar: Volver a abrir el proyecto y ver que todos los nodos aparecen

2. **Editar Proyecto Existente**:
   - Abrir proyecto con nodos
   - Agregar 2 nodos nuevos
   - Guardar
   - ✅ Verificar: Los nodos nuevos y viejos aparecen

3. **Filtros de Nodos**:
   - Crear proyecto con varios tipos de nodos
   - Usar filtro "MDF", "IDF", "Unit", "Todos"
   - ✅ Verificar: Cada filtro muestra los nodos correctos

4. **Límite de Unidades**:
   - Crear proyecto con 3 unidades máximas
   - Intentar agregar 4ta unidad
   - ✅ Verificar: Error "máximo de unidades alcanzado"
   - Intentar agregar IDF/Pedestal
   - ✅ Verificar: Se permite (no son unidades)

---

## 🐛 Otros Bugs Encontrados

### Bug en `doCreateFiber`
```javascript
dbFiber.buffers.pus(dbBuffer);  // ❌ Typo: debería ser "push"
```

**Solución Pendiente**: Cambiar a `push`

---

## 📝 Notas para el Futuro

1. **Convención de Nomenclatura**: Decidir si usar PascalCase o camelCase consistentemente
2. **Capa de Mapeo**: Considerar crear una capa de mapeo centralizada (DTO pattern)
3. **TypeScript**: Ayudaría a detectar estos problemas en tiempo de compilación
4. **Pruebas Unitarias**: Agregar tests para funciones de mapeo y CRUD

---

## 🔄 Estado Actual

- ✅ Mapeo de campos DB → App implementado
- ✅ `loadProjectData` corregido para cargar todos los nodos
- ✅ `doCreateNode` devuelve nodos mapeados correctamente
- ✅ `updateNode` usa nombres de campos correctos
- ✅ `handleFilterNodeSelect` mapea antes de filtrar
- ⚠️ Pendiente: Corregir typo `pus` → `push` en `doCreateFiber`
- ⚠️ Pendiente: Revisar `doCreateFiber` por problemas similares

---

## 📚 Archivos Modificados

1. `components/screens/CreateProject.js`:
   - `loadProjectData()` - Línea ~595
   - `doCreateNode()` - Línea ~932
   - `handleFilterNodeSelect()` - Línea ~234
   - `handleSaveProject()` - updateNode call

---

**Fecha**: Noviembre 16, 2025
**Autor**: GitHub Copilot
**Estado**: Parcialmente Resuelto - Requiere Pruebas
