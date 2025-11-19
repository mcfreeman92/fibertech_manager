import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Platform,
} from 'react-native';
import useFilePicker from '@/components/hooks/useFilePicker';

const FilePickerExample = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const { loading, pickFromGallery, takePhotoOrVideo, pickDocument, showFilePicker } = useFilePicker();

  const handlePickGallery = async () => {
    const file = await pickFromGallery();
    if (file) {
      setSelectedFile(file);
      console.log('File selected from gallery:', file);
    }
  };

  const handleTakePhoto = async () => {
    const file = await takePhotoOrVideo('photo');
    if (file) {
      setSelectedFile(file);
      console.log('Photo taken:', file);
    }
  };

  const handlePickDocument = async () => {
    const file = await pickDocument();
    if (file) {
      setSelectedFile(file);
      console.log('Document selected:', file);
    }
  };

  const handleShowPicker = async () => {
    const file = await showFilePicker();
    if (file) {
      setSelectedFile(file);
      console.log('File selected:', file);
    }
  };

  const renderFilePreview = () => {
    if (!selectedFile) {
      return (
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>No hay archivo seleccionado</Text>
        </View>
      );
    }

    if (selectedFile.type === 'image') {
      return (
        <Image
          source={{ uri: selectedFile.uri }}
          style={styles.imagePreview}
          resizeMode="contain"
        />
      );
    }

    return (
      <View style={styles.fileInfoContainer}>
        <Text style={styles.fileInfoLabel}>Tipo:</Text>
        <Text style={styles.fileInfoValue}>{selectedFile.type}</Text>
        
        <Text style={styles.fileInfoLabel}>Nombre:</Text>
        <Text style={styles.fileInfoValue}>{selectedFile.name}</Text>
        
        <Text style={styles.fileInfoLabel}>MIME Type:</Text>
        <Text style={styles.fileInfoValue}>{selectedFile.mimeType}</Text>
        
        <Text style={styles.fileInfoLabel}>Tamaño:</Text>
        <Text style={styles.fileInfoValue}>{(selectedFile.size / 1024).toFixed(2)} KB</Text>
        
        <Text style={styles.fileInfoLabel}>URI:</Text>
        <Text style={styles.fileInfoValue} numberOfLines={2}>{selectedFile.uri}</Text>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>File Picker Test</Text>
      <Text style={styles.subtitle}>
        Platform: {Platform.OS} {Platform.OS === 'web' ? '(usando input HTML)' : '(usando native picker)'}
      </Text>

      <View style={styles.previewContainer}>
        {renderFilePreview()}
      </View>

      <View style={styles.buttonsContainer}>
        {Platform.OS !== 'web' && (
          <>
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handlePickGallery}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Cargando...' : '📷 Galería'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleTakePhoto}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Cargando...' : '📸 Tomar Foto'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary, loading && styles.buttonDisabled]}
              onPress={handleShowPicker}
              disabled={loading}
            >
              <Text style={[styles.buttonText, styles.buttonTextPrimary]}>
                {loading ? 'Cargando...' : '🎯 Mostrar Todas las Opciones'}
              </Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary, loading && styles.buttonDisabled]}
          onPress={handlePickDocument}
          disabled={loading}
        >
          <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
            {loading ? 'Cargando...' : '📄 Seleccionar Documento'}
          </Text>
        </TouchableOpacity>

        {selectedFile && (
          <TouchableOpacity
            style={[styles.button, styles.buttonDanger]}
            onPress={() => setSelectedFile(null)}
          >
            <Text style={[styles.buttonText, styles.buttonTextDanger]}>
              🗑️ Limpiar
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  previewContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    minHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 268,
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
  },
  imagePreview: {
    width: '100%',
    height: 300,
    borderRadius: 8,
  },
  fileInfoContainer: {
    padding: 8,
  },
  fileInfoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
    marginBottom: 4,
  },
  fileInfoValue: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  buttonsContainer: {
    gap: 12,
  },
  button: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonPrimary: {
    backgroundColor: '#007AFF',
  },
  buttonSecondary: {
    backgroundColor: '#34C759',
  },
  buttonDanger: {
    backgroundColor: '#FF3B30',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  buttonTextPrimary: {
    color: '#fff',
  },
  buttonTextSecondary: {
    color: '#fff',
  },
  buttonTextDanger: {
    color: '#fff',
  },
});

export default FilePickerExample;
