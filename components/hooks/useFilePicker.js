// hooks/useFilePicker.js
import { useState } from 'react';
import { Platform, Alert, Linking } from 'react-native';
import {
  launchImageLibrary,
  launchCamera,
} from 'react-native-image-picker';

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

  // Función simplificada para documentos usando image picker
  const pickDocument = async () => {
    try {
      setLoading(true);
      const result = await launchImageLibrary({
        mediaType: 'mixed',
        includeBase64: true,
      });

      if (result.didCancel) {
        return null;
      }

      if (result.errorCode) {
        throw new Error(`Error: ${result.errorCode} - ${result.errorMessage}`);
      }

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        // Si es un documento (no imagen/video), procesar como documento
        if (!asset.type?.startsWith('image/') && !asset.type?.startsWith('video/')) {
          return processDocument(asset);
        }
        return processAsset(asset);
      }

      return null;
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'No se pudo seleccionar el documento');
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

  // Función universal que muestra opciones
  const showFilePicker = () => {
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