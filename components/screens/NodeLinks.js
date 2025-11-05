// components/DetallesProyecto.js
import React, { useState, useEffect, useRef } from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Share,
  Platform,
  PermissionsAndroid,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../hooks/useTranslation';
import { useDevice } from '../context/DeviceContext';
import { useAdapter } from '@/api/contexts/DatabaseContext';

import { v4 as uuidv4 } from 'uuid';
import RNPickerSelect from 'react-native-picker-select';

const NodeLinks = ({ route, navigation }) => {
  const { updateNode } = useAdapter()();

  const { topInset, bottomInset, stylesFull } = useDevice();
  const { isDarkMode } = useApp();
  const { t } = useTranslation();
  const { node } = route.params;
  const { devices } = node;


  const [nodeData, setNodeData] = React.useState(node);
  const [devicesData, setDevicesData] = React.useState(devices);

  const [showFusionModal, setShowFusionModal] = useState(true);
  const [fibersData, setFibersData] = useState([]);

  const [srcLink, setSrcLink] = useState(null);
  const [dstLink, setDstLink] = useState(null);

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
    inputBackground: isDarkMode ? '#2a2a2a' : '#f8f9fa',
    placeholder: isDarkMode ? '#888888' : '#a0a0a0',
    cardBackground: isDarkMode ? '#1e1e1e' : 'white',
  };

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      backgroundColor: colors.cardBackground,
      padding: 25,
      borderRadius: 16,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 20,
      textAlign: 'center',
    },
    modalItem: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalItemText: {
      fontSize: 16,
      color: colors.text,
    },
    section: {
      marginBottom: 3,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 15,
      paddingLeft: 5,
    },
    deviceCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    deviceHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 0,
      paddingBottom: 4

    },
    deviceInfo: {
      flex: 1,
    },
    deviceName: {
      fontSize: 17,
      fontWeight: '500',
      color: colors.text,
    },
    deviceName2: {
      fontSize: 17,
      fontWeight: '500',
      color: '#3a3b3aff',
    },
    removeButton: {
      padding: 4,
    },
    deviceDescription: {
      fontSize: 12,
      color: colors.secondaryText,
      marginTop: 2,
    },
    configRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    macAddressRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    configLabel: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '500',
    },
    configInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 8,
      width: 80,
      textAlign: 'center',
      backgroundColor: colors.inputBackground,
      color: colors.text,
    },
    scanButton: {
      backgroundColor: colors.purple,
      padding: 8,
      borderRadius: 6,
    },
    scanButtonText: {
      color: '#ffffff',
      fontSize: 12,
      fontWeight: '500',
    },
    macAddressInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 8,
      flex: 1,
      marginRight: 8,
      backgroundColor: colors.inputBackground,
      color: colors.text,
    },
    clearButton: {
      padding: 5,
    },
    inputLabel: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
    },
    container: {
      flex: 1,
      backgroundColor: '#ffffff',
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 14,
      fontSize: 16,
      backgroundColor: colors.inputBackground,
      color: colors.text,
    },
    label: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
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
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
    },
    backButton: {
      padding: 4,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#2c3e50',
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    mapButton: {
      padding: 4,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    card: {
      backgroundColor: '#ffffff',
      padding: 20,
      borderRadius: 12,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: '#e9ecef',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#2c3e50',
      marginBottom: 12,
    },
    description: {
      fontSize: 16,
      color: '#7f8c8d',
      marginBottom: 20,
      fontStyle: 'italic',
      lineHeight: 22,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 15,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#ecf0f1',
    },
    detailLabel: {
      fontSize: 16,
      color: '#7f8c8d',
      marginLeft: 10,
      marginRight: 6,
      fontWeight: '500',
      minWidth: 100,
    },
    detailValue: {
      fontSize: 16,
      color: '#2c3e50',
      fontWeight: '600',
      flex: 1,
    },
    mapButtonLarge: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#3498db',
      padding: 16,
      borderRadius: 10,
      marginBottom: 20,
    },
    mapButtonText: {
      color: '#ffffff',
      fontWeight: '600',
      fontSize: 16,
      marginLeft: 8,
    },
  });

  const pickerSelectStyles = StyleSheet.create({
    inputWeb: {
      fontSize: 16,
      paddingVertical: 15,
      paddingHorizontal: 20,
      borderWidth: 2,
      borderColor: '#E5E7EB',
      borderRadius: 12,
      color: '#1F2937',
      backgroundColor: '#F9FAFB',
      paddingRight: 50,
      marginVertical: 8,
      outline: 'none', // Importante para web
      cursor: 'pointer',
    },
    inputIOS: {
      fontSize: 16,
      paddingVertical: 15,
      paddingHorizontal: 20,
      borderWidth: 2,
      borderColor: '#E5E7EB',
      borderRadius: 12,
      color: '#1F2937',
      backgroundColor: '#F9FAFB',
      paddingRight: 50,
      marginVertical: 8,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
    },
    inputAndroid: {
      fontSize: 16,
      paddingHorizontal: 20,
      paddingVertical: 15,
      borderWidth: 2,
      borderColor: '#E5E7EB',
      borderRadius: 12,
      color: '#1F2937',
      backgroundColor: '#197ee2ff',
      paddingRight: 50,
      marginVertical: 8,
      elevation: 3,
    },
    placeholder: {
      color: '#6B7280',
    },
    iconContainer: {
      top: 18,
      right: 15,
    }
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const verEnMapa = () => {
    //navigation.navigate('ViewOnMap', { selectedProject: proyecto });
  };

  const saveAndGoBack = () => {
    const savedNode = {
      ...nodeData,
      devices: devicesData
    };

    route.params.onSaveNode(savedNode);
    navigation.goBack();
  }

  const handleSave = () => {
    // Ejecutar el callback si existe
    if (route.params?.onSaveNode) {
      if (node.id != undefined) {
        const upd = { ...nodeData, metadata: JSON.stringify(devicesData) };
        updateNode(node.id, upd).then(r => {
          saveAndGoBack();
        }).catch(e => {

        })
      } else {
        saveAndGoBack();
      }
    }
  };

  const updateDevice = (device) => {
    let index = -1;

    if (device.hash != undefined) {
      index = devicesData.findIndex(x => x.hash == device.hash);
    } else {
      index = devicesData.findIndex(x => x.id == device.id);
    }

    if (index != -1) {
      let tmp = [...devicesData];
      tmp[index] = device;
      setDevicesData(tmp);
    }
  }

  const handleSaveFusionLink = (data) => {
    let fusionLinks = nodeData.fusionLinks == undefined ? [] : nodeData.fusionLinks;
    fusionLinks.push(data);

    const tmp = {
      ...nodeData,
      fusionLinks: fusionLinks
    };

    setNodeData(tmp);
  }

  const RenderFusionLink = ({ link }) => {
    return (
      <View style={{ flexDirection: 'row', gap: 1, justifyContent: 'space-between' }}>

        <View style={{ flexDirection: 'row' }}>
          <Text style={styles.deviceName}>
            {`Fiber -> ${link.src.fiberLabel} ->`}
          </Text>
          <Text style={styles.deviceName}>
            {` Thread: ${link.src.thread}`}
          </Text>
        </View>

        <Ionicons name="link" size={24} color="#2c3e50" />

        <View style={{ flexDirection: 'row' }}>

          <Text style={styles.deviceName}>
            {`Thread: ${link.dst.thread} ->`}
          </Text>

          <Text style={styles.deviceName}>
            {`Fiber -> ${link.dst.fiberLabel}`}
          </Text>

        </View>


      </View>
    )
  }

  const handleAddFusionLink = () => {
    navigation.navigate('FusionLink', {
      projectId: node.projectId,
      link: {
        hash: uuidv4(),
        src: '',
        srcBuffer: '',
        srcThread: '',
        dst: '',
        dstBuffer: '',
        dstThread: '',
      },
      onSaveFusionLink: (link) => {
        handleSaveFusionLink(link);
      }
    });
  }

  return (
    <View style={[stylesFull.screen, { backgroundColor: colors.background }, { paddingBottom: bottomInset }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }, { paddingTop: topInset - 10 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#2c3e50" />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t('nodeLinks')}
        </Text>

        <View style={{ flexDirection: 'row', }}>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={verEnMapa} style={styles.mapButton}>
              <Ionicons name="location" size={24} color="#666261ff" />
            </TouchableOpacity>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleSave} style={styles.mapButton}>
              <Ionicons name="save" size={24} color="#3498db" />
            </TouchableOpacity>
          </View>
        </View>


      </View>

      {/* Contenido */}
      <ScrollView style={styles.content}>

        {/* Fusion links */}
        <View style={styles.section}>
          <View style={styles.deviceHeader}>
            <Text style={styles.sectionTitle}>{t('fusionLinks')}</Text>
            <TouchableOpacity
              onPress={handleAddFusionLink}
              style={styles.clearButton}

            >
              <Ionicons name="add-circle" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

        </View>


        <FlatList
          data={nodeData.fusionLinks == undefined ? [] : nodeData.fusionLinks}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <View style={styles.deviceHeader}>
              </View>
              <RenderFusionLink link={item} />
            </View>
          )}
        >

        </FlatList>

      </ScrollView>


    </View >
  );
};



export default NodeLinks;