// components/QRGeneratorModal.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
  Platform,
  PermissionsAndroid
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../hooks/useTranslation';
import { exportProjectData } from '../../service/storage';

const QRGeneratorModal = ({ visible, onClose, project }) => {
  const { isDarkMode } = useApp();
  const { t } = useTranslation();
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const qrRef = useRef();

  const colors = {
    background: isDarkMode ? '#121212' : '#ffffff',
    card: isDarkMode ? '#1e1e1e' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#2c3e50',
    subText: isDarkMode ? '#b0b0b0' : '#7f8c8d',
    border: isDarkMode ? '#333' : '#ecf0f1',
  };

  useEffect(() => {
    if (visible && project) {
      generateQRCode();
    } else {
      setQrData(null);
    }
  }, [visible, project]);

  const generateQRCode = async () => {
    try {
      setLoading(true);
      console.log('📱 Generating QR for project:', project);
      
      if (!project || !project.id) {
        throw new Error('Project ID is missing');
      }
      
      const data = await exportProjectData(project.id);
      console.log('✅ QR data generated:', data);
      setQrData(data);
    } catch (error) {
      console.error('❌ Error generating QR code:', error);
      Alert.alert(t('error'), t('couldNotGenerateQR'));
    } finally {
      setLoading(false);
    }
  };

  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: t('storagePermissionTitle'),
            message: t('storagePermissionMessage'),
            buttonNeutral: t('askMeLater'),
            buttonNegative: t('cancel'),
            buttonPositive: t('ok'),
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const captureQRCode = async () => {
    try {
      if (!qrRef.current) {
        throw new Error('QR reference not found');
      }

      // Use file URI instead of data URI to avoid extension issues
      const uri = await captureRef(qrRef, {
        format: 'png',
        quality: 1,
      });

      return uri;
    } catch (error) {
      console.error('Error capturing QR code:', error);
      throw error;
    }
  };

  const shareQRCode = async () => {
    try {
      setSaving(true);
      const qrImageUri = await captureQRCode();

      const projectName = project.name || 'Unnamed Project';
      const message = t('shareProjectMessage').replace('{projectName}', projectName);
      
      const shareOptions = {
        title: t('shareProjectQR'),
        message: message,
        url: qrImageUri,
        type: 'image/png'
      };

      const result = await Share.share(shareOptions);

      if (result.action === Share.sharedAction) {
        Alert.alert(t('success'), t('qrSharedSuccessfully'));
      }
    } catch (error) {
      console.error('Error sharing QR code:', error);
      Alert.alert(t('error'), t('couldNotShareQR'));
    } finally {
      setSaving(false);
    }
  };

  const saveQRCode = async () => {
    try {
      setSaving(true);
      
      // Solicitar permisos en Android
      if (Platform.OS === 'android') {
        const hasPermission = await requestStoragePermission();
        if (!hasPermission) {
          Alert.alert(t('error'), t('storagePermissionDenied'));
          return;
        }
      }

      // Solicitar permisos para la galería
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('error'), t('photoLibraryPermissionDenied'));
        return;
      }

      const qrImageUri = await captureQRCode();
      
      // Guardar en la galería
      const asset = await MediaLibrary.createAssetAsync(qrImageUri);
      
      // Crear álbum si no existe
      const album = await MediaLibrary.getAlbumAsync('FiberQR');
      if (album) {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      } else {
        await MediaLibrary.createAlbumAsync('FiberQR', asset, false);
      }
      
      Alert.alert(t('success'), t('qrSavedSuccessfully'));
    } catch (error) {
      console.error('Error saving QR code:', error);
      Alert.alert(t('error'), t('couldNotSaveQR'));
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    if (saving) return;
    
    Alert.alert(
      t('shareQRCode'),
      t('chooseShareOption'),
      [
        {
          text: t('cancel'),
          style: 'cancel'
        },
        {
          text: t('shareAsImage'),
          onPress: shareQRCode
        },
        {
          text: t('shareAsData'),
          onPress: () => shareAsData()
        }
      ]
    );
  };

  const shareAsData = async () => {
    try {

      const projectName = project.name || 'Unnamed Project';
      const message = t('shareProjectMessage').replace('{projectName}', projectName);

      const shareOptions = {
        title: t('shareProjectData'),
        message: `${message}\n\n${qrData}`,
      };

      const result = await Share.share(shareOptions);

      if (result.action === Share.sharedAction) {
        Alert.alert(t('success'), t('dataSharedSuccessfully'));
      }
    } catch (error) {
      console.error('Error sharing data:', error);
      Alert.alert(t('error'), t('couldNotShareData'));
    }
  };

  const handleSave = async () => {
    if (saving) return;
    
    Alert.alert(
      t('saveQRCode'),
      t('confirmSaveQR'),
      [
        {
          text: t('cancel'),
          style: 'cancel'
        },
        {
          text: t('save'),
          onPress: saveQRCode,
          style: 'default'
        }
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t('projectQRCode')}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.qrContainer}>
            {loading ? (
              <ActivityIndicator size="large" color="#3498db" />
            ) : qrData ? (
              <View ref={qrRef} collapsable={false} style={styles.qrWrapper}>
                <QRCode
                  value={qrData}
                  size={250}
                  color={isDarkMode ? '#ffffff' : '#000000'}
                  backgroundColor={isDarkMode ? '#1e1e1e' : '#ffffff'}
                />
                <Text style={[styles.projectName, { color: colors.text }]}>
                  {project.name || project.id}
                </Text>
                <Text style={[styles.projectInfo, { color: colors.subText }]}>
                  {t('containsCompleteProjectData')}
                </Text>
              </View>
            ) : (
              <Text style={[styles.errorText, { color: colors.subText }]}>
                {t('couldNotGenerateQR')}
              </Text>
            )}
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, { 
                backgroundColor: saving ? '#95a5a6' : '#3498db',
                opacity: (loading || !qrData || saving) ? 0.7 : 1
              }]}
              onPress={handleShare}
              disabled={loading || !qrData || saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="share-social" size={20} color="#ffffff" />
                  <Text style={styles.actionButtonText}>{t('share')}</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { 
                backgroundColor: saving ? '#95a5a6' : '#2ecc71',
                opacity: (loading || !qrData || saving) ? 0.7 : 1
              }]}
              onPress={handleSave}
              disabled={loading || !qrData || saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="download" size={20} color="#ffffff" />
                  <Text style={styles.actionButtonText}>{t('save')}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <Text style={[styles.note, { color: colors.subText }]}>
            {t('qrCodeNote')}
          </Text>

          {saving && (
            <View style={styles.savingOverlay}>
              <ActivityIndicator size="large" color="#3498db" />
              <Text style={[styles.savingText, { color: colors.text }]}>
                {t('processing')}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '90%',
    borderRadius: 16,
    padding: 20,
    maxWidth: 400,
    position: 'relative',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 20,
  },
  qrWrapper: {
    alignItems: 'center',
  },
  projectName: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 15,
    textAlign: 'center',
  },
  projectInfo: {
    fontSize: 14,
    marginTop: 5,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    minWidth: 100,
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    marginLeft: 8,
  },
  note: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  savingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  savingText: {
    marginTop: 10,
    fontSize: 16,
  },
});

export default QRGeneratorModal;