// components/DetallesProyecto.js
import React, { useState, useEffect, useRef } from "react";

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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../context/AppContext";
import { useTranslation } from "../hooks/useTranslation";
import { useDevice } from "../context/DeviceContext";
import { useAdapter } from "@/api/contexts/DatabaseContext";

import { v4 as uuidv4 } from "uuid";
import RNPickerSelect from "react-native-picker-select";

import { useFiberPath, formatPathForDisplay } from '../hooks/useFiberPath'
import TimelineVertical from "@/utils/TimelineVertical";

const NodePath = ({ route, navigation }) => {


  const { updateNode } = useAdapter()();

  const { topInset, bottomInset, stylesFull } = useDevice();
  const { isDarkMode } = useApp();
  const { t } = useTranslation();
  const { node } = route.params;
  const { mdf } = route.params;
  const { nodes } = route.params;
  const { fibers } = route.params;
  const { devices } = node;

  const { findPath } = useFiberPath(nodes, fibers);

  const [nodeData, setNodeData] = React.useState(node);
  const [devicesData, setDevicesData] = React.useState(devices);

  const [showFusionModal, setShowFusionModal] = useState(true);
  const [fibersData, setFibersData] = useState([]);

  const [srcLink, setSrcLink] = useState(null);
  const [dstLink, setDstLink] = useState(null);
  const [finalPath, setFinalPath] = useState(null);

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
    // Ejecutar el callback si existe
    if (route.params?.onSaveNode) {
      const upd = {
        ...nodeData,
        devices: nodeData.devices,
        fusionLinks: nodeData.fusionLinks,
      };

      route.params.onSaveNode(upd);

      //if (node.id != undefined) {
      // const upd = {
      //   ...nodeData,
      //   metadata: JSON.stringify(meta),
      // };

      // updateNode(node.id, upd)
      //   .then((r) => {
      //     navigation.goBack();
      //   })
      //   .catch((e) => {});

      //route.params.onSaveNode(meta);
      //}

      navigation.goBack();
    } else {
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


  /************ */
  const RenderItem = ({ item }) => {

    return (
      <View style={{ flexDirection: 'row' }}>
        <View style={{ flexDirection: 'col' }}>
          <View style={{ width: 5, height: 5, backgroundColor: 'red' }}>

          </View>
        </View>
      </View>
    )
  }
  // Renderiza un solo camino usando el timeline
  const RenderPath = ({ pathData, pathIndex }) => {
    if (!pathData || !pathData.path) return null;

    // Convertir formato de pathData a formato para TimelineVertical
    const timelineData = pathData.path.map((step, idx) => {
      if (step.type === 'device-link') {
        return {
          title: `${step.from.nodeLabel} → ${step.to.nodeLabel}`,
          description: `${step.from.deviceLabel} (Puerto ${step.from.port}) ➜ Fibra ${step.through.fiberLabel} Hilo ${step.through.thread} ➜ ${step.to.deviceLabel} (Puerto ${step.to.port})`,
          date: `Salto ${idx + 1}`,
          status: idx === 0 ? 'completed' : (idx < pathData.path.length - 1 ? 'current' : 'pending'),
          color: step.through.threadColor
        };
      } else if (step.type === 'device-to-fusion-to-device') {
        // Camino completo a través de fusión
        return {
          title: `${step.from.nodeLabel} → [Fusión] → ${step.to.nodeLabel}`,
          description: `${step.from.deviceLabel} (Puerto ${step.from.port}) ➜ ${step.throughFusion.entryFiberLabel}:${step.throughFusion.entryThread} ⚡ Fusión en ${step.throughFusion.fusionNodeLabel} ⚡ ${step.throughFusion.exitFiberLabel}:${step.throughFusion.exitThread} ➜ ${step.to.deviceLabel} (Puerto ${step.to.port})`,
          date: `Salto ${idx + 1}`,
          status: idx === 0 ? 'completed' : (idx < pathData.path.length - 1 ? 'current' : 'pending'),
          color: step.throughFusion.entryColor
        };
      } else {
        // Fusion link directo
        return {
          title: `Fusión en ${step.from.nodeLabel}`,
          description: `${step.through.fusionSrc.fiberLabel}:${step.through.fusionSrc.thread} ↔ ${step.through.fusionDst.fiberLabel}:${step.through.fusionDst.thread} ➜ ${step.to.nodeLabel}`,
          date: `Salto ${idx + 1}`,
          status: idx === 0 ? 'completed' : (idx < pathData.path.length - 1 ? 'current' : 'pending'),
          color: step.through.fusionSrc.threadColor
        };
      }
    });

    // Custom renderer para el contenido del timeline
    const renderCustomContent = (item, index) => {
      return (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 4, color: colors.text }}>
            {item.title}
          </Text>
          <Text style={{ fontSize: 14, color: colors.subText, lineHeight: 20 }}>
            {item.description}
          </Text>
          <Text style={{ fontSize: 12, color: colors.subText, marginTop: 4 }}>
            {item.date}
          </Text>
        </View>
      );
    };

    return (
      <View style={{ marginBottom: 20 }}>
        <Text style={[styles.sectionTitle, { fontSize: 16, color: colors.success }]}>
          Camino {pathIndex + 1} - {pathData.hops} saltos
        </Text>
        <TimelineVertical
          data={timelineData}
          circleColor={colors.primary}
          lineColor="#E5E5EA"
          renderCustomContent={renderCustomContent}
        />
      </View>
    );
  };

  // Renderiza TODOS los caminos encontrados
  const RenderAllPaths = () => {
    if (!finalPath) {
      return (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text style={{ color: colors.subText }}>Buscando rutas...</Text>
        </View>
      );
    }

    if (!finalPath.success) {
      return (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Ionicons name="alert-circle" size={48} color={colors.warning} />
          <Text style={[styles.sectionTitle, { marginTop: 10, color: colors.danger }]}>
            No se encontraron rutas
          </Text>
          <Text style={{ color: colors.subText, textAlign: 'center', marginTop: 10 }}>
            {finalPath.error || 'No hay conexión entre estos nodos'}
          </Text>
        </View>
      );
    }

    return (
      <View>
        <View style={{ 
          backgroundColor: colors.success, 
          padding: 15, 
          borderRadius: 10, 
          marginBottom: 20,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <View>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
              ✓ {finalPath.totalPaths} Camino{finalPath.totalPaths > 1 ? 's' : ''} Encontrado{finalPath.totalPaths > 1 ? 's' : ''}
            </Text>
            <Text style={{ color: '#fff', fontSize: 14, marginTop: 5 }}>
              Ruta más corta: {finalPath.shortestPath.hops} saltos
            </Text>
          </View>
          <Ionicons name="checkmark-circle" size={40} color="#fff" />
        </View>

        {finalPath.paths.map((pathData, index) => (
          <RenderPath key={index} pathData={pathData} pathIndex={index} />
        ))}
      </View>
    );
  };

  useEffect(() => {
    const compute = async () => {
      const sourceId = node.id || node.hash;
      const destId = mdf.id || mdf.hash;
      
      console.log('🚀 ==================== INICIANDO BÚSQUEDA DE RUTA ====================');
      console.log('🚀 Desde:', node?.label, '(ID:', sourceId, ')');
      console.log('🚀 Hasta:', mdf?.label, '(ID:', destId, ')');
      console.log('🚀 Total nodos en grafo:', nodes?.length || 0);
      console.log('🚀 Total fibras:', fibers?.length || 0);
      console.log('🚀 ====================================================================');
      
      const result = findPath(sourceId, destId);
      
      if (result.success) {
        console.log('🎉 ==================== RUTA ENCONTRADA ====================');
        console.log('🎉 Total caminos:', result.totalPaths || 1);
        console.log('🎉 Saltos:', result.paths?.[0]?.hops || result.totalHops || 0);
        console.log('🎉 ===========================================================');
      } else {
        console.log('❌ ==================== NO SE ENCONTRÓ RUTA ====================');
        console.log('❌ Error:', result.error);
        console.log('❌ ===============================================================');
      }
      
      console.log('🛤️ Resultado pathfinding completo:', result);
      setFinalPath(result);
    };

    compute();
  }, []);


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
          {t("nodePath")}
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
        {/* Información del nodo */}
        <View style={[styles.card, { marginBottom: 20 }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            Rutas del Nodo al MDF
          </Text>
          <View style={styles.detailRow}>
            <Ionicons name="location" size={20} color={colors.primary} />
            <Text style={styles.detailLabel}>Origen:</Text>
            <Text style={styles.detailValue}>{node.label}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="server" size={20} color={colors.success} />
            <Text style={styles.detailLabel}>Destino:</Text>
            <Text style={styles.detailValue}>{mdf.label}</Text>
          </View>
        </View>

        {/* Mostrar todos los caminos */}
        <View style={styles.section}>
          <RenderAllPaths />
        </View>
      </ScrollView>
    </View>
  );
};

export default NodePath;
