# 🔧 Fiber Visibility Fix - Análisis y Solución

## 📋 Problema Identificado

### Sintomas Reportados:
1. **UNIT_1**: Solo registró 1 camino (del primer hilo)
2. **UNIT_2**: Fibra no visible al crear dispositivo - desapareció hasta guardar y recargar

### Root Cause Identificada:
**Problema de timing/estado** en `DeviceLinks.js` y `FusionLink.js`:
- Las fibras se cargan **solo una vez** al montar el componente (`useEffect` con dependencias vacías `[]`)
- Cuando creas una fibra nueva en `CreateProject` y navegas a `DeviceLinks`, el componente ya fue renderizado
- El estado de fibras **no se actualiza** porque no hay listeners para cambios

```javascript
// ❌ ANTES: Solo ejecuta una vez
useEffect(() => {
  const loadFibers = async () => { ... };
  loadFibers();
}, []); // Dependencias vacías = ejecuta solo al montar
```

---

## ✅ Solución Implementada

### 1. **Refactorizar `loadFibers` como Callback**

Convertir la función interna en un `useCallback` reutilizable:

```javascript
// ✅ DESPUÉS: Función reutilizable
const loadFibersForPicker = React.useCallback(async () => {
  // ... logica de carga
}, [projectId, node, getFibers, getNodes]);
```

**Ventajas:**
- Puede ser llamada desde múltiples lugares
- Dependencias explícitas para evitar stale closures
- Memoizado para evitar recreaciones innecesarias

### 2. **Agregar Hook `useFocusEffect`**

Recargar fibras **cada vez que la pantalla recibe foco**:

```javascript
useFocusEffect(
  React.useCallback(() => {
    console.log('🔄 DeviceLinks screen focused - reloading fibers');
    loadFibersForPicker();
    return () => { /* cleanup */ };
  }, [loadFibersForPicker])
);
```

**Flujo:**
1. Usuario crea fibra en `CreateProject`
2. Usuario navega a `DeviceLinks` 
3. Pantalla recibe foco → `useFocusEffect` dispara
4. Se ejecuta `loadFibersForPicker()`
5. **Fibra nueva aparece en selector** ✅

### 3. **Mantener useEffect Original**

El primer `useEffect` sigue activo para **carga inicial**:

```javascript
useEffect(() => {
  loadFibersForPicker().catch(e => console.error(e));
  if (device != undefined) setDeviceData(device);
}, [projectId, node?.id, device?.hash, loadFibersForPicker]);
```

**Dependencias actualizadas:**
- `projectId`: Cambio de proyecto
- `node?.id`: Cambio de nodo
- `device?.hash`: Cambio de dispositivo
- `loadFibersForPicker`: Cuando la función se recrea

---

## 📊 Comparación: Antes vs. Después

| Escenario | Antes | Después |
|-----------|-------|---------|
| **Crear fibra en CreateProject** | Fibra no aparece en DeviceLinks | Fibra aparece inmediatamente al navegar |
| **Guardar y recargar** | Fibra aparece (después del hard refresh) | No necesario - ya está visible |
| **Múltiples puertos** | No recarga automática | Se recarga al enfocar pantalla |
| **Performance** | Una carga al montar | Una carga inicial + recargas bajo demanda |

---

## 🎯 Archivos Modificados

### 1. **DeviceLinks.js**
```diff
+ import { useFocusEffect } from "@react-navigation/native";
+ const loadFibersForPicker = React.useCallback(async () => { ... }, [...]);
+ useFocusEffect(React.useCallback(() => { loadFibersForPicker(); }, [...]));
- useEffect(() => { const loadFibers = async () => { ... }; }, []);
+ useEffect(() => { loadFibersForPicker(); }, [...]);
```

### 2. **FusionLink.js**
- Mismo patrón que DeviceLinks
- Garantiza que fibras DROP nuevas aparezcan al crear fusiones

---

## 🧪 Testing

Para validar la solución:

1. **Crear UNIT_2 con fibra**
   - ✅ Fibra debe aparecer en selector de DeviceLinks sin guardar/recargar
   
2. **Conectar puertos**
   - ✅ Ambos puertos deben mostrar la fibra disponible
   
3. **Crear fusiones**
   - ✅ Fibras DROP deben aparecer en selector de FusionLink
   
4. **Pathfinding**
   - ✅ Debería encontrar caminos correctos sin duplicados

---

## 📈 Performance

- **Carga inicial**: Igual (un `useEffect` al montar)
- **Al enfocar pantalla**: +1 carga de BD (getFibers)
- **Impacto**: Mínimo (solo cuando se navega back)
- **Beneficio**: Sincronización correcta de estado

---

## 🔍 Logs Esperados

Ahora deberías ver en logs:

```
📋 Loading fibers for DeviceLinks picker...
🔷 DeviceLinks - UNIT Filter: UNIT_2 | Node ID (normalized): 4
✅ DeviceLinks - Showing 1 fiber(s) for this UNIT
✅ Buffers filtrados dinámicamente - Visibles: 1
🔄 DeviceLinks screen focused - reloading fibers
```

---

## 🚀 Próximos Pasos

1. ✅ Implementado en DeviceLinks.js
2. ✅ Implementado en FusionLink.js
3. 📝 Validar con test completo
4. 📝 Verificar pathfinding encuentra todos los caminos
5. 📝 Confirmar sin consumo de memoria excesivo
