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
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../hooks/useTranslation';
import { useDevice } from '../context/DeviceContext';
import RNPickerSelect from 'react-native-picker-select';
import { number } from 'yup';




const FiberDetails = ({ route, navigation }) => {
  const { topInset, bottomInset, stylesFull } = useDevice();
  const { isDarkMode } = useApp();
  const { t } = useTranslation();
  const { fiber } = route.params;
  const [fiberData, setFiberData] = useState(fiber);
  const [threadsData, setThreadsData] = useState([]);
  const [buffersData, setBuffersData] = useState([]);
  const [selectedBufferId, setSelectedBufferId] = useState(null);
  const [selectedBuffer, setSelectedBuffer] = useState(null);


  const fiberTypesList = [
    { typeId: '12F', name: '12F', description: 'fiber12FDescription', buffersCount: 1 },
    { typeId: '24F', name: '24F', description: 'fiber24FDescription', buffersCount: 2 },
    { typeId: '48F', name: '48F', description: 'fiber48FDescription', buffersCount: 4 },
    { typeId: '96F', name: '96F', description: 'fiber96FDescription', buffersCount: 8 },
    { typeId: '192F', name: '192F', description: 'fiber192FDescription', buffersCount: 16 }
  ];

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
  });


  const handleSave = () => {
    // Ejecutar el callback si existe
    if (route.params?.onSaveFiber) {
      let update = {
        ...buffersData[0]
      };

      for (let i = 1; i < buffersData.length; i++)
        update.buffers.push(buffersData[i]);

      route.params.onSaveFiber(update);
    }

    navigation.goBack();
  };

  const handleChangeThreadState = (number, state) => {
    const index = buffersData.findIndex(x => x.value == selectedBuffer.value);
    if (index != -1) {
      let tmp = [...buffersData];
      tmp[index].threads[number - 1].active = state;
      setBuffersData(tmp);
    }
  }

  useEffect(() => {
    const loadBufferThreads = async () => {

      if (fiberData.buffers.length > 0) {
        let buffer = {
          ...fiberData,
          value: fiber.id == undefined ? fiber.hash : fiber.id,
        };

        let buffers = [buffer];
        fiberData.buffers.forEach(b => {
          buffer = {
            ...b,
            value: b.id == undefined ? b.hash : b.id,
          };

          buffers = [...buffers, buffer];
        });

        setBuffersData(buffers);
        setSelectedBufferId(buffers[0].value);
        setSelectedBuffer(buffers[0]);
      } else {
        const buffers = [...buffersData, fiberData];
        setBuffersData(buffers);
        setSelectedBufferId(buffers[0].value);
        setSelectedBuffer(buffers[0]);
        setThreadsData(buffers[0].threads);
      }

    };

    loadBufferThreads();
  }, []);

  // O usando StyleSheet.create
  const BuildThreadStyle = (item) => {
    return StyleSheet.create({
      text: {
        fontSize: 16,
        color: item.isActive ? 'blue' : 'gray',
      }
    }).text;
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
          {t('fiberDetails')}
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

          <View >
            <Text style={styles.label} >{t('type')}</Text>
            <TextInput
              readOnly={true}
              style={styles.input}
              value={fiberTypesList.find(x => x.typeId == fiberData.typeId).name || ''}
            />
          </View>


          <View >
            <Text style={styles.label} >{t('label')}</Text>
            <TextInput
              style={styles.input}
              value={fiberData.label}
              onChangeText={(text) => {
                const tmp = {
                  ...fiberData,
                  label: text
                };
                setFiberData(tmp);
              }}

            />
          </View>


        </View>

        {/**Buffers */}
        {fiberData.buffers.length > 0 && (
          <View>
            <Text style={styles.label2} >{'Buffers'}</Text>

            <RNPickerSelect
              style={pickerSelectStyles}
              value={selectedBufferId}
              useNativeAndroidPickerStyle={false}
              onValueChange={(value) => {
                if (value != null) {
                  setSelectedBufferId(value);
                  const buffer = buffersData.find(x => x.value == value);
                  setSelectedBuffer(buffer);
                  setThreadsData(buffer.threads);
                }
              }}
              itemKey={item => item.id}
              items={buffersData}
              placeholder={{ label: t('selectAnOption'), value: null }}
            />
          </View>
        )}

        {/**Ports */}

        <Text style={styles.label2} >{t('ports')}</Text>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          {threadsData.length > 0 && (

            <FlatList
              data={threadsData}
              keyExtractor={item => item.number}
              renderItem={({ item }) => (
                <View>
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <View style = {{
                      backgroundColor: item.color,
                      paddingLeft: 8,
                      paddingRight: 8,
                      margin: 2
                    }}>
                      <Text style={item.enabled ? styles.enabledPort : styles.disabledPort} >{`${t('port')} - ${item.number}`}</Text>
                    </View>


                    <Switch
                      trackColor={{ false: "#767577", true: "#81b0ff" }}
                      value={item.active}
                      onValueChange={(value) => {
                        handleChangeThreadState(item.number, value);
                      }}
                    />
                  </View>
                </View>
              )}
            />
          )}
        </View>




      </ScrollView>
    </View >
  );
};



export default FiberDetails;