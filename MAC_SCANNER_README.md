# 📱 Escáner de Direcciones MAC

## 🎯 Funcionalidad Implementada

Se ha implementado un escáner completo de códigos de barras y QR con capacidad de extraer direcciones MAC automáticamente.

## ✨ Características

### 1. **Escaneo en Tiempo Real**
- Usa la cámara del dispositivo para escanear códigos QR y códigos de barras
- Soporta múltiples formatos: QR, Code128, Code39, Code93, EAN13, EAN8, UPC-A, UPC-E, DataMatrix

### 2. **Selección desde Galería**
- Permite seleccionar imágenes desde la galería del dispositivo
- Útil cuando ya tienes una foto del código

### 3. **Entrada Manual**
- Opción de ingresar la dirección MAC manualmente
- Validación automática del formato

### 4. **Extracción Inteligente de MAC**
El sistema detecta automáticamente direcciones MAC en varios formatos:
- Formato estándar: `00:11:22:33:44:55`
- Sin separadores: `001122334455`
- Con guiones: `00-11-22-33-44-55`
- Con puntos: `0011.2233.4455`
- Con espacios: `00 11 22 33 44 55`

Todos los formatos se normalizan automáticamente a `XX:XX:XX:XX:XX:XX`

## 🚀 Cómo Usar

1. **Abrir Detalles del Dispositivo**
   - Navega a la pantalla de detalles de cualquier dispositivo

2. **Iniciar Escaneo**
   - En el campo "Dirección MAC", presiona el botón con el ícono de código de barras 📊
   - Se abrirá la pantalla del escáner

3. **Opciones de Escaneo**
   - **Cámara**: Apunta la cámara hacia el código de barras/QR
   - **Galería**: Selecciona una imagen de tu galería
   - **Manual**: Ingresa la MAC manualmente

4. **Confirmación**
   - El sistema detectará automáticamente la dirección MAC
   - Confirma para auto-completar el campo

## 📝 Archivos Modificados/Creados

### Nuevos Archivos:
- `components/screens/MacAddressScanner.js` - Componente principal del escáner

### Archivos Modificados:
- `components/screens/DeviceDetails.js` - Agregado botón de escaneo
- `components/navigation/AppNavigator.js` - Agregada ruta del escáner
- `components/context/AppContext.js` - Agregadas traducciones en inglés y español

## 🌐 Traducciones Disponibles

Todas las etiquetas están disponibles en **inglés** y **español**:
- Mensajes de error
- Instrucciones de uso
- Confirmaciones
- Botones y acciones

## 🔧 Dependencias Utilizadas

- `expo-camera` - Para acceso a la cámara
- `expo-barcode-scanner` - Para escaneo de códigos
- `expo-image-picker` - Para selección de galería
- `@expo/vector-icons` - Para iconos de interfaz

## 💡 Notas Técnicas

### Permisos Requeridos
- **Cámara**: Solicitado automáticamente al abrir el escáner
- **Galería**: Solicitado al seleccionar imagen de galería

### Validación de MAC
El sistema valida que la dirección MAC tenga:
- Exactamente 12 caracteres hexadecimales
- Formato correcto después de normalización
- Caracteres válidos (0-9, A-F)

### Compatibilidad
- ✅ iOS
- ✅ Android
- ⚠️ Web (funcionalidad limitada - sin cámara)

## 🐛 Solución de Problemas

### "No se detectó MAC"
- Asegúrate de que el código contenga una dirección MAC válida
- Verifica que el código sea legible
- Intenta con mejor iluminación
- Usa la opción de entrada manual

### "No hay acceso a la cámara"
- Verifica los permisos de la app en configuración del dispositivo
- Reinicia la aplicación
- En Android, revisa que no haya otras apps usando la cámara

### Errores de Formato
- Formatos aceptados: `XX:XX:XX:XX:XX:XX`, `XX-XX-XX-XX-XX-XX`, `XXXXXXXXXXXX`
- Debe contener exactamente 12 caracteres hexadecimales

## 🎨 Interfaz de Usuario

### Diseño Homogéneo con ScanQR
El escáner de MAC mantiene el mismo estilo visual que el escáner QR existente:

- **Fondo Negro**: Consistente con la interfaz de ScanQR
- **Marco de Escaneo**: Indicador visual con esquinas azules (#3498db) para alinear el código
- **Header Superior**: Con botón de retroceso y título centralizado
- **Botones de Acción**: 
  - Galería (morado #9b59b6)
  - Manual (naranja #e67e22)
  - Posicionados en la parte inferior
- **Modal de Confirmación**: Diseño limpio con fondo adaptable a modo oscuro/claro
- **Vista de Entrada Manual**: Pantalla completa con fondo negro, input centralizado
- **Feedback Visual**: Indicadores de procesamiento, overlays semitransparentes
- **Tema Adaptable**: Compatible con modo claro/oscuro

## 📱 Flujo de Usuario

```
DeviceDetails
    ↓ (Click en botón de escaneo)
MacAddressScanner
    ↓ (Opciones)
    ├─→ Escaneo con Cámara
    ├─→ Selección desde Galería
    └─→ Entrada Manual
        ↓ (MAC detectada/ingresada)
    Confirmación
        ↓
DeviceDetails (MAC auto-completada)
```

## 🔮 Mejoras Futuras Posibles

- [ ] OCR para extracción desde imágenes de galería
- [ ] Historial de MACs escaneadas
- [ ] Detección de fabricante por prefijo MAC
- [ ] Escaneo múltiple (batch scanning)
- [ ] Exportar/Importar lista de MACs

---

**Desarrollado para FiberTech Manager**
*Versión 1.0 - Noviembre 2025*
