// hooks/useFilePicker.js
import { useState } from 'react';
import { Platform, Alert, Linking } from 'react-native';
import {
  launchImageLibrary,
  launchCamera,
} from 'react-native-image-picker';

// Solo importar DocumentPicker en plataformas nativas
let DocumentPicker = null;
if (Platform.OS !== 'web') {
  DocumentPicker = require('@react-native-documents/picker').default;
}

const useFilePicker = () => {
  const [loading, setLoading] = useState(false);

  // Opciones comunes para image picker
  const imagePickerOptions = {
    mediaType: 'mixed',
    quality: 0.8,
    maxWidth: 2048,
    maxHeight: 2048,
    includeBase64: true,
    videoQuality: 'high',
    durationLimit: 60,
  };

  // Seleccionar desde galería
  const pickFromGallery = async () => {
    try {
      setLoading(true);
      const result = await launchImageLibrary(imagePickerOptions);

      if (result.didCancel) {
        return null;
      }

      if (result.errorCode) {
        throw new Error(`Error: ${result.errorCode} - ${result.errorMessage}`);
      }

      if (result.assets && result.assets.length > 0) {
        return processAsset(result.assets[0]);
      }

      return null;
    } catch (error) {
      console.error('Error picking from gallery:', error);
      Alert.alert('Error', 'No se pudo seleccionar el archivo');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Tomar foto o video con cámara
  const takePhotoOrVideo = async (mediaType = 'photo') => {
    try {
      setLoading(true);
      const result = await launchCamera({
        ...imagePickerOptions,
        mediaType: mediaType,
        saveToPhotos: true,
      });

      if (result.didCancel) {
        return null;
      }

      if (result.errorCode) {
        throw new Error(`Error: ${result.errorCode} - ${result.errorMessage}`);
      }

      if (result.assets && result.assets.length > 0) {
        return processAsset(result.assets[0]);
      }

      return null;
    } catch (error) {
      console.error('Error taking photo/video:', error);
      Alert.alert('Error', 'No se pudo capturar el archivo');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Seleccionar documento usando input HTML en web
  const pickDocumentWeb = async () => {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '*/*';
      input.multiple = false;

      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) {
          resolve(null);
          return;
        }

        try {
          // Convertir a base64
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result;
            const fileType = getFileTypeFromMime(file.type);
            
            resolve({
              uri: URL.createObjectURL(file),
              name: file.name,
              type: fileType,
              mimeType: file.type,
              size: file.size,
              data: base64,
              timestamp: new Date().toISOString(),
              file: file, // Guardar referencia al archivo original
            });
          };
          reader.onerror = () => {
            console.error('Error reading file:', reader.error);
            resolve(null);
          };
          reader.readAsDataURL(file);
        } catch (error) {
          console.error('Error processing file:', error);
          resolve(null);
      }
      };

      input.oncancel = () => {
        resolve(null);
      };

      input.click();
    });
  };

  // Seleccionar documento usando react-native-document-picker en móvil
  const pickDocumentNative = async () => {
    if (!DocumentPicker) {
      console.error('DocumentPicker not available on this platform');
      Alert.alert('Error', 'Selector de documentos no disponible');
      return null;
    }

    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
        copyTo: 'cachesDirectory',
      });

      if (result && result.length > 0) {
        const doc = result[0];
        const fileType = getFileTypeFromMime(doc.type);

        return {
          uri: doc.fileCopyUri || doc.uri,
          name: doc.name,
          type: fileType,
          mimeType: doc.type,
          size: doc.size,
          data: doc.fileCopyUri || doc.uri,
          timestamp: new Date().toISOString(),
        };
      }

      return null;
    } catch (error) {
      if (DocumentPicker.isCancel(error)) {
        return null;
      }
      console.error('Error picking document:', error);
      throw error;
    }
  };

  // Función unificada para documentos que detecta la plataforma
  const pickDocument = async () => {
    try {
      setLoading(true);

      if (Platform.OS === 'web') {
        return await pickDocumentWeb();
      } else {
        return await pickDocumentNative();
      }
    } catch (error) {
      console.error('Error picking document:', error);
      if (Platform.OS === 'web') {
        alert('No se pudo seleccionar el documento');
      } else {
      Alert.alert('Error', 'No se pudo seleccionar el documento');
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Procesar asset de imagen/video
  const processAsset = (asset) => {
    const fileType = getFileTypeFromMime(asset.type);
    
    return {
      uri: asset.uri,
      name: asset.fileName || generateFileName(fileType),
      type: fileType,
      mimeType: asset.type,
      size: asset.fileSize || 0,
      data: asset.base64 || asset.uri,
      width: asset.width,
      height: asset.height,
      duration: asset.duration,
      timestamp: new Date().toISOString(),
    };
  };

  // Procesar documento
  const processDocument = (document) => {
    const fileType = 'document';
    
    return {
      uri: document.uri,
      name: document.fileName || 'documento.pdf',
      type: fileType,
      mimeType: document.type || 'application/pdf',
      size: document.fileSize || 0,
      data: document.base64 || document.uri,
      timestamp: new Date().toISOString(),
    };
  };

  // Determinar tipo de archivo desde MIME type
  const getFileTypeFromMime = (mimeType) => {
    if (!mimeType) return 'unknown';
    
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    
    return 'document';
  };

  // Generar nombre de archivo
  const generateFileName = (type) => {
    const timestamp = new Date().getTime();
    const extensions = {
      image: 'jpg',
      video: 'mp4',
      audio: 'mp3',
      document: 'pdf',
      unknown: 'file'
    };
    
    return `${type}_${timestamp}.${extensions[type] || 'file'}`;
  };

  // Función universal que muestra opciones (solo en móvil, en web usar botones directos)
  const showFilePicker = () => {
    if (Platform.OS === 'web') {
      // En web, retornar directamente el picker de documentos
      return pickDocument();
    }

    return new Promise((resolve) => {
      Alert.alert(
        'Seleccionar archivo',
        'Elige una opción',
        [
          {
            text: 'Galería',
            onPress: async () => {
              const file = await pickFromGallery();
              resolve(file);
            },
          },
          {
            text: 'Cámara (Foto)',
            onPress: async () => {
              const file = await takePhotoOrVideo('photo');
              resolve(file);
            },
          },
          {
            text: 'Cámara (Video)',
            onPress: async () => {
              const file = await takePhotoOrVideo('video');
              resolve(file);
            },
          },
          {
            text: 'Documentos',
            onPress: async () => {
              const file = await pickDocument();
              resolve(file);
            },
          },
          {
            text: 'Cancelar',
            style: 'cancel',
            onPress: () => resolve(null),
          },
        ],
        { cancelable: true }
      );
    });
  };

  return {
    loading,
    pickFromGallery,
    takePhotoOrVideo,
    pickDocument,
    showFilePicker,
  };
};

export default useFilePicker;