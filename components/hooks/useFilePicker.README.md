# useFilePicker Hook

Hook personalizado para seleccionar archivos de manera cross-platform (Web, iOS, Android).

## Características

- ✅ **Web**: Usa input HTML nativo para selección de archivos
- ✅ **Mobile (iOS/Android)**: Usa `react-native-image-picker` y `@react-native-documents/picker`
- ✅ **Galería**: Seleccionar imágenes/videos de la galería
- ✅ **Cámara**: Tomar fotos o grabar videos
- ✅ **Documentos**: Seleccionar cualquier tipo de documento
- ✅ **Estado de carga**: Indica cuando está procesando
- ✅ **Conversión automática**: Convierte archivos a base64 (opcional)

## Instalación

Las siguientes dependencias ya están instaladas:
```bash
npm install react-native-image-picker @react-native-documents/picker
```

## Uso Básico

```javascript
import useFilePicker from '@/components/hooks/useFilePicker';

const MyComponent = () => {
  const { loading, pickDocument, pickFromGallery, takePhotoOrVideo, showFilePicker } = useFilePicker();
  
  const handleSelectFile = async () => {
    const file = await pickDocument();
    if (file) {
      console.log('Archivo seleccionado:', file);
      // Hacer algo con el archivo
    }
  };

  return (
    <TouchableOpacity onPress={handleSelectFile} disabled={loading}>
      <Text>{loading ? 'Cargando...' : 'Seleccionar Archivo'}</Text>
    </TouchableOpacity>
  );
};
```

## API

### Funciones Exportadas

#### `pickDocument()`
Selecciona un documento. Automáticamente usa input HTML en web y DocumentPicker en móvil.

```javascript
const file = await pickDocument();
```

#### `pickFromGallery()`
Selecciona una imagen o video de la galería (solo móvil).

```javascript
const media = await pickFromGallery();
```

#### `takePhotoOrVideo(mediaType)`
Toma una foto o graba un video con la cámara (solo móvil).

```javascript
const photo = await takePhotoOrVideo('photo');
const video = await takePhotoOrVideo('video');
```

#### `showFilePicker()`
Muestra un diálogo con todas las opciones disponibles (solo móvil, en web usa `pickDocument`).

```javascript
const file = await showFilePicker();
```

### Propiedades

#### `loading: boolean`
Indica si hay una operación de selección en progreso.

## Estructura del Objeto Retornado

```javascript
{
  uri: string,           // URI del archivo (puede ser usado en Image, Video, etc.)
  name: string,          // Nombre del archivo
  type: string,          // Tipo: 'image', 'video', 'audio', 'document', 'unknown'
  mimeType: string,      // MIME type: 'image/jpeg', 'application/pdf', etc.
  size: number,          // Tamaño en bytes
  data: string,          // Base64 del archivo (en web) o URI (en móvil)
  timestamp: string,     // Timestamp ISO de cuando se seleccionó
  
  // Solo para imágenes
  width?: number,
  height?: number,
  
  // Solo para videos
  duration?: number,
  
  // Solo en web
  file?: File            // Objeto File original del navegador
}
```

## Ejemplos

### Seleccionar y Mostrar una Imagen

```javascript
import { Image } from 'react-native';
import useFilePicker from '@/components/hooks/useFilePicker';

const ImagePicker = () => {
  const [image, setImage] = useState(null);
  const { pickFromGallery, loading } = useFilePicker();

  const selectImage = async () => {
    const file = await pickFromGallery();
    if (file && file.type === 'image') {
      setImage(file);
    }
  };

  return (
    <View>
      <TouchableOpacity onPress={selectImage} disabled={loading}>
        <Text>Seleccionar Imagen</Text>
      </TouchableOpacity>
      
      {image && (
        <Image 
          source={{ uri: image.uri }} 
          style={{ width: 200, height: 200 }} 
        />
      )}
    </View>
  );
};
```

### Subir un Documento al Servidor

```javascript
const DocumentUploader = () => {
  const { pickDocument, loading } = useFilePicker();

  const uploadDocument = async () => {
    const file = await pickDocument();
    if (!file) return;

    const formData = new FormData();
    
    if (Platform.OS === 'web' && file.file) {
      // En web, usar el objeto File directamente
      formData.append('document', file.file);
    } else {
      // En móvil, crear el objeto para FormData
      formData.append('document', {
        uri: file.uri,
        type: file.mimeType,
        name: file.name,
      });
    }

    try {
      const response = await fetch('https://api.example.com/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      const result = await response.json();
      console.log('Documento subido:', result);
    } catch (error) {
      console.error('Error subiendo documento:', error);
    }
  };

  return (
    <TouchableOpacity onPress={uploadDocument} disabled={loading}>
      <Text>{loading ? 'Subiendo...' : 'Subir Documento'}</Text>
    </TouchableOpacity>
  );
};
```

### Menú Completo (Solo Móvil)

```javascript
const FileSelector = () => {
  const { showFilePicker, loading } = useFilePicker();

  const selectFile = async () => {
    const file = await showFilePicker();
    if (file) {
      console.log('Tipo:', file.type);
      console.log('Nombre:', file.name);
      console.log('Tamaño:', file.size);
    }
  };

  return (
    <TouchableOpacity onPress={selectFile} disabled={loading}>
      <Text>Seleccionar Archivo</Text>
    </TouchableOpacity>
  );
};
```

## Diferencias por Plataforma

| Función | Web | iOS/Android |
|---------|-----|-------------|
| `pickDocument()` | Input HTML | DocumentPicker |
| `pickFromGallery()` | ❌ | ✅ |
| `takePhotoOrVideo()` | ❌ | ✅ |
| `showFilePicker()` | Llama a `pickDocument()` | Muestra Alert con opciones |

## Notas

- **Web**: Los archivos se convierten a base64 automáticamente y se incluye el objeto `File` original.
- **Móvil**: Se usa `copyTo: 'cachesDirectory'` para garantizar acceso al archivo.
- **Imágenes**: La calidad se reduce a 0.8 y tamaño máximo de 2048x2048 para optimizar.
- **Videos**: Duración máxima de 60 segundos por defecto.

## Ejemplo Completo

Ver `components/screens/FilePickerExample.js` para un ejemplo completo funcional.
