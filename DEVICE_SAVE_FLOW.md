# 🔄 Flujo Completo: Agregar Dispositivo a Nodo

## 📋 Descripción
Cuando el usuario agrega un nuevo dispositivo a un nodo (MDF, NODE, etc.), el flujo debe:
1. Abrir DeviceDetails
2. Permitir seleccionar tipo de dispositivo (auto-genera puertos)
3. Guardar dispositivo
4. Cerrar DeviceDetails
5. Actualizar lista de dispositivos en NodeDetails
6. Guardar cambios en BD

---

## 🔗 Flujo de Datos (Paso a Paso)

### Paso 1: Usuario presiona "Add Device" en NodeDetails
```
Location: NodeDetails.js line ~468
Function: handleAddDevice()
Action: Navega a DeviceDetails con callback
```

**Logs esperados:**
```
🆕 handleAddDevice: Opening DeviceDetails with new device
```

---

### Paso 2: DeviceDetails recibe deviceData vacío
```
Location: DeviceDetails.js line ~26
Recibe: {
  hash: uuidv4(),
  label: "",
  type: "",
  ports: [],
  ...
}
```

**Logs esperados:**
```
📱 DeviceDetails mounted
📱 deviceData: { hash: "...", label: "", type: "", ... }
```

---

### Paso 3: Usuario selecciona tipo de dispositivo
```
Location: DeviceDetails.js línea ~445
Action: Modal abre, usuario toca "Switch"
```

**Lo que sucede:**
- Modal cierra
- `data.type = "switch"`
- `data.label = "Switch"`
- `data.portsCount = "24"`
- **Puertos auto-generados**: `data.ports = [{ number: 1, enabled: true }, ..., { number: 24, enabled: true }]`

**Logs esperados:**
```
✅ Device type selected: Switch
📊 Ports auto-generated: 24 ports
```

---

### Paso 4: Usuario ingresa datos adicionales y presiona Save
```
Location: DeviceDetails.js line ~364
Function: handleSave()
```

**El callback chain:**

```
handleSave()
  ↓
  if (route.params?.onSaveDevice) {
    route.params.onSaveDevice(data)  ← ✅ AQUÍ se llama el callback
  }
  ↓
  navigation.goBack()
```

**Logs esperados:**
```
💾 DeviceDetails.handleSave triggered
📦 Device data to save: { hash: "...", label: "Switch", type: "switch", portsCount: "24", ports: 24 }
🎯 Calling onSaveDevice callback...
✅ onSaveDevice callback executed
```

---

### Paso 5: Callback ejecuta en NodeDetails
```
Location: NodeDetails.js line ~480
Function: onSaveDevice callback
```

**El callback:**
```javascript
onSaveDevice: (data) => {
  console.log('🎯 onSaveDevice callback triggered in NodeDetails');
  console.log('📦 Device data received:', { ... });
  
  const newDevices = [...devicesData, data];
  setDevicesData(newDevices);
  
  console.log('✅ New device added to devicesData');
  console.log('📊 Total devices now:', newDevices.length);
  console.log('📋 Devices list:', newDevices.map(d => ({ label: d.label, type: d.type })));
}
```

**Logs esperados:**
```
🎯 onSaveDevice callback triggered in NodeDetails
📦 Device data received: { hash: "...", label: "Switch", type: "switch", ... }
✅ New device added to devicesData
📊 Total devices now: 2  (si había 1 dispositivo antes)
📋 Devices list: [{ label: "MDF", type: "switch" }, { label: "Switch", type: "switch" }]
```

---

### Paso 6: useFocusEffect detecta cambio en devicesData y guarda en BD
```
Location: NodeDetails.js line ~78 (React.useEffect)
Trigger: devicesData cambió
Debounce: 800ms
```

**El auto-save:**
```javascript
React.useEffect(() => {
  // ... timeout code ...
  const newTimeout = setTimeout(async () => {
    if (nodeData.id != undefined) {
      const meta = {
        devices: devicesData,  ← ✅ AQUÍ está el nuevo dispositivo
        fusionLinks: nodeData.fusionLinks || [],
      };
      
      await updateNode(nodeData.id, {
        label: nodeData.label,
        typeId: nodeData.typeId,
        description: nodeData.description || '',
        metadata: JSON.stringify(meta),
      });
    }
  }, 800); // Espera 800ms sin cambios
}, [devicesData, nodeData]);
```

**Logs esperados:**
```
💾 Auto-saving node with 2 devices to BD
✅ Node auto-saved successfully: true
```

---

### Paso 7: DeviceDetails cierra y vuelve a NodeDetails
```
Location: DeviceDetails.js line ~371
Action: navigation.goBack()
```

**NodeDetails ahora:**
- Tiene `devicesData` actualizado con nuevo dispositivo
- El BD también tiene guardados los cambios
- useFocusEffect podría recargar desde BD para confirmar

**Logs esperados:**
```
🔄 Reloading node from BD: MDF
✅ Node reloaded: MDF, Devices: 2
```

---

## 🐛 Troubleshooting: Qué Buscar en Logs

### ❌ Si el dispositivo NO aparece:

1. **Buscar este log:**
   ```
   🎯 onSaveDevice callback triggered in NodeDetails
   ```
   - ✅ Si aparece: callback se ejecutó, problema está en la lista de UI
   - ❌ Si NO aparece: callback NO se ejecutó, problema está en DeviceDetails

2. **Si callback NO se ejecutó, buscar:**
   ```
   🎯 Calling onSaveDevice callback...
   ```
   - ✅ Si aparece: route.params?.onSaveDevice existe
   - ❌ Si NO aparece: Callback no se pasó correctamente desde NodeDetails

3. **Si callback se pasó pero no aparece en UI, buscar:**
   ```
   ✅ New device added to devicesData
   📊 Total devices now: X
   ```
   - ✅ Si aparece: Callback ejecutó, pero UI no se actualiza
   - ❌ Si NO aparece: Código del callback no ejecutó

4. **Si se guardó en devicesData pero no en BD, buscar:**
   ```
   💾 Auto-saving node with X devices to BD
   ✅ Node auto-saved successfully: true
   ```
   - ✅ Si aparece: BD se guardó
   - ❌ Si NO aparece: Auto-save no se ejecutó

---

## 🔐 Checklist Completo

- [ ] User presiona "Add Device" → Buscar log `🆕 handleAddDevice`
- [ ] DeviceDetails monta → Buscar log `📱 DeviceDetails mounted`
- [ ] User selecciona tipo → Buscar logs de ports auto-generated
- [ ] User presiona Save → Buscar log `💾 DeviceDetails.handleSave triggered`
- [ ] Callback ejecuta → Buscar log `🎯 onSaveDevice callback triggered in NodeDetails`
- [ ] Estado actualiza → Buscar log `✅ New device added to devicesData`
- [ ] BD guarda → Buscar log `💾 Auto-saving node with X devices to BD`
- [ ] Dispositivo visible en lista → Inspeccionar FlatList en NodeDetails

---

## 📱 UI Locations

**NodeDetails (MDF View):**
- Button "Add Device" → línea ~490
- FlatList de dispositivos → línea ~570
- Cada item de dispositivo → renderiza con `renderDevice()`

**DeviceDetails:**
- Modal de tipo → línea ~420
- Input de label → línea ~485
- Button Save → línea ~372

---

## 🔄 Resumen Visual

```
NodeDetails (MDF)
     ↓
[+ Add Device] button
     ↓
handleAddDevice() - ✅ AQUÍ se pasa el callback onSaveDevice
     ↓
Navega a DeviceDetails
     ↓
DeviceDetails monta con deviceData vacío
     ↓
User selecciona "Switch" - Puertos auto-generados
     ↓
User presiona [Save]
     ↓
handleSave() llama route.params?.onSaveDevice(data) - ✅ SE EJECUTA EL CALLBACK
     ↓
Callback: setDevicesData([...devicesData, data])
     ↓
React.useEffect detecta cambio en devicesData
     ↓
Auto-save: updateNode() guarda en BD después de 800ms
     ↓
navigation.goBack() vuelve a NodeDetails
     ↓
useFocusEffect recarga desde BD para confirmar
     ↓
Dispositivo aparece en la lista de NodeDetails ✅
```

---

## 📝 Notas

1. **Debounce de 800ms**: Si el usuario agrega múltiples dispositivos rápidamente, solo guarda cuando deja de hacer cambios por 800ms
2. **Callback local en DeviceDetails**: Los datos pasan por referencia, no hay serialización
3. **BD auto-guarda**: No necesita presionar "Save" en NodeDetails, se guarda automáticamente vía useEffect
4. **useFocusEffect reload**: Opcional, pero ayuda a confirmar que todo se guardó correctamente

