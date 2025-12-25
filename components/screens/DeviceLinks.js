// components/DetallesProyecto.js
import React, { useState, useEffect, useRef } from "react";
import { useFocusEffect } from "@react-navigation/native";

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
  FlatList,
  Switch,
  Button,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../context/AppContext";
import { useTranslation } from "../hooks/useTranslation";
import { useDevice } from "../context/DeviceContext";
import { useAdapter } from "@/api/contexts/DatabaseContext";
import { PickerModal } from "../context/PickerModal";

import { v4 as uuidv4 } from "uuid";
import { isBufferConsumedInNode } from "@/utils/bufferVisibilityManager";

const DeviceLinks = ({ route, navigation }) => {
  const { updateNode, getFibers, getNodes } = useAdapter()();

  const { topInset, bottomInset, stylesFull } = useDevice();
  const { isDarkMode, language } = useApp();
  const { t } = useTranslation();
  const { device } = route.params;
  const { node } = route.params;
  const { projectId } = route.params;

  const [fibersData, setFibersData] = useState([]);

  const [showLinkSetupModal, setShowLinkSetupModal] = useState(false);
  const [showThreadInUse, setShowThreadInUse] = useState(false);
  
  // Estados para los PickerModals
  const [showFiberModal, setShowFiberModal] = useState(false);
  const [showBufferModal, setShowBufferModal] = useState(false);
  const [showThreadModal, setShowThreadModal] = useState(false);

  const [selectedPort, setSelectedPort] = useState(null);
  const [deviceData, setDeviceData] = useState(device);

  const [srcLink, setSrcLink] = useState({
    fiber: null,
    buffer: null,
    thread: null,
    threads: [],
  });

  const fiberColors12Hex = [
    { index: 0, color: "#0000FF" },
    { index: 1, color: "#FFA500" },
    { index: 2, color: "#008000" },
    { index: 3, color: "#A52A2A" },
    { index: 4, color: "#708090" },
    { index: 5, color: "#FFFFFF" },
    { index: 6, color: "#FF0000" },
    { index: 7, color: "#000000" },
    { index: 8, color: "#FFFF00" },
    { index: 9, color: "#EE82EE" },
    { index: 10, color: "#FFC0CB" },
    { index: 11, color: "#00FFFF" },
  ];

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
    projectList: {
      maxHeight: 300,
      marginBottom: 20,
    },
    successButton: {
      backgroundColor: colors.success,
      borderRadius: 8,
      height: 50,
      marginTop: 10,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    link: {
      fontSize: 15,
      fontWeight: "600",
      color: "#787575ff",
      marginBottom: 8,
    },
    enabledPort: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 8,
    },
    disabledPort: {
      fontSize: 15,
      fontWeight: "600",
      color: "#d3d3d3ff",
      marginBottom: 8,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    modalContent: {
      backgroundColor: colors.cardBackground,
      padding: 25,
      borderRadius: 16,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 20,
      textAlign: "center",
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
      fontWeight: "700",
      color: colors.text,
      marginBottom: 15,
      paddingLeft: 5,
    },
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
      marginBottom: 0,
      paddingBottom: 4,
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

  const handleSave = () => {
    console.log('💾 ==================== GUARDANDO DEVICE ====================');
    console.log('💾 Nodo:', node?.label, '(ID:', node?.id, ')');
    console.log('💾 Dispositivo:', deviceData?.label, deviceData?.description);
    console.log('💾 Total links:', deviceData.links?.length || 0);
    if (deviceData.links && deviceData.links.length > 0) {
      console.log('💾 Links detallados:');
      deviceData.links.forEach((link, idx) => {
        console.log(`💾   [${idx + 1}] Puerto: ${link.port} | Fiber: ${link.src?.fiberId} | Thread: ${link.src?.thread}`);
      });
    }
    console.log('💾 ===========================================================');
    
    // Ejecutar el callback si existe
    if (route.params?.onSaveDeviceData) {
      route.params.onSaveDeviceData(deviceData);
      console.log('✅ Device data sent to callback');
      navigation.goBack();
    } else {
      console.warn('⚠️ No callback found for onSaveDeviceData');
      navigation.goBack();
    }
  };

  // Constantes para el diseño
  const CONFIG = {
    ICON: {
      NAME: "link",
      SIZE: 20,
      COLOR: "#ffffff",
    },
    ICON_DEL: {
      NAME: "link",
      SIZE: 20,
      COLOR: "#ffffff",
    },
    COLORS: {
      PRIMARY: "#6366f1",
      PRIMARY_DARK: "#4f46e5",
      SECONDARY: "#8b5cf6",
      BACKGROUND: "#f8fafc",
      TEXT_PRIMARY: "#1e293b",
      TEXT_SECONDARY: "#64748b",
      BORDER: "#e2e8f0",
      SUCCESS: "#10b981",
    },
    SPACING: {
      SM: 8,
      MD: 12,
      LG: 10,
      XL: 20,
    },
    RADIUS: {
      SM: 8,
      MD: 12,
      LG: 16,
    },
  };

  // Styles mejorados con gradientes y sombras
  const styles2 = {
    container: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: CONFIG.COLORS.BACKGROUND,
      marginHorizontal: CONFIG.SPACING.MD,
      marginVertical: CONFIG.SPACING.SM,
      padding: CONFIG.SPACING.LG,
      borderRadius: CONFIG.RADIUS.LG,
      borderWidth: 1,
      borderColor: CONFIG.COLORS.BORDER,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
    },
    fiberThreadContainer: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",

      backgroundColor: "#ffffff",
      padding: CONFIG.SPACING.MD,
      borderRadius: CONFIG.RADIUS.MD,
      borderWidth: 1,
      borderColor: CONFIG.COLORS.BORDER,
    },
    sourceContainer: {
      borderLeftWidth: 4,
      borderLeftColor: CONFIG.COLORS.SUCCESS,
    },
    destinationContainer: {
      borderRightWidth: 4,
      borderRightColor: CONFIG.COLORS.PRIMARY,
    },
    fiberBadge: {
      backgroundColor: CONFIG.COLORS.PRIMARY,
      paddingHorizontal: CONFIG.SPACING.SM,
      paddingVertical: 4,
      borderRadius: CONFIG.RADIUS.SM,
      marginRight: CONFIG.SPACING.SM,
    },
    fiberLabel: {
      color: "#ffffff",
      fontSize: 10,
      fontWeight: "700",
      textTransform: "uppercase",
    },
    connectionInfo: {
      flex: 1,
    },
    fiberName: {
      fontSize: 14,
      fontWeight: "600",
      color: CONFIG.COLORS.TEXT_PRIMARY,
      marginBottom: 2,
    },
    threadContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    threadText: {
      fontSize: 12,
      color: CONFIG.COLORS.TEXT_SECONDARY,
      fontWeight: "500",
      marginLeft: 4,
    },
    arrowIcon: {},
    arrowIcon2: {
      marginRight: 8,
    },
    connectionCenter: {
      alignItems: "center",
      marginHorizontal: CONFIG.SPACING.MD,
    },
    iconContainer: {
      backgroundColor: CONFIG.COLORS.PRIMARY,
      width: 30,
      height: 30,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: CONFIG.COLORS.PRIMARY,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 4,
      zIndex: 2,
    },
    iconContainer2: {
      backgroundColor: "salmon",
      width: 30,
      height: 30,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: CONFIG.COLORS.PRIMARY,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 4,
      zIndex: 2,
    },
    connectionLine: {
      position: "absolute",
      top: "50%",
      left: "50%",
      width: 2,
      height: "200%",
      backgroundColor: CONFIG.COLORS.PRIMARY,
      opacity: 0.3,
      transform: [{ translateX: -1 }],
      zIndex: 1,
    },
  };

  const getContrastColor = (hexColor) => {
    // Si el color es muy claro, usar texto oscuro, sino claro
    const hex = hexColor.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Fórmula de luminancia relativa
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance > 0.5 ? "#000000" : "#FFFFFF";
  };

  // Componente para información de fibra con mejor diseño
  const FiberThreadInfo = ({
    fiberLabel,
    thread,
    buffer,
    direction = "source",
  }) => {
    const isSource = direction === "source";
    const bkColor = fiberColors12Hex[thread - 1].color;
    const textColor = getContrastColor(bkColor);
    return (
      <View>
        <View
          style={[
            styles2.fiberThreadContainer,
            isSource ? styles2.sourceContainer : styles2.destinationContainer,
          ]}
        >
          <View>
            <View style={{ flexDirection: "row", alignItems: "" }}>
              {isSource == false && (
                <Ionicons
                  name={"arrow-back"}
                  size={16}
                  color={CONFIG.COLORS.TEXT_SECONDARY}
                  style={styles2.arrowIcon2}
                />
              )}

              <View
                style={{
                  backgroundColor: bkColor,
                  paddingHorizontal: CONFIG.SPACING.SM,
                  paddingVertical: 4,
                  borderRadius: CONFIG.RADIUS.SM,
                  marginRight: CONFIG.SPACING.SM,
                }}
              >
                <Text
                  style={{
                    color: textColor,
                    fontSize: 10,
                    fontWeight: "700",
                    textTransform: "uppercase",
                  }}
                >
                  {t("threadShort")}{thread}
                </Text>
              </View>

              {isSource && (
                <Ionicons
                  name={"arrow-forward"}
                  size={16}
                  color={CONFIG.COLORS.TEXT_SECONDARY}
                  style={styles2.arrowIcon}
                />
              )}
            </View>

            <View style={{ marginTop: 10 }}>
              <View style={styles2.connectionInfo}>
                <View style={styles2.threadContainer}>
                  <Text style={styles2.threadText}>{t("fiberShort")} {fiberLabel}</Text>
                  {buffer != null && (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Ionicons
                        name={"caret-forward"}
                        size={16}
                        color={CONFIG.COLORS.TEXT_SECONDARY}
                      />
                      <Text style={styles2.threadText}>{t("bufferShort")} {buffer}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>
        </View>
        <View></View>
      </View>
    );
  };

  const handleSaveFusionLink = (link) => {
    let fusionLinks =
      nodeData.fusionLinks == undefined ? [] : nodeData.fusionLinks;

    const index = nodeData.fusionLinks.findIndex((x) => x.hash == link.hash);

    if (index == -1) {
      fusionLinks.push(link);
    } else {
      fusionLinks[index] = link;
    }

    const tmp = {
      ...nodeData,
      fusionLinks: fusionLinks,
    };

    setNodeData(tmp);
  };

  const buildThreads = (fiber, threads) => {
    let tmp = threads.filter((x) => x.active == true);

    let result = [];

    const links = deviceData.links || [];

    tmp.forEach((t) => {
      let found = false;
      const number = t.number;

      for (let i = 0; i < links.length; i++) {
        const lx = links[i].src;

        if (lx.fiberId == fiber.id || lx.bufferId == fiber.id) {
          if (lx.thread == number) {
            found = true;
            break;
          }
        }
      }

      if (!found) {
        result.push(t);
      }
    });

    return result.map((thread) => {
      return {
        ...thread,
        value: thread.number,
        label: `${t("thread")}-${thread.number}`,
      };
    });
  };

  const getFiberLabelFrom = (items, fiberId) => {
    for (let i = 0; i < items.length; i++) {
      const fiber = items[i];
      if (fiber.id == fiberId) {
        return fiber.label;
      }
    }
  };

  const getFiberLabel = (fiberId) => {
    for (let i = 0; i < fibersData.length; i++) {
      const fiber = fibersData[i];
      if (fiber.id == fiberId) {
        return fiber.label;
      } else {
        const label = getFiberLabelFrom(fiber.buffers, fiberId);
        if (label != undefined) return label;
      }
    }
  };

  const RenderLink = ({ port, enabled }) => {
    let link = null;
    if (
      deviceData != null &&
      deviceData.links != undefined &&
      deviceData.links != null
    ) {
      link = deviceData.links.find((x) => x.port == port);
    }

    let textColor = null;
    let prop = { ...styles.link };

    let fiberLabel = "Fibra";
    let bufferLabel = "Buffer";
    let bkColor = fiberColors12Hex[0];

    if (link != null) {
      // Verificar que thread sea válido antes de acceder al array
      const threadIndex = link.src.thread != null && link.src.thread > 0 ? link.src.thread - 1 : 0;
      const colorObj = fiberColors12Hex[threadIndex] || fiberColors12Hex[0];
      bkColor = colorObj.color;
      textColor = getContrastColor(bkColor);
      prop = { ...styles.link, color: textColor };
      fiberLabel = getFiberLabel(link.src.fiberId);
      bufferLabel = getFiberLabel(link.src.bufferId);
    }

    return (
      <View style={styles.row}>
        <Text style={enabled ? styles.enabledPort : styles.disabledPort}>
          {`${t("port")} - ${port}`}
        </Text>

        {link != null && (
          <View style={styles.row}>
            <Ionicons
              name="link"
              size={20}
              style={{ color: "#727272ff", margin: 10 }}
            />

            <View
              style={{
                backgroundColor: bkColor,
                paddingHorizontal: 2,
                paddingVertical: 2,
                borderRadius: 8,
                marginRight: 2,
              }}
            >
              <Text style={prop} color={textColor}>
                {`${t("threadShort")}${link.src.thread}`}
              </Text>
            </View>

            <Ionicons name={"caret-back"} size={16} color={"#a1a0a0ff"} />
            {link.src.bufferId != null && (
              <View style={styles.row}>
                <Text style={styles.link}>{`${t("bufferShort")} ${bufferLabel}`}</Text>

                <Ionicons name={"caret-back"} size={16} color={"#a1a0a0ff"} />
              </View>
            )}

            <Text style={styles.link}>{fiberLabel}</Text>
          </View>
        )}
      </View>
    );
  };

  const handleCloseModal = () => {
    setShowLinkSetupModal(false);

    // ✅ VALIDACIÓN: Solo guardar si hay fibra Y hilo seleccionados
    if (!srcLink.fiber || srcLink.thread == null) {
      console.log('⚠️ Link incompleto - no se guardará. Fiber:', srcLink.fiber?.label, 'Thread:', srcLink.thread);
      return;
    }

    let links = [];

    const src = {
      fiberId: srcLink.fiber.id,
      bufferId: srcLink.buffer,
      thread: srcLink.thread,
    };

    if (deviceData != null) {
      if (deviceData.links != undefined && deviceData.links != null) {
        links = deviceData.links;
      }

      let index = links.findIndex((x) => x.port == selectedPort);

      if (index == -1) {
        links.push({
          port: selectedPort,
          src: src,
        });
        
        console.log('📌 ==================== DEVICE LINK CREADO ====================');
        console.log('📌 Nodo:', node?.label);
        console.log('📌 Dispositivo:', deviceData?.label, deviceData?.description);
        console.log('📌 Puerto:', selectedPort);
        console.log('📌 Fibra ID:', srcLink.fiber?.id, '| Label:', srcLink.fiber?.label);
        console.log('📌 Buffer:', srcLink.buffer);
        console.log('📌 Hilo:', srcLink.thread);
        console.log('📌 Total links en dispositivo:', links.length);
        console.log('📌 ===========================================================');
      } else {
        links[index].src = src;
        console.log('📝 Device link actualizado en puerto:', selectedPort);
      }
    }

    setDeviceData({
      ...deviceData,
      links: links,
    });

    /**clear */
    setSrcLink({
      fiber: null,
      buffer: null,
      thread: null,
      threads: [],
    });
  };

  const handleSetupLink = (portNumber) => {
    console.log('🔧 Setup link for port:', portNumber);
    console.log('🔧 Available fibersData:', fibersData.length, fibersData);
    setSelectedPort(portNumber);
    setShowLinkSetupModal(true);
  };

  // � FUNCIÓN REFACTORIZADA: loadFibers - Reutilizable
  const loadFibersForPicker = React.useCallback(async () => {
    console.log('📋 Loading fibers for DeviceLinks picker...');
    let records = await getFibers(projectId, null);

    // Filtrar fibras según el tipo de nodo
    if (node) {
      // NORMALIZACIÓN DE IDs: Priorizar ID de BD, sino usar hash
      const normalizeId = (id, hash) => {
        return id !== undefined && id !== null ? id : hash;
      };
      
      const currentNodeId = normalizeId(node.id, node.hash);
      
      if (node.typeId === 4) {
        // UNIT: Solo mostrar la fibra DROP de esta UNIT específica
        console.log('🔷 DeviceLinks - UNIT Filter:', node.label, '| Node ID (normalized):', currentNodeId);
        console.log('🔷 Also checking for hash match:', node.hash);
        records = records.filter(f => {
          const fiberNodeId = normalizeId(f.nodeId, f.nodeHash);
          // Match by DB ID OR by hash (for fibers not yet saved with DB ID)
          const isUnitFiber = fiberNodeId === currentNodeId || f.nodeId === node.hash;
          if (!isUnitFiber && f.nodeId) {
            console.log(`  ❌ Rejecting fiber ${f.label} (nodeId: ${fiberNodeId} !== ${currentNodeId} AND nodeId !== ${node.hash})`);
          } else if (isUnitFiber) {
            console.log(`  ✅ Including fiber ${f.label} for UNIT (nodeId: ${fiberNodeId} OR ${f.nodeId} === ${node.hash})`);
          }
          return isUnitFiber;
        });
        console.log(`✅ DeviceLinks - Showing ${records.length} fiber(s) for this UNIT`);
      } else if (node.typeId === 1) {
        // MDF (typeId===1): Excluir TODAS las fibras DROP (nunca conexión directa MDF→UNIT)
        console.log('🔷 DeviceLinks - MDF Filter: Excluding DROP fibers');
        records = records.filter(f => {
          const isNotDropFiber = !f.nodeId;
          if (!isNotDropFiber) {
            console.log(`  ❌ Excluding DROP fiber: ${f.label}`);
          }
          return isNotDropFiber;
        });
        console.log(`✅ DeviceLinks - Showing ${records.length} main line fiber(s)`);
      } else {
        // IDF (typeId===2) y Pedestal (typeId===3): Mostrar TODAS las fibras (incluidas DROP para fusionar a UNITs)
        console.log('🔷 DeviceLinks - Pedestal/IDF Filter: Showing ALL fibers (main line + DROP)');
        console.log(`✅ DeviceLinks - Total ${records.length} fiber(s) available`);
      }
    }

    for (let i = 0; i < records.length; i++) {
      let buffers = [
        {
          ...records[i],
          value: records[i].id,
        },
      ];

      let children = await getFibers(projectId, records[i].id);

      children = children.map((b) => {
        return {
          ...b,
          value: b.id,
        };
      });

      buffers = [...buffers, ...children];

      let f = {
        ...records[i],
        buffers: buffers,
      };

      records[i] = f;
    }

    // 🔧 INTEGRACIÓN: Filtrar buffers consumidos dinámicamente
    // Obtener todos los nodos para revisar qué buffers fueron consumidos
    try {
      const allNodes = await getNodes(projectId);
      
      records = records.map((fiber) => {
        // Filtrar buffers que NO han sido consumidos en ningún nodo
        const visibleBuffers = fiber.buffers.filter((buffer) => {
          // Si es la fibra padre (sin parentId), no filtrar
          if (!buffer.parentId) return true;
          
          // Revisar si este buffer fue consumido en algún nodo
          const isConsumed = allNodes.some((node) => 
            isBufferConsumedInNode(buffer, node)
          );
          
          if (isConsumed) {
            console.log(`🔴 Buffer ${buffer.label} filtrado (consumido en nodo)`);
          }
          
          return !isConsumed;
        });
        
        return {
          ...fiber,
          buffers: visibleBuffers
        };
      });
      
      console.log(`✅ Buffers filtrados dinámicamente - Visibles: ${records.reduce((sum, f) => sum + f.buffers.length, 0)}`);
    } catch (err) {
      console.warn('⚠️ No se pudo cargar nodos para filtro de buffers:', err);
    }

    records = records.map((f) => {
      return {
        ...f,
        value: f.id != undefined ? f.id : f.hash,
        label: f.label, // Asegurar que tiene label para el picker
      };
    });
    console.log('🔷 Final fibersData for picker:', records.map(f => ({ label: f.label, value: f.value, buffers: f.buffers.length })));
    setFibersData(records);
    return records;
  }, [projectId, node, getFibers, getNodes]);

  // 🔄 FOCUS LISTENER: Recargar fibras cuando la pantalla vuelve a enfoque
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 DeviceLinks screen focused - reloading fibers');
      loadFibersForPicker();
      return () => {
        // Cleanup si es necesario
      };
    }, [loadFibersForPicker])
  );

  useEffect(() => {
    loadFibersForPicker()
      .then((fibers) => {})
      .catch((e) => {
        console.error(e);
      });

    if (device != undefined) setDeviceData(device);
  }, [projectId, node?.id, device?.hash, loadFibersForPicker]);
  
  // 🔄 REFRESH: Si el device recibido fue actualizado (nueva fibra creada), recargar fibras
  useEffect(() => {
    if (device != undefined) {
      setDeviceData(device);
    }
  }, [device?.links?.length]); // Recargar si cambió cantidad de links
  
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
          {t("Links")}
        </Text>

        <View style={{ flexDirection: "row" }}>
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
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <FlatList
            data={deviceData.ports}
            extraData={deviceData.links}
            keyExtractor={(item) => item.number}
            renderItem={({ item }) => (
              <View>
                <View style={styles.row}>
                  <RenderLink port={item.number} enabled={item.enabled} />

                  {/**Actions */}
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "flex-end",
                      gap: 8,
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => {
                        handleSetupLink(item.number);
                      }}
                    >
                      <Ionicons name="settings" size={24} color="#727272ff" />
                    </TouchableOpacity>
                    <TouchableOpacity>
                      <Ionicons name="trash" size={24} color="salmon" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          />
        </View>
      </ScrollView>

      {/**Link Modal */}
      <Modal
        visible={showLinkSetupModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLinkSetupModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t("setupLink")}</Text>

            <ScrollView style={styles.projectList}>
              <View>
                {/**Source */}
                <View>
                  <Text style={styles.label}>{t("Source")}</Text>
                  <TouchableOpacity
                    style={[styles.input, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
                    onPress={() => setShowFiberModal(true)}
                  >
                    <Text style={{ color: srcLink.fiber ? colors.text : colors.placeholder }}>
                      {srcLink.fiber ? srcLink.fiber.label : t('selectAnOption')}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color={colors.primary} />
                  </TouchableOpacity>

                  <PickerModal
                    visible={showFiberModal}
                    onClose={() => setShowFiberModal(false)}
                    onSelect={(value) => {
                      const fiber = fibersData.find((x) => x.value == value);
                      if (fiber != undefined) {
                        const tmp = {
                          ...srcLink,
                          fiber: fiber,
                          thread: null,
                          threads:
                            fiber.buffers.length <= 1
                              ? buildThreads(fiber, fiber.threads)
                              : [],
                        };
                        setSrcLink(tmp);
                      }
                      setShowFiberModal(false);
                    }}
                    items={fibersData}
                    selectedValue={srcLink.fiber?.value}
                    title={t("Source")}
                    isDarkMode={isDarkMode}
                    colors={colors}
                  />
                </View>

                {/**Source Buffer - Solo mostrar si hay múltiples buffers */}
                {srcLink.fiber != null && srcLink.fiber.buffers.length > 1 && (
                  <View>
                    <Text style={styles.label}>{t("Buffer")}</Text>
                    <TouchableOpacity
                      style={[styles.input, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
                      onPress={() => setShowBufferModal(true)}
                    >
                      <Text style={{ color: srcLink.buffer ? colors.text : colors.placeholder }}>
                        {srcLink.buffer 
                          ? (srcLink.fiber.buffers.find(b => b.value === srcLink.buffer)?.label || t('selectAnOption'))
                          : t('selectAnOption')}
                      </Text>
                      <Ionicons name="chevron-down" size={20} color={colors.primary} />
                    </TouchableOpacity>

                    <PickerModal
                      visible={showBufferModal}
                      onClose={() => setShowBufferModal(false)}
                      onSelect={(value) => {
                        const buffer = srcLink.fiber.buffers.find(
                          (x) => x.value == value
                        );
                        const tmp = {
                          ...srcLink,
                          buffer: value,
                          bufferLabel: buffer.label,
                          threads: buildThreads(buffer, buffer.threads),
                        };
                        setSrcLink(tmp);
                        setShowBufferModal(false);
                      }}
                      items={srcLink.fiber.buffers}
                      selectedValue={srcLink.buffer}
                      title={t("Buffer")}
                      isDarkMode={isDarkMode}
                      colors={colors}
                    />
                  </View>
                )}

                {/** LINK */}
                <Text style={styles.label}>{t("Thread")}</Text>

                <View style={styles.formCard}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <TouchableOpacity
                      style={[styles.input, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
                      onPress={() => setShowThreadModal(true)}
                    >
                      <Text style={{ color: srcLink.thread ? colors.text : colors.placeholder }}>
                        {srcLink.thread ? `${t("thread")}-${srcLink.thread}` : t('selectAnOption')}
                      </Text>
                      <Ionicons name="chevron-down" size={20} color={colors.primary} />
                    </TouchableOpacity>

                    <PickerModal
                      visible={showThreadModal}
                      onClose={() => setShowThreadModal(false)}
                      onSelect={(value) => {
                        setSrcLink({
                          ...srcLink,
                          thread: value,
                        });
                        setShowThreadModal(false);
                      }}
                      items={srcLink.threads}
                      selectedValue={srcLink.thread}
                      title={t("Thread")}
                      isDarkMode={isDarkMode}
                      colors={colors}
                    />
                  </View>
                </View>
              </View>
            </ScrollView>

            <Button
              title={"ok"}
              color={colors.primary}
              onPress={() => handleCloseModal()}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default DeviceLinks;
