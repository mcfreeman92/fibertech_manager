// hooks/useFilePicker.js
import { useState } from 'react';
import { Platform, Alert } from 'react-native';
import {
  launchImageLibrary,
  launchCamera,
} from 'react-native-image-picker';
import DocumentPicker from 'react-native-document-picker';

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
    durationLimit: 60, // Para videos (segundos)
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

  // Seleccionar documentos
  const pickDocument = async () => {
    try {
      setLoading(true);
      const result = await DocumentPicker.pick({
        type: [
          DocumentPicker.types.pdf,
          DocumentPicker.types.doc,
          DocumentPicker.types.docx,
          DocumentPicker.types.xls,
          DocumentPicker.types.xlsx,
          DocumentPicker.types.ppt,
          DocumentPicker.types.pptx,
          DocumentPicker.types.plainText,
        ],
        allowMultiSelection: false,
      });

      if (result && result.length > 0) {
        return processDocument(result[0]);
      }

      return null;
    } catch (error) {
      if (DocumentPicker.isCancel(error)) {
        // Usuario canceló
        return null;
      }
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
    const fileType = getFileTypeFromMime(document.type);
    
    return {
      uri: document.uri,
      name: document.name,
      type: fileType,
      mimeType: document.type,
      size: document.size || 0,
      data: document.uri, // Para documentos, guardamos la URI
      timestamp: new Date().toISOString(),
    };
  };

  // Determinar tipo de archivo desde MIME type
  const getFileTypeFromMime = (mimeType) => {
    if (!mimeType) return 'unknown';
    
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    
    // Documentos
    const documentMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
    ];
    
    if (documentMimes.includes(mimeType)) return 'document';
    
    return 'unknown';
  };

  // Generar nombre de archivo
  const generateFileName = (type) => {
    const timestamp = new Date().getTime();
    const extensions = {
      image: 'jpg',
      video: 'mp4',
      audio: 'mp3',
      document: 'file',
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