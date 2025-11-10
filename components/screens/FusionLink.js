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
import { deleteData } from '@/service/database';

const FusionLink = ({ route, navigation }) => {
  const { getFibers, getFiberById } = useAdapter()();



  const { topInset, bottomInset, stylesFull } = useDevice();
  const { isDarkMode } = useApp();
  const { t } = useTranslation();
  const { projectId } = route.params;
  const { link } = route.params;
  const { linkHash } = route.params;

  const [showFusionModal, setShowFusionModal] = useState(true);
  const [fibersData, setFibersData] = useState([]);


  const [srcLink, setSrcLink] = useState({
    fiber: null,
    buffer: null,
    thread: null,
    threads: []
  });
  const [dstLink, setDstLink] = useState({
    fiber: null,
    buffer: null,
    thread: null,
    threads: []
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
    cardBackground: isDarkMode ? '#1e1e1e' : '#f6f1f1be',
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
      marginBottom: 25,
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
    formCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 14,
      padding: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.18,
      shadowRadius: 4,
      elevation: 3,
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
      paddingHorizontal: 8,
      borderWidth: 2,
      borderColor: '#E5E7EB',
      borderRadius: 12,
      color: '#1F2937',
      backgroundColor: '#F9FAFB',
      paddingRight: 10,
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
    let result = {
      src: {
        fiberId: srcLink.fiber.id,
        fiberLabel: srcLink.fiber.label,
        bufferId: srcLink.buffer != null ? srcLink.buffer : null,
        bufferLabel: srcLink.bufferLabel != undefined ? srcLink.bufferLabel : null,
        thread: srcLink.thread - 1
      },
      dst: {
        fiberId: dstLink.fiber.id,
        fiberLabel: dstLink.fiber.label,
        bufferId: dstLink.buffer != null ? dstLink.buffer : null,
        bufferLabel: dstLink.bufferLabel != undefined ? dstLink.bufferLabel : null,
        thread: dstLink.thread - 1
      },
      deleted: false
    };

    if (link == undefined)
      result.hash = linkHash;
    else
      result.hash = link.hash;

    route.params.onSaveFusionLink(result);
    navigation.goBack();
  }

  const handleSave = () => {
    // Ejecutar el callback si existe
    if (route.params?.onSaveFusionLink) {
      saveAndGoBack();
    } else {
      navigation.goBack();
    }
  };

  const getContrastColor = (hexColor) => {
    // Si el color es muy claro, usar texto oscuro, sino claro
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Fórmula de luminancia relativa
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  };

  const RenderThread = ({ item }) => {
    const textColor = getContrastColor(item.color);

    return (
      <View style={{
        backgroundColor: item.color,
        paddingLeft: 8,
        paddingRight: 8,
        margin: 2,
        borderWidth: 1,
        borderColor: '#e9ecef',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
        borderRadius: 5
      }}>
        <Text style={[
          item.active ? styles.enabledPort : styles.disabledPort,
          { color: textColor }
        ]}>
          {`${t('port')} - ${item.number}`}
        </Text>
      </View>
    );
  };


  useEffect(() => {

    const loadFibers = async () => {
      let records = await getFibers(projectId, null);

      for (let i = 0; i < records.length; i++) {
        let buffers = [{
          ...records[i],
          value: records[i].id
        }];

        let children = await getFibers(projectId, records[i].id);

        children = children.map(b => {
          return {
            ...b,
            value: b.id
          }
        });

        buffers = [...buffers, ...children];

        let f = {
          ...records[i],
          buffers: buffers
        };

        records[i] = f;
      }

      records = records.map(f => {
        return {
          ...f,
          value: f.id != undefined ? f.id : f.hash
        }
      });
      setFibersData(records);
      return records;
    };


    loadFibers().then(fibers => {
      if (link != undefined) {
        const srcFiber = fibers.find(x => x.id == link.src.fiberId);
        const srcBufer = srcFiber.buffers.find(x => x.id == link.src.bufferId);
        const srcHilos = srcBufer == undefined ? srcFiber.threads : srcBufer.threads;

        const src = {
          fiber: srcFiber,
          buffer: srcBufer,
          thread: link.src.thread,
          threads: srcHilos.map(x => {
            return {
              ...x,
              value: x.number,
              label: `Thread - ${x.number}`
            }
          })
        }

        setSrcLink(src);

        const dstFiber = fibers.find(x => x.id == link.dst.fiberId);
        const dstBufer = dstFiber.buffers.find(x => x.id == link.dst.bufferId);
        const dstHilos = dstBufer == undefined ? dstFiber.threads : dstBufer.threads;

        const dst = {
          fiber: dstFiber,
          buffer: dstBufer,
          thread: link.dst.thread,
          threads: dstHilos.map(x => {
            return {
              ...x,
              value: x.number,
              label: `Thread - ${x.number}`
            }
          })
        }

        setDstLink(dst);
      }
    }).catch(e => {
      console.error(e);
    })
  }, []);

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
          {t('fusionLink')}
        </Text>

        <View style={{ flexDirection: 'row', }}>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={verEnMapa} style={styles.mapButton}>
              <Ionicons name="add" size={24} color="#3498db" />
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

        {/**Source */}
        <View>
          <Text style={styles.label} >{t('Source')}</Text>
          <RNPickerSelect
            style={pickerSelectStyles}
            value={srcLink.fiber != null ? srcLink.fiber.value : null}
            useNativeAndroidPickerStyle={false}
            onValueChange={(value) => {
              const fiber = fibersData.find(x => x.value == value);

              if (fiber != null) {
                const tmp = {
                  ...srcLink,
                  fiber: fiber,
                  thread: null,
                  threads: fiber.buffers.length == 1 ? fiber.threads.filter(x => x.active == true && x.inUse == false).map(t => {
                    return {
                      ...t,
                      value: t.number,
                      label: `Thread - ${t.number}`
                    }
                  }) : []
                }

                setSrcLink(tmp);
              }

            }}
            itemKey={item => item.value}
            items={fibersData}
            placeholder={{ label: t('selectAnOption'), value: null }}
          />
        </View>

        {/**Source Buffer*/}
        {srcLink.fiber != null && srcLink.fiber.buffers.length > 1 && (
          <View>
            <Text style={styles.label} >{t('Buffer')}</Text>
            <RNPickerSelect
              style={pickerSelectStyles}
              value={srcLink.buffer != null ? srcLink.buffer.value : null}
              useNativeAndroidPickerStyle={false}
              onValueChange={(value) => {
                const buffer = srcLink.fiber.buffers.find(x => x.value == value);

                const tmp = {
                  ...srcLink,
                  buffer: value,
                  bufferLabel: buffer.label,
                  threads: buffer.threads.filter(x => x.active == true && x.inUse == false).map(t => {
                    return {
                      ...t,
                      value: t.number,
                      label: `Thread - ${t.number}`
                    }
                  })
                }
                setSrcLink(tmp);
              }}
              itemKey={item => item.value}
              items={srcLink.fiber.buffers}
              placeholder={{ label: t('selectAnOption'), value: null }}
            />
          </View>
        )}

        {/**Destiny */}
        <View>
          <Text style={styles.label} >{t('Destiny')}</Text>
          <RNPickerSelect
            style={pickerSelectStyles}
            value={dstLink.fiber != null ? dstLink.fiber.value : null}
            useNativeAndroidPickerStyle={false}
            onValueChange={(value) => {
              const fiber = fibersData.find(x => x.value == value);

              if (fiber != null) {
                const tmp = {
                  ...dstLink,
                  fiber: fiber,
                  thread: null,
                  threads: fiber.buffers.length == 1 ? fiber.threads.filter(x => x.active == true && x.inUse == false).map(t => {
                    return {
                      ...t,
                      value: t.number,
                      label: `Thread - ${t.number}`
                    }
                  }) : []
                }

                setDstLink(tmp);
              }

            }}
            itemKey={item => item.value}
            items={fibersData}
            placeholder={{ label: t('selectAnOption'), value: null }}
          />
        </View>

        {/**Destiny Buffer*/}
        {dstLink.fiber != null && dstLink.fiber.buffers.length > 1 && (
          <View>
            <Text style={styles.label} >{t('Buffer')}</Text>
            <RNPickerSelect
              style={pickerSelectStyles}
              value={dstLink.buffer != null ? dstLink.buffer.value : null}
              useNativeAndroidPickerStyle={false}
              onValueChange={(value) => {
                const buffer = dstLink.fiber.buffers.find(x => x.value == value);

                const tmp = {
                  ...dstLink,
                  buffer: value,
                  bufferLabel: buffer.label,
                  threads: buffer.threads.filter(x => x.active == true && x.inUse == false).map(t => {
                    return {
                      ...t,
                      value: t.number,
                      label: `Thread - ${t.number}`
                    }
                  })
                }
                setDstLink(tmp);
              }}
              itemKey={item => item.value}
              items={dstLink.fiber.buffers}
              placeholder={{ label: t('selectAnOption'), value: null }}
            />
          </View>
        )}

        { /** LINK */}
        <Text style={styles.label} >{t('Link')}</Text>

        <View style={styles.formCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <RNPickerSelect
              style={pickerSelectStyles}
              value={srcLink.thread != null ? srcLink.thread : null}
              useNativeAndroidPickerStyle={false}
              onValueChange={(value) => {
                const tmp = {
                  ...srcLink,
                  thread: value,
                }
                setSrcLink(tmp);
              }}
              itemKey={item => item.value}
              items={srcLink.threads}
              placeholder={{ label: t('selectAnOption'), value: null }}
            />

            <View style={{ padding: 2 }}>
              <Ionicons name="link" size={24} color="#666261ff" />
            </View>

            <RNPickerSelect
              style={pickerSelectStyles}
              value={dstLink.thread != null ? dstLink.thread : null}
              useNativeAndroidPickerStyle={false}
              onValueChange={(value) => {
                const tmp = {
                  ...dstLink,
                  thread: value,
                }
                setDstLink(tmp);
              }}
              itemKey={item => item.value}
              items={dstLink.threads}
              placeholder={{ label: t('selectAnOption'), value: null }}
            />

          </View>

        </View>

      </ScrollView>
    </View >
  );
};



export default FusionLink;