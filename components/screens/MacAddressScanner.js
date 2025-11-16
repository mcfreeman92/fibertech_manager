import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
  ActivityIndicator,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from '../hooks/useTranslation';
import { useApp } from '../context/AppContext';
import { useDevice } from '../context/DeviceContext';

const MacAddressScanner = ({ navigation, route }) => {
  const { topInset, bottomInset } = useDevice();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [cameraVisible, setCameraVisible] = useState(true);
  const [loadingImage, setLoadingImage] = useState(false);
  const [scannedMacAddress, setScannedMacAddress] = useState(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [scannedContent, setScannedContent] = useState('');

  // Añadir useRef para controlar el escaneo
  const scanInProgress = useRef(false);

  const { t } = useTranslation();
  const { isDarkMode } = useApp();

  // Callback function passed from parent component
  const onMacAddressScanned = route.params?.onMacAddressScanned;

  useEffect(() => {
    requestGalleryPermission();
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    if (!permission?.granted) {
      await requestPermission();
    }
  };

  const requestGalleryPermission = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('permissionRequired') || 'Permiso requerido',
          t('galleryPermissionMessage') || 'Se necesita permiso para acceder a la galería'
        );
      }
    }
  };

  // Function to extract MAC address from text using multiple patterns
  const extractMacAddress = (text) => {
    // Common MAC address patterns
    const macPatterns = [
      // Standard format: 00:11:22:33:44:55
      /([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})/g,
      // No separators: 001122334455
      /\b([0-9A-Fa-f]{12})\b/g,
      // Dot separated: 0011.2233.4455
      /\b([0-9A-Fa-f]{4}\.){2}[0-9A-Fa-f]{4}\b/g,
      // Space separated: 00 11 22 33 44 55
      /\b([0-9A-Fa-f]{2}\s){5}[0-9A-Fa-f]{2}\b/g
    ];

    let foundMacs = [];

    macPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          // Normalize MAC address to standard format (00:11:22:33:44:55)
          let normalizedMac = match.replace(/[-.\s]/g, ':');
          
          // If it's 12 characters without separators, add colons
          if (normalizedMac.length === 12 && !normalizedMac.includes(':')) {
            normalizedMac = normalizedMac.match(/.{1,2}/g).join(':');
          }
          
          // If it's dot separated, convert to colon separated
          if (match.includes('.')) {
            const cleanMac = match.replace(/\./g, '');
            normalizedMac = cleanMac.match(/.{1,2}/g).join(':');
          }

          // Validate MAC address format and add to found list
          if (/^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/.test(normalizedMac)) {
            foundMacs.push(normalizedMac.toUpperCase());
          }
        });
      }
    });

    // Remove duplicates and return the first valid MAC address
    const uniqueMacs = [...new Set(foundMacs)];
    return uniqueMacs.length > 0 ? uniqueMacs[0] : null;
  };

  // Function to process scanned content
  const processScannedData = async (data) => {
    // Prevent multiple processing
    if (scanInProgress.current) return;
    
    try {
      scanInProgress.current = true;
      setScannedContent(data);
      
      // Extract MAC address from the scanned content
      const macAddress = extractMacAddress(data);
      
      if (macAddress) {
        setScannedMacAddress(macAddress);
        setShowResultsModal(true);
      } else {
        // Show the content and let user manually identify MAC address
        Alert.alert(
          t('noMacAddressFound') || 'Dirección MAC no encontrada',
          t('noMacAddressFoundMessage') || 'No se detectó una dirección MAC válida en el contenido escaneado. ¿Deseas ver el contenido completo?',
          [
            {
              text: t('viewContent') || 'Ver contenido',
              onPress: () => {
                setShowResultsModal(true);
              }
            },
            {
              text: t('tryAgain') || 'Intentar otra vez',
              onPress: () => resetScanner(),
              style: 'cancel'
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error processing scanned data:', error);
      Alert.alert(
        t('error') || 'Error',
        t('errorProcessingData') || 'Error al procesar los datos escaneados'
      );
      resetScanner();
    } finally {
      setTimeout(() => {
        scanInProgress.current = false;
      }, 1000);
    }
  };

  // Handle barcode scanned
  const handleBarCodeScanned = ({ type, data }) => {
    // Prevent multiple scans
    if (scanned || scanInProgress.current) return;
    
    console.log('Código escaneado, procesando...', data);
    
    setScanned(true);
    setCameraVisible(false);
    scanInProgress.current = true;
    
    // Process after a small delay to ensure state updates
    setTimeout(() => {
      processScannedData(data);
    }, 100);
  };

  // Pick image from gallery
  const pickImageFromGallery = async () => {
    try {
      setLoadingImage(true);
      
      const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        await requestGalleryPermission();
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        await processImageForCode(imageUri);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert(
        t('error') || 'Error',
        t('errorSelectingImage') || 'Error al seleccionar la imagen'
      );
    } finally {
      setLoadingImage(false);
    }
  };

  // Process image for QR/barcode
  const processImageForCode = async (imageUri) => {
    try {
      setLoadingImage(true);
      const codeData = await scanCodeWithFormData(imageUri);
      
      if (codeData) {
        setScanned(true);
        setCameraVisible(false);
        processScannedData(codeData);
      } else {
        Alert.alert(
          t('noCodeFound') || 'Código no encontrado',
          t('noCodeFoundMessage') || 'No se detectó código QR o de barras en la imagen',
          [
            {
              text: t('tryAgain') || 'Intentar otra vez',
              onPress: pickImageFromGallery
            },
            {
              text: t('cancel') || 'Cancelar',
              style: 'cancel'
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error processing image for code:', error);
      Alert.alert(
        t('error') || 'Error',
        t('errorProcessingImage') || 'Error al procesar la imagen'
      );
    } finally {
      setLoadingImage(false);
    }
  };

  // Scan code using external API
  const scanCodeWithFormData = async (imageUri) => {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'code.jpg',
      });

      const response = await fetch('https://api.qrserver.com/v1/read-qr-code/', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = await response.json();
      
      if (data && data[0] && data[0].symbol[0] && data[0].symbol[0].data) {
        return data[0].symbol[0].data;
      }
      return null;
    } catch (error) {
      console.error('Error scanning code:', error);
      return null;
    }
  };

  // Reset scanner
  const resetScanner = () => {
    console.log('Resetting scanner...');
    setScanned(false);
    setCameraVisible(true);
    setScannedMacAddress(null);
    setShowResultsModal(false);
    setScannedContent('');
    scanInProgress.current = false;
  };

  // Use scanned MAC address
  const useMacAddress = () => {
    if (scannedMacAddress && onMacAddressScanned) {
      onMacAddressScanned(scannedMacAddress);
      navigation.goBack();
    }
  };

  // Manual MAC input
  const manualMacInput = () => {
    Alert.prompt(
      t('manualMacInput') || 'Entrada manual de MAC',
      t('enterMacAddressManually') || 'Ingresa la dirección MAC:',
      [
        {
          text: t('cancel') || 'Cancelar',
          style: 'cancel',
        },
        {
          text: t('use') || 'Usar',
          onPress: (macAddress) => {
            if (macAddress && macAddress.trim()) {
              const normalizedMac = extractMacAddress(macAddress.trim());
              if (normalizedMac) {
                setScannedMacAddress(normalizedMac);
                setShowResultsModal(true);
              } else {
                Alert.alert(
                  t('invalidMac') || 'MAC inválida',
                  t('invalidMacMessage') || 'La dirección MAC ingresada no es válida'
                );
              }
            }
          },
        },
      ],
      'plain-text',
      ''
    );
  };

  const colors = {
    primary: '#3498db',
    success: '#2ecc71',
    warning: '#f39c12',
    danger: '#e74c3c',
    purple: '#9b59b6',
    background: isDarkMode ? '#121212' : '#ffffff',
    card: isDarkMode ? '#1e1e1e' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#2c3e50',
    subText: isDarkMode ? '#b0b0b0' : '#7f8c8d',
    border: isDarkMode ? '#333' : '#ecf0f1',
  };

  const renderGalleryButton = () => (
    <TouchableOpacity 
      style={[styles.controlButton, { backgroundColor: colors.purple }]}
      onPress={pickImageFromGallery}
      disabled={loadingImage}
    >
      {loadingImage ? (
        <ActivityIndicator size="small" color="#ffffff" />
      ) : (
        <>
          <Ionicons name="image-outline" size={20} color="#ffffff" />
          <Text style={styles.controlButtonText}>
            {t('fromGallery') || 'Desde Galería'}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );

  const renderResultsModal = () => (
    <Modal
      visible={showResultsModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowResultsModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {scannedMacAddress ? 
                (t('macAddressFound') || 'Dirección MAC Encontrada') :
                (t('scannedContent') || 'Contenido Escaneado')
              }
            </Text>
            <TouchableOpacity onPress={() => setShowResultsModal(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.resultsScroll}>
            <View style={styles.detailsContainer}>
              {scannedMacAddress ? (
                <View>
                  <View style={styles.macAddressContainer}>
                    <Ionicons name="wifi" size={32} color={colors.success} />
                    <Text style={[styles.macAddressText, { color: colors.text }]}>
                      {scannedMacAddress}
                    </Text>
                  </View>
                  
                  <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: colors.success }]}
                    onPress={useMacAddress}
                  >
                    <Ionicons name="checkmark-outline" size={18} color="#ffffff" />
                    <Text style={styles.actionButtonText}>
                      {t('useMacAddress') || 'Usar esta dirección MAC'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  <Text style={[styles.contentTitle, { color: colors.text }]}>
                    {t('scannedContent') || 'Contenido escaneado:'}
                  </Text>
                  
                  <View style={[styles.dataContainer, { backgroundColor: colors.border }]}>
                    <Text style={[styles.dataText, { color: colors.text }]}>
                      {scannedContent || 'No hay datos'}
                    </Text>
                  </View>
                  
                  <Text style={[styles.infoText, { color: colors.subText }]}>
                    {t('noMacDetected') || 'No se detectó una dirección MAC válida. Puedes ingresar una manualmente.'}
                  </Text>
                  
                  <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: colors.primary }]}
                    onPress={manualMacInput}
                  >
                    <Ionicons name="create-outline" size={18} color="#ffffff" />
                    <Text style={styles.actionButtonText}>
                      {t('enterManually') || 'Ingresar manualmente'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>

          <TouchableOpacity 
            style={[styles.modalCloseButton, { backgroundColor: colors.border }]}
            onPress={() => {
              setShowResultsModal(false);
              resetScanner();
            }}
          >
            <Text style={[styles.modalCloseButtonText, { color: colors.text }]}>
              {t('scanAnother') || 'Escanear otro'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // If no camera permission
  if (permission && !permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topInset + 10, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {t('scanMacAddress') || 'Escanear MAC'}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color={colors.subText} />
          <Text style={[styles.permissionTitle, { color: colors.text }]}>
            {t('cameraPermissionRequired') || 'Permiso de cámara requerido'}
          </Text>
          <Text style={[styles.permissionText, { color: colors.subText }]}>
            {t('cameraPermissionMessage') || 'Se necesita acceso a la cámara para escanear códigos de barras y QR'}
          </Text>
          <TouchableOpacity 
            style={[styles.permissionButton, { backgroundColor: colors.primary }]}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>
              {t('grantPermission') || 'Conceder permiso'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.alternativeButton, { backgroundColor: colors.purple }]}
            onPress={pickImageFromGallery}
          >
            <Ionicons name="image-outline" size={20} color="#ffffff" />
            <Text style={styles.alternativeButtonText}>
              {t('useGallery') || 'Usar galería en su lugar'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: bottomInset, backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 10, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t('scanMacAddress') || 'Escanear MAC'}
        </Text>
        <TouchableOpacity onPress={manualMacInput}>
          <Ionicons name="create-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {loadingImage && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            {t('processingImage') || 'Procesando imagen...'}
          </Text>
        </View>
      )}

      {cameraVisible && (
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={scanned || scanInProgress.current ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr', 'pdf417', 'codabar', 'code128', 'code39', 'code93', 'datamatrix', 'ean13', 'ean8', 'itf14', 'upc_a', 'upc_e']
            }}
          />
          <View style={styles.overlay}>
            <View style={styles.scanFrame}>
              <View style={[styles.cornerTopLeft, { borderColor: colors.primary }]} />
              <View style={[styles.cornerTopRight, { borderColor: colors.primary }]} />
              <View style={[styles.cornerBottomLeft, { borderColor: colors.primary }]} />
              <View style={[styles.cornerBottomRight, { borderColor: colors.primary }]} />
            </View>
            
            <Text style={styles.scanText}>
              {t('alignCodeInFrame') || 'Alinea el código en el marco'}
            </Text>
            <Text style={styles.scanSubText}>
              {t('macScanInstruction') || 'Escanea códigos QR o de barras que contengan direcciones MAC'}
            </Text>
            
            <View style={styles.controls}>
              {renderGalleryButton()}
              
              <TouchableOpacity 
                style={[styles.controlButton, { backgroundColor: colors.warning }]}
                onPress={manualMacInput}
              >
                <Ionicons name="create-outline" size={20} color="#ffffff" />
                <Text style={styles.controlButtonText}>
                  {t('manualInput') || 'Entrada Manual'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {scanned && !cameraVisible && !showResultsModal && (
        <View style={[styles.resultsContainer, { backgroundColor: colors.background }]}>
          <Ionicons name="checkmark-circle" size={64} color={colors.success} />
          <Text style={[styles.resultsTitle, { color: colors.text }]}>
            {t('scanSuccessful') || 'Escaneo exitoso'}
          </Text>
          <Text style={[styles.resultsText, { color: colors.subText }]}>
            {t('codeProcessed') || 'Código procesado'}
          </Text>
          
          <TouchableOpacity 
            style={[styles.scanAgainButton, { backgroundColor: colors.primary }]}
            onPress={resetScanner}
          >
            <Ionicons name="scan-outline" size={20} color="#ffffff" />
            <Text style={styles.scanAgainButtonText}>
              {t('scanAnotherCode') || 'Escanear otro'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {renderResultsModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    padding: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  permissionButton: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  permissionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  alternativeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  alternativeButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  scanFrame: {
    width: 280, 
    height: 280, 
    borderWidth: 2, 
    borderColor: '#fff', 
    borderRadius: 12,
    position: 'relative',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#3498db',
    borderRadius: 2,
  },
  cornerTopRight: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: '#3498db',
    borderRadius: 2,
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    width: 30,
    height: 30,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#3498db',
    borderRadius: 2,
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 30,
    height: 30,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: '#3498db',
    borderRadius: 2,
  },
  scanText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 30,
    textAlign: 'center',
  },
  scanSubText: {
    color: '#bdc3c7',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  controls: {
    position: 'absolute',
    bottom: 60,
    alignItems: 'center',
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 15,
  },
  controlButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 14,
  },
  resultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  resultsTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  resultsText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  scanAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 8,
  },
  scanAgainButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  resultsScroll: {
    maxHeight: 400,
  },
  detailsContainer: {
    alignItems: 'center',
  },
  macAddressContainer: {
    alignItems: 'center',
    padding: 20,
    marginBottom: 20,
  },
  macAddressText: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 10,
    fontFamily: 'monospace',
    letterSpacing: 2,
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
  },
  dataContainer: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    width: '100%',
  },
  dataText: {
    fontSize: 14,
    lineHeight: 20,
  },
  infoText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
    width: '100%',
  },
  actionButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
  },
  modalCloseButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  modalCloseButtonText: {
    fontWeight: '600',
    fontSize: 16,
  },
});

export default MacAddressScanner;