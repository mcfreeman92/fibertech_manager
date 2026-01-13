# 📡 FibraOpticaApp - Documentación Completa del Sistema

Documentación exhaustiva del funcionamiento, lógica y almacenamiento de datos de la aplicación de gestión de infraestructura de fibra óptica.

---

## 📋 Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Arquitectura de la Aplicación](#arquitectura-de-la-aplicación)
3. [Sistema de Almacenamiento](#sistema-de-almacenamiento)
4. [Estructuras de Datos](#estructuras-de-datos)
5. [Flujos de Lógica Principal](#flujos-de-lógica-principal)
6. [Particularidades Técnicas](#particularidades-técnicas)
7. [Navegación y Pantallas](#navegación-y-pantallas)

---

## 🎯 Visión General

**FibraOpticaApp** es una aplicación React Native multiplataforma (iOS, Android, Web) para:
- 📊 Gestión de proyectos de fibra óptica
- 🗺️ Visualización de redes de nodos
- 🔗 Configuración de conexiones (fusiones y enlaces)
- 🛠️ Registro de mantenimiento con evidencia multimedia
- 📱 Escaneo QR de proyectos y equipos
- 💾 Almacenamiento local con sincronización

**Stack Tecnológico:**
- React Native + Expo (Framework)
- REST API / SQLite (Almacenamiento)
- React Navigation (Navegación)
- React Hook Form + Yup (Validación)
- Dexie (IndexedDB para web)
- expo-sqlite (SQLite nativo para móvil)

---

## 🏗️ Arquitectura de la Aplicación

### Estructura de Carpetas

```
fibertech_manager/
├── api/
│   ├── adapters/           # Diferentes adaptadores de BD
│   │   ├── restAdapter.js         # API REST
│   │   ├── sqliteAdapter.js       # SQLite nativo (móvil)
│   │   └── sqliteWebAdapter.js    # Dexie (web)
│   ├── config/
│   │   └── dataSource.js          # Selector automático de adaptador
│   ├── contexts/
│   │   └── DatabaseContext.js     # Contexto de BD
│   └── services/
│       ├── projectService.js      # CRUD de proyectos
│       ├── nodeService.js         # CRUD de nodos
│       └── fiberService.js        # CRUD de fibras
├── components/
│   ├── screens/            # Pantallas principales
│   │   ├── DashboardScreen.js
│   │   ├── CreateProject.js       # Creación de proyectos
│   │   ├── DeviceLinks.js         # Gestión de enlaces
│   │   ├── FusionLink.js          # Gestión de fusiones
│   │   ├── NodeDetails.js         # Detalles de nodo
│   │   ├── NodePath.js            # Búsqueda de rutas
│   │   ├── ViewOnMap.js           # Visualización de mapa
│   │   └── ...
│   ├── hooks/              # Custom hooks
│   │   ├── useFilePicker.js       # Selección de archivos
│   │   ├── useFiberPath.js        # Algoritmo de rutas
│   │   └── useTranslation.js      # i18n
│   ├── context/            # Context API
│   │   ├── AppContext.js          # Estado global
│   │   └── DeviceContext.js       # Contexto de dispositivo
│   └── navigation/
│       └── AppNavigator.js        # Stack Navigator
├── service/
│   ├── storage.js          # Servicios de almacenamiento
│   └── database.js         # Inicialización de BD
└── utils/
    ├── dataConsistencyChecker.js  # Validación de datos
    └── bufferVisibilityManager.js # Visibilidad de buffers
```

---

## 💾 Sistema de Almacenamiento

### Arquitectura Multi-Adaptador

La aplicación usa un sistema inteligente que selecciona automáticamente el adaptador según la plataforma:

#### 1. **Detección Automática (dataSource.js)**

```javascript
const IS_WEB = Platform.OS === 'web';
const IS_NATIVE = Platform.OS === 'android' || Platform.OS === 'ios';

// Expo Go: USA REST (sin módulos nativos)
// Dev-Build: USA expo-sqlite
// Web: USA Dexie
const FORCE_REST_EXPO_GO = true; // Cambiar a false para dev-build

export const DATA_SOURCE = IS_WEB ? 'web' : FORCE_REST_EXPO_GO ? 'rest' : 'native';
```

#### 2. **Adaptadores Disponibles**

| Plataforma | Adaptador | Base de Datos | Caso de Uso |
|-----------|-----------|---------------|-----------|
| **Web** 🌐 | sqliteWebAdapter | Dexie (IndexedDB) | Desarrollo/Navegador |
| **Móvil Dev-Build** 📱 | sqliteAdapter | expo-sqlite | App nativa compilada |
| **Expo Go** 🎯 | restAdapter | API REST | Testing móvil rápido |

#### 3. **REST Adapter (Fallback)**

Cuando se usa REST, la app se conecta a un servidor backend:
- Endpoints: `/api/projects`, `/api/nodes`, `/api/fibers`
- Métodos: GET, POST, PUT, DELETE
- Autenticación: Token (AsyncStorage)
- Uso: Testing rápido sin configurar BD local

#### 4. **SQLite Nativo (expo-sqlite)**

Para compilaciones nativas (Android/iOS):
```javascript
db = SQLite.openDatabaseSync('fiber.db');
db.execSync('CREATE TABLE IF NOT EXISTS projects (...)');
```

**Ventajas:**
- ✅ Acceso local sin conexión
- ✅ Sincronización automática
- ✅ Rendimiento superior
- ⚠️ Requiere compilación dev-build

#### 5. **Dexie (Web)**

Para navegadores modernos:
```javascript
const db = new Dexie('FiberDatabase');
db.version(1).stores({
  projects: '++id, name, createdDate',
  nodes: '++id, label, projectId, typeId',
  fibers: '++id, typeId, label, projectId, parentId, nodeId',
  medias: '++id, nodeId, label, comment'
});
```

**Ventajas:**
- ✅ Sin servidor necesario
- ✅ Sincronización local automática
- ✅ Persistencia en IndexedDB
- ⚠️ Limitado a 50MB típicamente

---

## 📊 Estructuras de Datos

### 1. Proyecto (Project)

```javascript
{
  id: number,                    // PK
  name: string,                  // Ej: "Barrio Centro - 2024"
  creation_date: DateTime,       // Fecha de creación
  modified_date: DateTime,       // Última modificación
  main_node_id: string,          // ID del nodo principal (MDF)
  deleted: boolean,              // Soft delete
  metadata: {
    description: string,
    location: string,
    status: 'active' | 'maintenance' | 'completed',
    projectType: {
      build_type: string,        // Ej: "residential"
      job_type: string,          // Ej: "new_construction"
      building_type: string      // Ej: "single_family"
    }
  }
}
```

### 2. Nodo (Node)

```javascript
{
  id: number,                    // PK
  label: string,                 // Ej: "MDF", "UNIT_1", "Pedestal_5"
  projectId: number,             // FK a project
  typeId: number,                // Tipo de nodo
  description: string,
  metadata: {
    devices: [                   // Dispositivos conectados
      {
        hash: string,            // UUID único
        label: string,           // Ej: "Switch", "Access Point"
        type: string,            // "switch" | "access_point" | etc
        serialNumber: string,
        mac: string,
        portsCount: number,
        defaultPorts: number,
        ports: [
          {
            number: number,      // Puerto 1, 2, 3...
            enabled: boolean
          }
        ],
        links: [                 // Enlaces de dispositivo
          {
            port: number,        // Puerto local
            src: {
              fiberId: number,   // ID de fibra
              bufferId: number,  // ID de buffer
              thread: number     // Hilo (0-11)
            }
          }
        ]
      }
    ],
    fusionLinks: [               // Fusiones entre fibras
      {
        hash: string,            // UUID único
        src: {
          fiberId: number,
          fiberLabel: string,
          bufferId: number,      // null si es fibra sin buffers
          bufferLabel: string,
          thread: number         // 0-11 (mostrado como 1-12)
        },
        dst: {
          fiberId: number,
          fiberLabel: string,
          bufferId: number,
          bufferLabel: string,
          thread: number
        }
      }
    ]
  },
  createdDate: DateTime,
  modifiedDate: DateTime,
  deleted: boolean
}
```

#### Tipos de Nodos (typeId)

| ID | Tipo | Descripción | Propiedades |
|----|------|-----------|-----------|
| 1 | MDF | Punto central de distribución | Solo ve fibras principales |
| 2 | IDF | Distribuidor intermedio | Ve fibras principales y locales |
| 3 | Pedestal | Caja de distribución | Ver fibras y crear fusiones |
| 4 | UNIT | Unidad de usuario | Solo ve su DROP fiber |
| 5 | Splitter | Divisor óptico | Punto de distribución pasivo |

### 3. Fibra (Fiber)

```javascript
{
  id: number,                    // PK
  label: string,                 // Ej: "48F_1", "2F_UNIT_1"
  typeId: number,                // 3 para fibra simple, 4 para fibra padre
  projectId: number,             // FK a project
  parentId: number,              // Para buffers: FK a fibra padre
  nodeId: number,                // FK a nodo (solo para DROP fibers)
  threads: Array<number>,        // 12 hilos: [0,1,2,3...11]
  buffers: [                     // Solo para fibras multi-buffer (48F)
    {
      id: number,
      label: string,             // Ej: "48F_1_Buffer_1"
      parentId: number,          // ID de la fibra padre
      threads: Array<number>
    }
  ],
  createdDate: DateTime,
  modifiedDate: DateTime,
  deleted: boolean
}
```

#### Clasificación de Fibras

**Fibra Principal (Main Fiber)**
- Sin `parentId`
- Puede tener `buffers`
- Repartida en toda la red
- Ej: "48F_1", "2F_UNIT_1"

**Buffer**
- Tiene `parentId` (referencia a fibra padre)
- 12 hilos
- Clasificación: "48F_1_Buffer_1", "48F_1_Buffer_2", "48F_1_Buffer_3"

**DROP Fiber**
- Asignada a un UNIT específico (`nodeId`)
- Ej: "2F_UNIT_1", "2F_UNIT_2"
- Solo visible en ese UNIT y pedestales/IDF

### 4. Enlace de Dispositivo (Device Link)

```javascript
{
  port: number,                  // Puerto del dispositivo (1-24 típicamente)
  src: {
    fiberId: number,             // ID de fibra conectada
    bufferId: number,            // null si es fibra sin buffers
    thread: number               // Hilo usado (0-11)
  }
}
```

**Particularidad:** Un hilo solo puede usarse una vez en toda la aplicación.

### 5. Fusión (Fusion Link)

```javascript
{
  hash: string,                  // UUID único para identificación
  src: {
    fiberId: number,             // Fibra origen
    fiberLabel: string,
    bufferId: number,            // null para fibras simples
    bufferLabel: string,
    thread: number,              // 0-11
    threadDisplay: number        // 1-12 (mostrado a usuario)
  },
  dst: {
    fiberId: number,             // Fibra destino
    fiberLabel: string,
    bufferId: number,
    bufferLabel: string,
    thread: number,
    threadDisplay: number
  }
}
```

**Lógica:**
- Conecta dos puntos de la red
- Puede ser bidireccional (entrada y salida)
- Un hilo puede estar en múltiples fusiones (distribución)
- Consumo de hilos: cuando se fusiona, ese hilo "desaparece" del buffer origen

---

## 🔄 Flujos de Lógica Principal

### 1. Creación de Proyecto (CreateProject.js)

```
Usuario Inicia Proyecto
    ↓
├─ Define nombre, tipo, ubicación
├─ Crea nodos base (MDF, UNITs, Pedestales)
│  └─ Cada nodo genera DROP fibers automáticamente
│     └─ 2F_UNIT_1, 2F_UNIT_2, etc (2 hilos cada una)
├─ Crea fibras principales (48F, 12F, etc)
│  ├─ Define número de buffers (1, 3, 6, etc)
│  └─ Si buffers > 1: genera Buffer_1, Buffer_2, etc
├─ Agrega dispositivos a nodos (Switch, Access Point)
│  └─ Cada dispositivo tiene puertos (24, 4, 2, etc)
└─ GUARDAR → Persiste en BD
```

**Código relevante:**
```javascript
// Crear nodo
const node = buildNode(label, typeId);

// Crear fibra con buffers
const fiber = buildFiber(fiberLabel, typeId);
for (let i = 0; i < buffersCount - 1; i++) {
  const buffer = buildFiber(`${fiberLabel}_Buffer_${i + 1}`);
  fiber.buffers.push(buffer);
}

// Crear DROP fiber automáticamente para cada UNIT
const dropFiber = buildFiber(`2F_${unitName}`, typeId);
```

### 2. Gestión de Enlaces (DeviceLinks.js)

```
Nodo → Dispositivo → Puerto → Enlace de Fibra
    ↓
├─ Usuario selecciona puerto
├─ Elige fibra disponible
│  └─ Filtrado: excluye fibras DROP de otras UNITs
│     └─ MDF: ve todas
│     └─ UNIT: solo ve su DROP + fibras principales
│     └─ Pedestal: ve todas excepto DROP de UNITs
├─ Elige buffer (si fibra tiene múltiples)
├─ Elige hilo (0-11)
│  └─ **VALIDACIÓN:** Ese hilo no puede estar en otro enlace del mismo dispositivo
├─ GUARDAR → Actualiza deviceData
└─ Al guardar nodo: persiste en BD
```

**Validaciones:**
```javascript
// Un puerto = un hilo de una fibra
if (deviceData.links.some(l => l.port === selectedPort)) {
  // Actualizar enlace existente
} else {
  // Crear nuevo enlace
}
```

**Eliminación de enlace:**
```javascript
const handleRemoveDeviceLink = (portNumber) => {
  const updatedLinks = deviceData.links.filter(link => link.port !== portNumber);
  setDeviceData({ ...deviceData, links: updatedLinks });
};
```

### 3. Gestión de Fusiones (FusionLink.js)

```
Pedestal/IDF → Fusión de Fibras
    ↓
├─ Usuario selecciona nodo (Pedestal, IDF)
├─ Define ORIGEN (src)
│  ├─ Fibra origen
│  ├─ Buffer (si aplica)
│  └─ Hilo (0-11)
├─ Define DESTINO (dst)
│  ├─ Fibra destino (diferente a origen)
│  ├─ Buffer (si aplica)
│  └─ Hilo (si aplica)
├─ **VALIDACIÓN:** Origen ≠ Destino
└─ GUARDAR → Agrega a fusionLinks del nodo
```

**Filtrado de fibras según tipo de nodo:**
```javascript
// En Pedestal/IDF: mostrar TODAS las fibras
// En MDF: NO mostrar fibras DROP de UNITs
// En UNIT: NO crear fusiones (solo dispositivos)

if (node.typeId === 1) {
  // MDF: excluir DROP fibers
  records = records.filter(f => !f.nodeId);
} else if (node.typeId === 4) {
  // UNIT: solo mostrar su DROP + principales
  records = records.filter(f => f.nodeId === node.id || !f.nodeId);
}
```

### 4. Búsqueda de Rutas (useFiberPath.js)

```
De UNIT_A a UNIT_B
    ↓
1. BFS por nodos conectados:
   UNIT_A → (device link) → Fibra → (fusion) → Fibra → (device link) → UNIT_B

2. Algoritmo detallado:
   ├─ Partir desde dispositivo de UNIT_A
   ├─ Seguir enlace de fibra
   ├─ Buscar fusiones que usen esa fibra
   ├─ Cambiar a fibra destino de la fusión
   ├─ Buscar pedestales intermedios si es necesario
   ├─ Llegar a dispositivo de UNIT_B
   └─ RESULTADO: lista de pasos y buffers consumidos

3. Estadísticas:
   - Saltos: número de fusiones
   - Buffers consumidos: 4 (uno por fusión)
   - Pedestales intermedios: si aplica
```

**Código clave:**
```javascript
// Buscar conexión de dispositivo
const deviceLink = node.devices
  .flatMap(d => d.links)
  .find(l => l.src?.fiberId === fiberId);

// Buscar fusión que use ese hilo
const fusion = someNode.fusionLinks
  .find(f => (f.src?.fiberId === fiberId && f.src?.thread === thread) ||
             (f.dst?.fiberId === fiberId && f.dst?.thread === thread));

// Cambiar a fibra destino
const nextFiberId = fusion.dst?.fiberId;
```

---

## ⚙️ Particularidades Técnicas

### 1. **Numeración de Hilos (0-12 vs 1-13)**

**Almacenamiento:** Hilos internos van de **0 a 11**
**Mostrado a usuario:** Se suma 1, mostrando **1 a 12**

```javascript
// En BD: thread = 0, 1, 2...
// En UI: `Hilo ${thread + 1}` = Hilo 1, Hilo 2...

const displayThread = thread + 1;  // Para mostrar
const storageThread = displayThread - 1;  // Para guardar
```

### 2. **Buffer Dinámico vs Fijo**

Una fibra como **48F_1** tiene:
- **1 fibra padre:** 48F_1 (12 hilos)
- **3 buffers:** Buffer_1, Buffer_2, Buffer_3 (12 hilos c/u)
- **Total:** 48 hilos disponibles

```javascript
// Crear buffers automáticamente
for (let i = 0; i < fiberType.buffersCount - 1; i++) {
  const buffer = buildFiber(`${fiberLabel}_Buffer_${i + 1}`);
  buffers.push(buffer);
}
```

### 3. **Visibilidad de Fibras**

| Nodo | Ve | NO Ve |
|------|----|----|
| MDF | Todas principales | DROP fibers de UNITs |
| UNIT_1 | Su DROP (2F_UNIT_1) + principales | DROP de otros UNITs |
| Pedestal | Todas | Nada (ve todo) |
| IDF | Todas | Nada (ve todo) |

**Implementación en DeviceLinks.js:**
```javascript
if (node.typeId === 1) {
  // MDF: excluir DROP
  records = records.filter(f => !f.nodeId);
} else if (node.typeId === 4) {
  // UNIT: solo su DROP
  records = records.filter(f => f.nodeId === node.id || !f.nodeId);
}
```

### 4. **Soft Delete vs Hard Delete**

Todos los registros tienen campo `deleted: boolean`:
- `deleted = false`: Visible
- `deleted = true`: Oculto (pero en BD)

**Utilidad:** Historial y recuperación sin perder integridad relacional

```javascript
// Cargar activos
const projects = await db.projects
  .where('deleted').equals(0)
  .toArray();
```

### 5. **Sincronización Multi-Adaptador**

Cuando cambias de adaptador (web ↔ móvil):
1. Estructura de datos es idéntica
2. Cambio en `dataSource.js` automático por plataforma
3. **No hay migración:** mismos métodos de API

```javascript
// El mismo método funciona en cualquier adaptador
await adapter.saveNode(projectId, node);
// Internamente:
// - REST: POST /api/nodes
// - SQLite: INSERT INTO nodes
// - Dexie: db.nodes.put()
```

### 6. **Persistencia de Estado**

**AsyncStorage (React Native):**
- Token de autenticación
- Preferencias de usuario
- Caché de proyectos

**Adapters (BD Principal):**
- Proyectos
- Nodos
- Fibras
- Dispositivos
- Fusiones

### 7. **Validaciones Críticas**

**Device Link:**
```javascript
// No permitir 2 enlaces al mismo puerto
if (index === -1) {
  links.push(newLink);
} else {
  links[index].src = newLink.src;  // Actualizar
}
```

**Fusion Link:**
```javascript
// No permitir fusión de la misma fibra
if (srcFiberId === dstFiberId) {
  throw Error('No se puede fusionar una fibra consigo misma');
}
```

---

## 🗺️ Navegación y Pantallas

### Stack Navigator Structure

```
AppNavigator
├─ Login (si no autenticado)
└─ Stack Autenticado:
   ├─ DashboardScreen (Inicio)
   │  └─ Listado de proyectos
   ├─ CreateProject
   │  ├─ Creación de nodos
   │  ├─ Creación de fibras
   │  ├─ Adición de dispositivos
   │  └─ Generación de QR
   ├─ ListaProyectos / DetallesProyecto
   │  └─ Información detallada
   ├─ CreateMaintenance
   │  ├─ Formulario de mantenimiento
   │  └─ Captura multimedia
   ├─ ScanQr
   │  ├─ Escaneo de código QR
   │  └─ Importación de proyectos
   ├─ ViewOnMap
   │  ├─ Mapa de red interactivo
   │  └─ Búsqueda de nodos
   ├─ ConnectivityDevices
   │  └─ Gestión de dispositivos
   ├─ NodeDetails (modal desde CreateProject)
   │  ├─ Información del nodo
   │  ├─ Dispositivos
   │  └─ Fusiones
   ├─ DeviceLinks (stack desde NodeDetails)
   │  ├─ Gestión de enlaces
   │  └─ Asignación de fibras
   ├─ FusionLink (stack desde NodeDetails)
   │  └─ Creación de fusiones
   ├─ NodePath
   │  ├─ Búsqueda de rutas
   │  └─ Análisis de conexiones
   ├─ NodeLinks (modal desde NodeDetails)
   │  └─ Gestión de fusiones del nodo
   ├─ UserProfile
   │  └─ Información de usuario
   ├─ Tools
   │  └─ Herramientas útiles
   └─ Settings
      └─ Configuración de app
```

### Flujos Principales

**1. Crear Proyecto Completo:**
```
DashboardScreen
  → CreateProject (crear proyecto base)
    → [Agregar Nodos]
    → [Crear Fibras]
    → NodeDetails (para cada nodo)
      → DeviceLinks (enlaces de dispositivo)
      → FusionLink (fusiones entre fibras)
      → NodeLinks (ver todas las fusiones)
    → Guardar Proyecto
  → DetallesProyecto (ver resultado)
```

**2. Escanear e Importar:**
```
DashboardScreen
  → ScanQr (escanear QR)
    → Seleccionar proyecto importado
    → ViewOnMap (ver estructura)
```

**3. Buscar Ruta:**
```
DetallesProyecto
  → ViewOnMap
    → Seleccionar UNIT origen y destino
    → NodePath
      → Mostrar ruta y estadísticas
```

---

## 📚 Ejemplos de Estructuras Completas

### Proyecto Típico: Red Residencial

```javascript
{
  id: 1,
  name: "Barrio Centro Fase 1",
  metadata: {
    projectType: { buildType: "residential", jobType: "new_construction" }
  },
  nodes: [
    // MDF (distribuidor principal)
    {
      id: 1,
      label: "MDF",
      typeId: 1,
      metadata: {
        devices: [
          {
            label: "Switch Principal",
            type: "switch",
            ports: [...],
            links: [
              { port: 1, src: { fiberId: 1, bufferId: null, thread: 0 } },
              { port: 2, src: { fiberId: 1, bufferId: null, thread: 1 } }
            ]
          }
        ],
        fusionLinks: []
      }
    },
    // Pedestal distribuidor
    {
      id: 2,
      label: "Pedestal_1",
      typeId: 3,
      metadata: {
        devices: [],
        fusionLinks: [
          {
            hash: "uuid1",
            src: { fiberId: 1, bufferId: null, thread: 0 },
            dst: { fiberId: 2, bufferId: 1, thread: 0 }
          }
        ]
      }
    },
    // Unidad residencial
    {
      id: 3,
      label: "UNIT_1",
      typeId: 4,
      metadata: {
        devices: [
          {
            label: "Access Point Apt 101",
            type: "access_point",
            ports: [...],
            links: [
              { port: 1, src: { fiberId: 100, bufferId: null, thread: 0 } }
            ]
          }
        ],
        fusionLinks: []
      }
    }
  ],
  fibers: [
    { id: 1, label: "48F_1", parentId: null, buffers: [Buffer_1, Buffer_2, Buffer_3] },
    { id: 2, label: "2F_UNIT_1", parentId: null, nodeId: 3 },
    { id: 100, label: "48F_1_Buffer_1", parentId: 1, threads: [0,1,2...11] }
  ]
}
```

---

## 🔐 Consideraciones de Integridad

### Restricciones de Referencia

1. **Nodo → Fibra DROP:** Si elimino UNIT_1, elimino 2F_UNIT_1
2. **Dispositivo → Enlace:** Si elimino dispositivo, elimino sus enlaces
3. **Fibra → Fusión:** No se puede usar fibra eliminada en fusión

### Cascadas Lógicas

```javascript
// Al eliminar nodo:
nodeDeleted(nodeId) {
  deleteDevicesOfNode(nodeId);
  deleteDropFibersOfNode(nodeId);  // Solo DROP
  // NO deletea fibras principales
}

// Al eliminar fibra principal:
fiberDeleted(fiberId) {
  deleteAllBuffersOfFiber(fiberId);
  deleteFusionsUsingFiber(fiberId);
  deleteLinksReferencingFiber(fiberId);
}
```

---

## 🎯 Conclusión

**FibraOpticaApp** es un sistema robusto de gestión de infraestructura con:
- ✅ Múltiples adaptadores de almacenamiento
- ✅ Estructura jerárquica clara (Proyecto → Nodos → Fibras → Enlaces)
- ✅ Validaciones integradas
- ✅ Sincronización automática
- ✅ Funcionalidad offline-first
- ✅ UX intuitiva para técnicos de fibra óptica

Para mayor información, revisar el código específico de cada pantalla o servicio mencionado.

---

**Versión:** 1.2.0  
**Última actualización:** Enero 2026  
**Autor:** Equipo FiberTech Solutions
