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
  Switch,
  FlatList,
  Button,
  Platform,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../hooks/useTranslation';
import { useDevice } from '../context/DeviceContext';
import { number } from 'yup';



const DeviceDetails = ({ route, navigation }) => {
  const { topInset, bottomInset, stylesFull } = useDevice();
  const { isDarkMode } = useApp();
  const { t } = useTranslation();
  const { deviceData } = route.params;
  const [data, setData] = useState(deviceData);
  const [showTypeModal, setShowTypeModal] = useState(false);

  // 🔥 DEBUG: Log inicial
  React.useEffect(() => {
    console.log('📱 DeviceDetails mounted');
    console.log('📱 deviceData:', deviceData);
    console.log('📱 data.type:', data.type);
  }, []);

  const deviceTypes = [
    { value: 'switch', label: 'Switch', description: 'ethernetSwitching', defaultPorts: 24 },
    { value: 'router', label: 'Router', description: 'networkRouting', defaultPorts: 8 },
    { value: 'access_point', label: 'Access Point', description: 'wirelessConnectivity', defaultPorts: 4 },
    { value: 'olt', label: 'OLT', description: 'opticalLineTerminal', defaultPorts: 16 },
    { value: 'ont', label: 'ONT', description: 'opticalNetworkTerminal', defaultPorts: 1 },
    { value: 'splitter', label: 'Splitter', description: 'opticalSignalSplitting', defaultPorts: 8 }
  ];

  // 🔥 DEBUG: Log de deviceTypes
  React.useEffect(() => {
    console.log('🎯 deviceTypes loaded:', deviceTypes.length, 'items');
    console.log('🎯 deviceTypes:', deviceTypes.map(t => t.label));
  }, []);

  const pickerSelectStyles = StyleSheet.create({
    // Removido: RNPickerSelect reemplazado con Modal personalizado
  });


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
  };

  const styles = StyleSheet.create({
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
      marginBottom: 1,
      paddingBottom: 4,
      borderBottomColor: '#f1f1f1ff',
      borderBottomWidth: 1,

    },
    deviceInfo: {
      flex: 1,
    },
    deviceName: {
      fontSize: 17,
      fontWeight: '500',
      color: colors.text,
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
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.purple,
      paddingHorizontal: 12,
      paddingVertical: 14,
      borderRadius: 10,
      justifyContent: 'center',
    },
    scanButtonText: {
      color: '#ffffff',
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 6,
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
    numberInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 14,
      fontSize: 16,
      backgroundColor: colors.inputBackground,
      color: colors.text,
      type: 'number'
    },
    label: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    enabledPort: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    disabledPort: {
      fontSize: 15,
      fontWeight: '600',
      color: '#d3d3d3ff',
      marginBottom: 8,
    },
    label2: {
      fontSize: 15,
      fontWeight: '700',
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
    modalContent: {
      borderRadius: 12,
      padding: 0,
      maxHeight: '80%',
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      padding: 16,
      borderBottomWidth: 1,
      textAlign: 'center',
    },
    modalItem: {
      padding: 16,
      borderBottomWidth: 1,
      minHeight: 50,
      justifyContent: 'center',
    },
    modalItemText: {
      fontSize: 16,
      fontWeight: '500',
    },
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const buildPorts = (count) => {
    let ports = [];
    for (let i = 0; i < count; i++) {
      ports.push({
        enabled: true,
        number: i + 1
      })
    }

    return ports;
  };

  const handleSave = () => {
    console.log('💾 DeviceDetails.handleSave triggered');
    console.log('📦 Device data to save:', {
      hash: data.hash,
      label: data.label,
      type: data.type,
      portsCount: data.portsCount,
      ports: data.ports?.length || 0
    });
    
    // Ejecutar el callback si existe
    if (route.params?.onSaveDevice) {
      console.log('🎯 Calling onSaveDevice callback...');
      route.params.onSaveDevice(data);
      console.log('✅ onSaveDevice callback executed');
    } else {
      console.warn('⚠️ No onSaveDevice callback provided in route.params');
    }

    navigation.goBack();
  };

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
          {deviceData.id == undefined ? t('addDevice') : t('editDevice')}
        </Text>

        <View style={{ flexDirection: 'row', }}>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={handleSave}
              style={styles.mapButton}>
              <Ionicons name="save" size={24} color="#3498db" />
            </TouchableOpacity>
          </View>
        </View>


      </View>

      {/* Contenido */}
      <ScrollView style={styles.content}>
        {/**Data */}
        <Text style={styles.label2} >{t('info')}</Text>

        <View style={[styles.card, { backgroundColor: colors.card }]}>

          <View>
            <Text style={styles.label}>{t('type')}</Text>
            
            {/* Custom Modal Picker para dispositivos */}
            <TouchableOpacity
              style={[styles.input, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
              onPress={() => setShowTypeModal(true)}
            >
              <Text style={{ color: data.type ? colors.text : colors.placeholder }}>
                {data.type 
                  ? deviceTypes.find(x => x.value === data.type)?.label 
                  : t('selectAnOption')}
              </Text>
              <Ionicons name="chevron-down" size={20} color={colors.primary} />
            </TouchableOpacity>

            {/* Modal para seleccionar tipo de dispositivo */}
            <Modal
              visible={showTypeModal}
              transparent={true}
              animationType="fade"
              onRequestClose={() => setShowTypeModal(false)}
            >
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}
                onPress={() => setShowTypeModal(false)}
              >
                <View style={[styles.modalContent, { backgroundColor: colors.card, maxWidth: '90%' }]}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>{t('selectDeviceType')}</Text>
                  
                  <FlatList
                    data={deviceTypes}
                    keyExtractor={(item) => item.value}
                    scrollEnabled={true}
                    nestedScrollEnabled={true}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[styles.modalItem, { borderBottomColor: colors.border }]}
                        onPress={() => {
                          console.log('✅ Selected device type:', item.value);
                          
                          // Generar puertos basado en defaultPorts
                          const ports = [];
                          for (let i = 0; i < item.defaultPorts; i++) {
                            ports.push({
                              enabled: true,
                              number: i + 1
                            });
                          }
                          
                          setData(prev => ({
                            ...prev,
                            type: item.value,
                            label: item.label,
                            portsCount: item.defaultPorts.toString(),
                            ports: ports
                          }));
                          setShowTypeModal(false);
                        }}
                      >
                        <Text style={[styles.modalItemText, { color: colors.text }]}>
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              </TouchableOpacity>
            </Modal>
          </View>

          <View>
            <Text style={styles.label}>{t('description')}</Text>
            <TextInput
              style={styles.input}
              value={data.description || ''}
              onChangeText={(text) => {
                setData(prev => ({
                  ...prev,
                  description: text
                }));
              }}
            />
          </View>



          <View >
            <Text style={styles.label} >{t('macAddress')}</Text>
            <View style={{ flexDirection: 'row', justifyContent:'space-between' }}>
              <TextInput
                style={[styles.input, { flex: 1, marginRight:8 }]}
                value={data.mac || ''}
                onChangeText={(text) => {
                  setData(prev => ({
                    ...prev,
                    mac: text
                  }));
                }}
                placeholder={t('enterMacAddress') || 'Ingresa dirección MAC'}
              />
              <TouchableOpacity
                style={styles.scanButton}
                onPress={() => navigation.navigate('MacAddressScanner', {
                  onMacAddressScanned: (macAddress) => {
                    setData(prev => ({
                      ...prev,
                      mac: macAddress
                    }));
                  }
                })}
              >
                <Ionicons name="scan" size={20} color="#ffffff" />
                <Text style={styles.scanButtonText}>{t('scan') || 'Escanear'}</Text>
              </TouchableOpacity>

            </View>

          </View>

          <View >
            <Text style={styles.label} >{t('serialNumber')}</Text>
            <TextInput
              style={styles.input}
              value={data.serialNumber || ''}
              onChangeText={(text) => {
                setData(prev => ({
                  ...prev,
                  serialNumber: text
                }));
              }}

            />
          </View>

          <View style={{
            marginTop: 10,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between'
          }} >
            <Text style={styles.label} >{t('ports')}</Text>

            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <TextInput
                inputMode='numeric'
                style={styles.numberInput}
                value={data.portsCount || ''}
                onChangeText={(text) => {
                  setData(prev => ({
                    ...prev,
                    portsCount: text
                  }));
                }}

              />

              <TouchableOpacity
                onPress={() => {
                  setData(prev => ({
                    ...prev,
                    ports: buildPorts(data.portsCount)
                  }));
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.primary,
                  paddingLeft: 10,
                  paddingRight: 10,
                  paddingTop: 11,
                  paddingBottom: 11,
                  borderRadius: 6,
                  marginLeft: 10
                }}
              >
                <Ionicons name="checkmark" size={24} color="#ffffff" />

              </TouchableOpacity>

            </View>

          </View>
        </View>

        {/**Ports */}
        <Text style={styles.label2} >{t('portsDetailsLabel')}</Text>


        <View style={[styles.card, { backgroundColor: colors.card }]}>

          <View>
            {data.ports.map((item, index) => (
              <View key={item.number || index}>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <Text style={item.enabled ? styles.enabledPort : styles.disabledPort} >{`${t('port')} - ${item.number}`}</Text>

                  <Switch
                    trackColor={{ false: "#767577", true: "#81b0ff" }}
                    value={item.enabled}
                    onValueChange={(value) => {
                      let ports = [...data.ports];
                      const index = ports.findIndex(x => x.number == item.number);
                      ports.at(index).enabled = value;
                      setData(prev => ({
                        ...prev,
                        ports: ports
                      }));
                    }}
                  />
                </View>
              </View>
            ))}
          </View>

        </View>


      </ScrollView>
    </View >
  );
};



export default DeviceDetails;