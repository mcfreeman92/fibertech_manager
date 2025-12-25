// components/DetallesProyecto.js
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  FlatList,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../context/AppContext";
import { useTranslation } from "../hooks/useTranslation";
import { useDevice } from "../context/DeviceContext";
import { useAdapter } from "@/api/contexts/DatabaseContext";

import { uuidv4 } from "../../utils/utils";

const NodeDetails = ({ route, navigation }) => {
  const { updateNode, updateFiberThread, getNodeById } = useAdapter()();

  const { topInset, bottomInset, stylesFull } = useDevice();
  const { isDarkMode, nodesTypesList } = useApp();
  const { t } = useTranslation();
  const { node, allFibers } = route.params;
  const { devices } = node;

  console.log('🔍 NodeDetails.js - Received node:', {
    label: node?.label,
    id: node?.id,
    hash: node?.hash,
    devices: node?.devices?.length || 0
  });

  const [nodeData, setNodeData] = React.useState(node);
  const [devicesData, setDevicesData] = React.useState(devices);
  const [isLoadedFromDB, setIsLoadedFromDB] = React.useState(false); // Flag to skip auto-save during mount-load

  // Cargar nodo desde BD cuando el componente se monta
  React.useEffect(() => {
    setIsLoadedFromDB(false); // Reset flag when component mounts or node changes
    
    const loadNodeFromDB = async () => {
      try {
        // If node has an ID, load fresh data from BD
        if (node?.id) {
          console.log('📥 Loading node from database on mount (by ID):', node.label);
          const freshNode = await getNodeById(node.id);
          if (freshNode) {
            console.log('✅ Node loaded from DB:', freshNode.label, 'Devices:', freshNode.devices?.length || 0);
            setNodeData(freshNode);
            setDevicesData(freshNode.devices || []);
          } else {
            console.log('⚠️ Node not found by ID, using route.params:', node.label);
            setNodeData(node);
            setDevicesData(devices || []);
          }
        } else {
          // Node doesn't have an ID yet (newly created), use route.params
          console.log('📝 Node has no ID yet, using route.params:', node.label);
          setNodeData(node);
          setDevicesData(devices || []);
        }
      } catch (error) {
        console.error('❌ Error loading node from DB:', error);
        // Fallback a lo que viene en route.params
        setNodeData(node);
        setDevicesData(devices || []);
      } finally {
        // ALWAYS mark as loaded so auto-save can run
        setIsLoadedFromDB(true);
      }
    };

    loadNodeFromDB();
  }, [node?.id]); // Solo ejecutar cuando cambia el node.id

  // Guardar en BD cuando hay cambios en devicesData (auto-save con debounce)
  const [saveTimeout, setSaveTimeout] = React.useState(null);
  
  // Guardar cambios cuando el usuario intenta irse (presiona atrás)
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', async (e) => {
      // Si hay cambios sin guardar y el usuario intenta navegar away
      if ((devicesData.length > 0 || nodeData.fusionLinks?.length > 0) && nodeData.id) {
        console.log('⚠️ User is navigating away - Ensuring all changes are saved');
        
        // Guardar antes de permitir la navegación
        try {
          const meta = {
            devices: devicesData,
            fusionLinks: nodeData.fusionLinks || [],
          };
          
          await updateNode(nodeData.id, {
            label: nodeData.label,
            typeId: nodeData.typeId,
            description: nodeData.description || '',
            metadata: JSON.stringify(meta),
          });
          console.log('✅ Final save completed before navigation');
        } catch (error) {
          console.error('❌ Error in final save:', error);
        }
      }
    });

    return unsubscribe;
  }, [navigation, devicesData, nodeData]);
  
  React.useEffect(() => {
    // SKIP auto-save until mount-load is complete
    if (!isLoadedFromDB) {
      console.log('⏳ Skipping auto-save - still loading from DB on mount');
      return;
    }

    // For temporary nodes (without ID), sync devices back to the node object for CreateProject
    if (nodeData.id == undefined) {
      console.log('🔄 Syncing devices to temporary node:', nodeData.label);
      setNodeData(prev => ({
        ...prev,
        devices: devicesData,
      }));
      return; // Don't try to save to DB
    }

    // Limpiar timeout anterior
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    // Auto-save INMEDIATAMENTE sin debounce para evitar race conditions (only for persisted nodes)
    const saveNow = async () => {
      if (nodeData.id != undefined) {
        try {
          const meta = {
            devices: devicesData,
            fusionLinks: nodeData.fusionLinks || [],
          };
          
          console.log('💾 Auto-saving node with', devicesData.length, 'devices to BD');
          const success = await updateNode(nodeData.id, {
            label: nodeData.label,
            typeId: nodeData.typeId,
            description: nodeData.description || '',
            metadata: JSON.stringify(meta),
          });
          console.log('✅ Node auto-saved successfully:', success);
        } catch (error) {
          console.error('❌ Error auto-saving node:', error);
        }
      }
    };

    // Ejecutar inmediatamente si hay cambios
    saveNow();

    setSaveTimeout(null);

    return () => {
      // Limpieza
    };
  }, [devicesData, nodeData, isLoadedFromDB]); // Include isLoadedFromDB in dependencies

  // No recargar desde BD en useFocusEffect - confiar en local state + auto-save
  // El auto-save inmediato se encarga de persistir los cambios
  useFocusEffect(
    React.useCallback(() => {
      console.log('👁️ NodeDetails received focus. Using local state with auto-save.');
      // No hacer nada - los datos ya están en local state
      // El auto-save se encargará de persistir
    }, [])
  );

  const colors = {
    primary: "#3498db",
    success: "#2ecc71",
    warning: "#f39c12",
    danger: "#e74c3c",
    purple: "#9b59b6",
    background: isDarkMode ? "#121212" : "#ffffff",
    card: isDarkMode ? "#1e1e1e" : "#ffffff",
    text: isDarkMode ? "#ffffff" : "#2c3e50",
    subText: isDarkMode ? "#b0b0b0" : "#7f8c8d",
    border: isDarkMode ? "#333" : "#ecf0f1",
    inputBackground: isDarkMode ? "#2a2a2a" : "#f8f9fa",
    placeholder: isDarkMode ? "#888888" : "#a0a0a0",
    cardBackground: isDarkMode ? "#1e1e1e" : "white",
  };

  const styles = StyleSheet.create({
    deviceCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    deviceHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 1,
      paddingBottom: 4,
      borderBottomColor: "#f1f1f1ff",
      borderBottomWidth: 1,
    },
    deviceInfo: {
      flex: 1,
    },
    deviceName: {
      fontSize: 17,
      fontWeight: "500",
      color: colors.text,
    },
    deviceName2: {
      fontSize: 17,
      fontWeight: "500",
      color: "#3a3b3aff",
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
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    macAddressRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    configLabel: {
      fontSize: 14,
      color: colors.text,
      fontWeight: "500",
    },
    configInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 8,
      width: 80,
      textAlign: "center",
      backgroundColor: colors.inputBackground,
      color: colors.text,
    },
    scanButton: {
      backgroundColor: colors.purple,
      padding: 8,
      borderRadius: 6,
    },
    scanButtonText: {
      color: "#ffffff",
      fontSize: 12,
      fontWeight: "500",
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
      fontWeight: "500",
      color: colors.text,
    },
    container: {
      flex: 1,
      backgroundColor: "#ffffff",
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
      fontWeight: "600",
      color: colors.text,
      marginBottom: 8,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: "#ffffff",
      padding: 16,
      paddingTop: 50,
      borderBottomWidth: 1,
      borderBottomColor: "#ecf0f1",
      shadowColor: "#000",
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
      fontWeight: "600",
      color: "#2c3e50",
    },
    headerActions: {
      flexDirection: "row",
      alignItems: "center",
    },
    mapButton: {
      padding: 4,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    card: {
      backgroundColor: "#ffffff",
      padding: 20,
      borderRadius: 12,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: "#e9ecef",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    title: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#2c3e50",
      marginBottom: 12,
    },
    description: {
      fontSize: 16,
      color: "#7f8c8d",
      marginBottom: 20,
      fontStyle: "italic",
      lineHeight: 22,
    },
    detailRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 15,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: "#ecf0f1",
    },
    detailLabel: {
      fontSize: 16,
      color: "#7f8c8d",
      marginLeft: 10,
      marginRight: 6,
      fontWeight: "500",
      minWidth: 100,
    },
    detailValue: {
      fontSize: 16,
      color: "#2c3e50",
      fontWeight: "600",
      flex: 1,
    },
    mapButtonLarge: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#3498db",
      padding: 16,
      borderRadius: 10,
      marginBottom: 20,
    },
    mapButtonText: {
      color: "#ffffff",
      fontWeight: "600",
      fontSize: 16,
      marginLeft: 8,
    },
  });

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown date";
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const verEnMapa = () => {
    //navigation.navigate('ViewOnMap', { selectedProject: proyecto });
  };

  const saveAndGoBack = async () => {
    const savedNode = {
      ...nodeData,
      devices: devicesData,
    };

    console.log('✅ ==================== GUARDANDO NODO ====================');
    console.log('✅ Nodo:', nodeData?.label, '(ID:', nodeData?.id, ')');
    console.log('✅ Total devices:', devicesData?.length || 0);
    console.log('✅ Total fusiones:', nodeData.fusionLinks?.length || 0);
    
    if (devicesData && devicesData.length > 0) {
      console.log('✅ Devices:');
      devicesData.forEach((dev, idx) => {
        const linkCount = dev.links?.length || 0;
        console.log(`✅   [${idx + 1}] ${dev.label} ${dev.description || ''} | Links: ${linkCount}`);
        if (dev.links && dev.links.length > 0) {
          dev.links.forEach((link, linkIdx) => {
            console.log(`✅       Link ${linkIdx + 1}: Puerto ${link.port} → Fiber ${link.src?.fiberId}:${link.src?.thread}`);
          });
        }
      });
    }
    
    if (nodeData.fusionLinks && nodeData.fusionLinks.length > 0) {
      console.log('✅ Fusiones:');
      nodeData.fusionLinks.forEach((fusion, idx) => {
        console.log(`✅   [${idx + 1}] Fiber ${fusion.src?.fiberId}:${fusion.src?.thread} ↔ Fiber ${fusion.dst?.fiberId}:${fusion.dst?.thread}`);
      });
    }
    console.log('✅ ===========================================================');

    // ✅ Si el nodo ya tiene ID (no es nuevo), guardar en BD
    if (nodeData.id != undefined) {
      try {
        const meta = {
          devices: devicesData,
          fusionLinks: nodeData.fusionLinks || [],
        };
        
        await updateNode(nodeData.id, {
          label: nodeData.label,
          typeId: nodeData.typeId,
          description: nodeData.description || '',
          metadata: JSON.stringify(meta),
        });
        
        console.log('✅ Node persisted to database');
      } catch (error) {
        console.error('❌ Error saving node to database:', error);
        Alert.alert('Error', 'No se pudo guardar el nodo');
        return;
      }
    } else {
      // Node doesn't have an ID yet (temporary node in CreateProject)
      // Update nodeData with latest devices so CreateProject picks up the changes
      console.log('📝 Node has no DB ID yet - updating local state for CreateProject');
      // nodeData is already updated with devicesData via setDevicesData
      // The caller (CreateProject) will see the updated state when we goBack
    }

    navigation.goBack();
  };

  const handleSave = () => {
    // Guardar siempre (no depender de callback)
    console.log('💾 Save button pressed - Saving node');
    saveAndGoBack();
  };

  const updateDevice = (device) => {
    console.log('🔧 Updating device:', device.label || device.name, 'Ports:', device.ports?.length || 0);
    let index = -1;

    if (device.hash != undefined) {
      index = devicesData.findIndex((x) => x.hash == device.hash);
    } else {
      index = devicesData.findIndex((x) => x.id == device.id);
    }

    if (index != -1) {
      let tmp = [...devicesData];
      tmp[index] = device;
      setDevicesData(tmp);
      console.log('✅ Device updated in devicesData at index:', index);
      
      // Actualizar inmediatamente el nodo en CreateProject
      const updatedNode = {
        ...nodeData,
        devices: tmp,
      };
      // 🔥 Callback opcional para actualización inmediata
      if (route.params?.onSaveNode) {
        route.params.onSaveNode(updatedNode);
      }
      console.log('✅ Node updated in CreateProject with new device data');
    }
  };

  const handleSeeDeviceInfo = (device) => {
    const tmp = {
      deviceData: device,
      onSaveDevice: (data) => {
        updateDevice(data);
      },
    };

    navigation.navigate("DeviceDetails", tmp);
  };

  const handleAddDevice = () => {
    console.log('🆕 handleAddDevice: Opening DeviceDetails with new device');
    navigation.navigate("DeviceDetails", {
      deviceData: {
        hash: uuidv4(),
        name: "",
        label: "",
        description: "",
        defaultPorts: 0,
        type: "",
        serialNumber: "",
        mac: "",
        portsCount: "",
        ports: [],
      },
      // ✅ Pasar callback para agregar nuevo dispositivo
      onSaveDevice: (data) => {
        console.log('🎯 onSaveDevice callback triggered in NodeDetails');
        console.log('📦 Device data received:', {
          hash: data.hash,
          label: data.label,
          type: data.type,
          portsCount: data.portsCount,
          ports: data.ports?.length || 0
        });
        
        // Agregar nuevo dispositivo al array
        const newDevices = [...devicesData, data];
        setDevicesData(newDevices);
        
        console.log('✅ New device added to devicesData');
        console.log('📊 Total devices now:', newDevices.length);
        console.log('📋 Devices list:', newDevices.map(d => ({ label: d.label, type: d.type })));
      }
    });
  };

  const handleDeviceLinks = (device) => {
    navigation.navigate("DeviceLinks", {
      device: device,
      node: nodeData,
      allFibers: allFibers, // Pasar fibers completas incluyendo DROP fibers nuevas
      projectId: node.projectId != undefined ? node.projectId : 0,
      onSaveDeviceData: (data) => {
        updateDevice(data);
      },
    });
  };

  const RenderDevices = () => {
    const ar = nodesTypesList();
    const nodeType = ar.find((x) => x.id == nodeData.typeId);
    const alowDevices = nodeType?.alowDevices;

    if (alowDevices == undefined || alowDevices == false) return <View></View>;

    return (
      <View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 1,
          }}
        >
          <Text style={[styles.title, { color: colors.text }]}>
            {t("devicesLabel")}
          </Text>

          <TouchableOpacity
            onPress={() => {
              handleAddDevice();
            }}
            style={styles.clearButton}
          >
            <Ionicons name="add-circle" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
        
        {devicesData == undefined || devicesData.length == 0 ? (
          <Text style={styles.label}>{t("devicesEmpty")}</Text>
        ) : (
          devicesData.map((item, index) => (
            <View key={item.id || item.hash || index} style={[styles.card, { backgroundColor: colors.card }]}>
              <View style={styles.deviceHeader}>
                <View style={styles.deviceInfo}>
                  <Text
                    style={styles.deviceName2}
                  >{`${item.label} ${item.description}`}</Text>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <TouchableOpacity onPress={() => handleDeviceLinks(item)}>
                    <Ionicons
                      name="git-network"
                      size={24}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      handleSeeDeviceInfo(item);
                    }}
                    style={styles.removeButton}
                  >
                    <Ionicons
                      name="information-circle"
                      size={24}
                      color={"#666261ff"}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.removeButton}>
                    <Ionicons name="trash" size={24} color={"#666261ff"} />
                  </TouchableOpacity>
                </View>
              </View>

              <View
                style={{
                  paddingTop: 7,
                }}
              ></View>

              <View style={styles.configRow}>
                <Text style={styles.configLabel}>{t("ports")}:</Text>
                <Text style={styles.configLabel}>{item.ports.length}</Text>
              </View>

              <View style={styles.configRow}>
                <Text style={styles.configLabel}>{t("macAddress")}:</Text>
                <Text style={styles.configLabel}>{item.mac}</Text>
              </View>
            </View>
          ))
        )}
      </View>
    );
  };

  return (
    <View
      style={[
        stylesFull.screen,
        { backgroundColor: colors.background },
        { paddingBottom: bottomInset },
      ]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.card, borderBottomColor: colors.border },
          { paddingTop: topInset - 10 },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#2c3e50" />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t("nodeDetails")}
        </Text>

        <View style={{ flexDirection: "row" }}>
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
        {/**Datos geenrales */}
        <Text style={[styles.title, { color: colors.text }]}>
          {t("generalData")}
        </Text>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View>
            <Text style={styles.label}>{t("description")}</Text>
            <TextInput
              style={styles.input}
              value={nodeData.label}
              onChangeText={(text) => {
                setNodeData((prev) => ({
                  ...prev,
                  label: text,
                }));
              }}
              placeholder={t("propertyName")}
            />
          </View>
        </View>

        {/**Devices */}
        <RenderDevices />

        <View />
      </ScrollView>
    </View>
  );
};

export default NodeDetails;
