# 📋 Reglas del Sistema - FibraOpticaApp

Conjunto de reglas, restricciones y validaciones que el sistema DEBE cumplir en todo momento.

---

## 🎯 Reglas Generales

### RG-001: Integridad de Datos
- Nunca permitir datos incompletos o huérfanos
- Validar antes de guardar
- Usar soft delete (marcar como `deleted = true`)

### RG-002: Sincronización Automática
- Cambios en local → automáticamente en BD
- Cambios en BD → actualizar UI inmediatamente
- No permitir desfases entre estado local y persistido

### RG-003: Offline-First
- Funcionar sin conexión a internet
- Sincronizar cuando hay conexión
- Mantener estado consistente en caché local

---

## 🗂️ Reglas de Proyectos

### RP-001: Creación de Proyecto
- TODO proyecto DEBE tener:
  - `name` (obligatorio, no vacío)
  - `creation_date` (asignado automáticamente)
  - Al menos 1 nodo MDF
  - Metadata con projectType

### RP-002: Nodos Base Automáticos
- Al crear proyecto → crear SIEMPRE:
  - 1 nodo MDF (typeId = 1)
  - 2+ nodos UNIT según requiera (typeId = 4)
  - 1+ nodos Pedestal/IDF según diseño (typeId = 3/2)

### RP-003: Fibras Automáticas
- Al crear nodo UNIT → generar automáticamente:
  - 1 DROP fiber con patrón: `2F_{UNIT_NAME}`
  - DROP fiber = 2 hilos (0-1)
  - DROP fiber asignada SOLO a ese UNIT (nodeId)

### RP-004: Eliminación de Proyecto
- Al eliminar proyecto:
  - Eliminar todos sus nodos (cascade)
  - Eliminar todas sus fibras (cascade)
  - Eliminar todos los dispositivos (cascade)
  - Eliminar todos los enlaces y fusiones (cascade)
  - Usar soft delete: `deleted = true`

---

## 🔌 Reglas de Nodos

### RN-001: Tipos de Nodo
- Existen 5 tipos SOLO:
  - typeId = 1: MDF (Main Distribution Frame)
  - typeId = 2: IDF (Intermediate Distribution Frame)
  - typeId = 3: Pedestal (Distribuidor)
  - typeId = 4: UNIT (Unidad residencial/comercial)
  - typeId = 5: Splitter (Divisor pasivo)

### RN-002: Label Único
- El `label` de un nodo DEBE ser ÚNICO dentro del proyecto
- No permitir 2 nodos con mismo nombre en mismo proyecto
- Validar antes de guardar

### RN-003: Nodo MDF Obligatorio
- TODO proyecto DEBE tener EXACTAMENTE 1 MDF
- No permitir eliminar el último MDF
- MDF es el punto de entrada de la red

### RN-004: Datos del Nodo
- Un nodo DEBE contener:
  - `label` (obligatorio)
  - `typeId` (obligatorio)
  - `metadata.devices` (array, puede estar vacío)
  - `metadata.fusionLinks` (array, puede estar vacío)

### RN-005: Eliminación de Nodo
- Al eliminar nodo:
  - Eliminar sus dispositivos y enlaces
  - Eliminar sus fusiones
  - SI es UNIT: eliminar su DROP fiber
  - SI es MDF: NO permitir (error)
  - NO eliminar fibras principales

---

## 📡 Reglas de Fibras

### RF-001: Tipos de Fibra
- **Fibra Principal:** `parentId = null`
  - Puede tener múltiples buffers
  - Distribuida en toda la red
  - Ejemplo: 48F_1, 12F_1

- **Buffer:** `parentId = ID de fibra padre`
  - Sub-divisiones de fibra principal
  - 12 hilos cada uno
  - Ejemplo: 48F_1_Buffer_1

- **DROP Fiber:** `parentId = null` Y `nodeId = UNIT_ID`
  - Asignada a un UNIT específico
  - 2 hilos
  - Ejemplo: 2F_UNIT_1

### RF-002: Hilos por Fibra
- Toda fibra (principal, buffer, drop) DEBE tener:
  - EXACTAMENTE 12 hilos
  - Numerados: 0-11 (internamente)
  - Mostrados: 1-12 (en UI)

### RF-003: Buffers en Fibra
- Fibra con `buffersCount = 1`: SIN buffers
- Fibra con `buffersCount = 3`: Crear Buffer_1, Buffer_2, Buffer_3
- Fibra con `buffersCount = 6`: Crear Buffer_1 a Buffer_6
- Número de buffers NUNCA cambiar después de crear

### RF-004: Visibilidad de Fibras
- **MDF (typeId = 1):**
  - VER: Todas fibras principales
  - NO VER: Drop fibers de UNITs
  
- **UNIT (typeId = 4):**
  - VER: Su propia DROP fiber (2F_UNIT_X)
  - VER: Todas fibras principales
  - NO VER: DROP fibers de otros UNITs
  
- **Pedestal/IDF (typeId = 3/2):**
  - VER: TODAS las fibras (principales + DROP + buffers)
  
- **Splitter (typeId = 5):**
  - VER: TODAS las fibras

### RF-005: Eliminación de Fibra
- Al eliminar fibra principal:
  - Eliminar TODOS sus buffers
  - Eliminar TODAS sus fusiones
  - Eliminar TODOS los enlaces que la referencien
  - Usar soft delete: `deleted = true`

### RF-006: Immutabilidad de Buffers
- Una vez creados los buffers de una fibra:
  - NO permitir agregar/quitar buffers
  - NO permitir cambiar número de buffers
  - Si necesita cambiar: eliminar fibra y recrearla

---

## 🔗 Reglas de Enlaces de Dispositivo (Device Links)

### RL-001: Estructura del Enlace
```javascript
{
  port: number,              // 1, 2, 3... (único en dispositivo)
  src: {
    fiberId: number,         // Obligatorio
    bufferId: number | null, // Null si fibra sin buffers
    thread: number           // 0-11
  }
}
```

### RL-002: Un Enlace por Puerto
- UN puerto = MÁXIMO 1 enlace
- Si puerto ya tiene enlace → ACTUALIZAR (no duplicar)
- Puerto sin enlace → permitir vacío

### RL-003: Validación de Hilo
- El hilo elegido DEBE estar disponible:
  - No estar en otro enlace del mismo dispositivo
  - No estar consumido en ese nodo
- Error si hilo ya usado: mostrar mensaje

### RL-004: Dispositivos Solo en MDF y UNIT
- Enlaces de dispositivo SOLO pueden existir en:
  - MDF (typeId = 1)
  - UNIT (typeId = 4)
- Pedestal/IDF/Splitter: NO pueden tener enlaces
- Validación: si typeId ≠ 1 y typeId ≠ 4 → error

### RL-005: Eliminación de Enlace
- Crear función `handleRemoveDeviceLink(portNumber)`
- Filtrar enlace del array: `links.filter(l => l.port !== portNumber)`
- Guardar nodo actualizado en BD
- Actualizar UI inmediatamente

### RL-006: Fibra del Enlace DEBE Existir
- La fibra referenciada en enlace DEBE:
  - Existir en la BD
  - NO estar eliminada (deleted = false)
  - Estar visible en ese nodo
- Si fibra no existe: error

---

## 🔀 Reglas de Fusiones (Fusion Links)

### RFU-001: Estructura de Fusión
```javascript
{
  hash: string,           // UUID único
  src: {
    fiberId: number,      // Obligatorio
    bufferId: number|null,// Null si fibra sin buffers
    thread: number,       // 0-11
    threadDisplay: number // 1-12 (mostrado)
  },
  dst: {
    fiberId: number,      // Obligatorio
    bufferId: number|null,
    thread: number,
    threadDisplay: number
  }
}
```

### RFU-002: Validación de Fusión
- Origen NUNCA = Destino
  - `src.fiberId ≠ dst.fiberId`
  - Error si son iguales

### RFU-003: Fusiones Solo en Pedestal/IDF
- Fusiones SOLO pueden existir en:
  - Pedestal (typeId = 3)
  - IDF (typeId = 2)
- Validación: si nodo es MDF/UNIT/Splitter → NO permitir

### RFU-004: Hilo Bidireccional
- Un hilo puede estar en múltiples fusiones:
  - Como ORIGEN en una
  - Como DESTINO en otra
  - Ejemplo: Pedestal_1 conecta 48F_1:0 → 2F_UNIT_1:0
            Pedestal_2 conecta 2F_UNIT_1:0 → 12F_1:0

### RFU-005: Eliminación de Fusión
- Crear función `handleRemoveFusion(fusionHash)`
- Filtrar fusión del array: `fusionLinks.filter(f => f.hash !== fusionHash)`
- Guardar nodo actualizado en BD
- Actualizar UI inmediatamente

### RFU-006: Hash Único
- CADA fusión debe tener `hash` ÚNICO
- Generar con: `crypto.randomUUID()` o librería similar
- Nunca permitir dos fusiones con mismo hash

### RFU-007: Bufferes Deben Coincidir
- Si `bufferId` en src → DEBE existir Buffer_X en fibra src
- Si `bufferId = null` → fibra SIN buffers
- Validar antes de crear

---

## 🎯 Reglas de Búsqueda de Rutas (Path Finding)

### RPTH-001: Algoritmo BFS
- Usar Breadth-First Search
- Máximo 10,000 iteraciones (prevenir bucles infinitos)
- Devolver TODOS los caminos posibles

### RPTH-002: Validez de Ruta
- Origen DEBE ser UNIT
- Destino DEBE ser UNIT
- Origen ≠ Destino
- Error si no cumplen

### RPTH-003: Consumo de Buffers
- Un buffer que se atraviesa = se marca como consumido
- Se cuentan todos los buffers usados en la ruta
- Información para usuario

### RPTH-004: Estadísticas de Ruta
- Calcular:
  - Número de saltos (fusiones usadas)
  - Buffers consumidos
  - Pedestales intermedios
  - Distancia total

---

## 🖼️ Reglas de Visibilidad de Buffers

### RB-001: Filtrado Dinámico
- Mostrar TODOS los buffers
- NO ocultar buffers aunque estén fusionados
- Un buffer puede estar en múltiples fusiones

### RB-002: MDF Ve Todo
- MDF SIEMPRE ve todos los buffers
- Sin excepción
- Sin filtrado

### RB-003: Otros Nodos
- Otros nodos ven TODOS los buffers disponibles
- Sin filtrado según consumo
- Validación de disponibilidad: en tiempo real

---

## 🔐 Reglas de Almacenamiento

### RA-001: Multi-Adaptador
- Seleccionar automáticamente según plataforma:
  - Web (Platform.OS = 'web') → Dexie
  - Móvil Dev-Build → expo-sqlite
  - Expo Go → REST API

### RA-002: Estructura Idéntica
- Misma estructura de datos en todos los adaptadores
- Cambios transparentes entre plataformas
- Sincronización automática

### RA-003: Persistencia Garantizada
- TODO cambio en estado DEBE persistirse en BD
- Validar que se guardó exitosamente
- Mostrar error si falla

### RA-004: Caché Local
- Mantener copia en memoria
- Sincronizar con BD
- Actualizar UI desde estado local

---

## 🎨 Reglas de UI/UX

### RUI-001: Confirmación de Eliminación
- Toda eliminación crítica → mostrar alert
- Pedir confirmación antes de ejecutar
- Mensaje claro sobre consecuencias

### RUI-002: Estados Visuales
- Mostrar loading mientras se guarda
- Mostrar error si falla
- Mostrar success al completar

### RUI-003: Números de Hilo
- Almacenar: 0-11
- Mostrar: 1-12
- Convertir en ambas direcciones

### RUI-004: Validación en Tiempo Real
- Indicar campos requeridos
- Validar antes de permitir guardar
- Mostrar mensajes de error específicos

---

## 🚫 Reglas de Prevención de Errores

### RPE-001: Validación de Referencias
- NO permitir referencias huérfanas
- Si se elimina fibra: eliminar referencias en enlaces
- Si se elimina nodo: eliminar referencias en fusiones

### RPE-002: Prevenir Duplicados
- Labels únicos en proyecto
- Hashes únicos en fusiones
- Puertos únicos en dispositivo

### RPE-003: Prevenir Bucles
- Una fibra NO puede fusionarse consigo misma
- Máximo iteraciones en BFS
- Detectar ciclos en rutas

### RPE-004: Transacciones Atómicas
- Todo cambio es completo O nada
- Si falla a mitad: rollback
- Mantener integridad

---

## 📊 Reglas de Dispositivos

### RD-001: Puertos del Dispositivo
- Cada dispositivo DEBE tener:
  - `portsCount`: número de puertos
  - `ports`: array con puertos 1 a portsCount
  - Cada puerto: `{ number, enabled }`

### RD-002: Tipos de Dispositivo
- **Switch:** 24 puertos (customizable)
- **Access Point:** 4 puertos
- **Splitter:** 2-4 puertos
- **Otro:** según especificación

### RD-003: Puertos Habilitados/Deshabilitados
- Puerto con `enabled = false` → NO poder crear enlace
- Mostrar en UI como deshabilitado
- Permitir habilitar después

### RD-004: Dispositivo Sin Enlace
- Dispositivo PUEDE no tener enlaces
- NO es error
- Permitir vacío

---

## 🔄 Reglas de Transiciones de Estado

### RTE-001: Nodo Creation → Guardado
```
Estado Nuevo (local)
  ↓
Validar (obligatorios)
  ↓
Persistir en BD
  ↓
Actualizar estado global
  ↓
Actualizar UI
```

### RTE-002: Enlace Creation → Guardado
```
Seleccionar fibra
  ↓
Seleccionar buffer
  ↓
Seleccionar hilo
  ↓
Validar no usado
  ↓
Agregar a deviceData
  ↓
Guardar nodo
```

### RTE-003: Fusión Creation → Guardado
```
Seleccionar origen (fibra + buffer + hilo)
  ↓
Seleccionar destino
  ↓
Validar origen ≠ destino
  ↓
Generar hash UUID
  ↓
Agregar a fusionLinks
  ↓
Guardar nodo
```

---

## 🛡️ Reglas Críticas (MUST HAVE)

### **CRÍTICA-001:** Integridad Referencial
- Nunca permitir referencia a entidad eliminada
- CASCADE delete automático
- Validación antes de operación

### **CRÍTICA-002:** Unicidad de Labels
- Labels ÚNICOS por proyecto
- Validar antes de guardar
- Error si duplicado

### **CRÍTICA-003:** MDF Obligatorio
- TODO proyecto DEBE tener MDF
- NUNCA permitir eliminarlo
- Validación al eliminar nodo

### **CRÍTICA-004:** Hilos 0-11
- Almacenamiento: SIEMPRE 0-11
- UI: SIEMPRE +1 al mostrar
- Conversión en ambas direcciones

### **CRÍTICA-005:** Soft Delete
- Marcar como `deleted = true`
- NO usar hard delete
- Mantener historial

### **CRÍTICA-006:** Sincronización
- Cambios local = cambios BD
- Inmediatamente
- Sin excepciones

---

## ✅ Checklist de Validación

Antes de GUARDAR cualquier cambio, validar:

- [ ] ¿Datos obligatorios están llenos?
- [ ] ¿Referencias existen en BD?
- [ ] ¿No hay duplicados?
- [ ] ¿Tipos son correctos?
- [ ] ¿Estado es consistente?
- [ ] ¿Se puede persistir?
- [ ] ¿UI se actualiza?

---

**Versión:** 1.2.0  
**Última actualización:** Enero 2026
