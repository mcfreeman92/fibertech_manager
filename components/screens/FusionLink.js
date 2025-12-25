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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../context/AppContext";
import { useTranslation } from "../hooks/useTranslation";
import { useDevice } from "../context/DeviceContext";
import { useAdapter } from "@/api/contexts/DatabaseContext";
import PickerModal from "../context/PickerModal";

import { v4 as uuidv4 } from "uuid";
import { deleteData } from "@/service/database";
import { isBufferConsumedInNode } from "@/utils/bufferVisibilityManager";

const FusionLink = ({ route, navigation }) => {
  const { getFibers, getFiberById, getNodes } = useAdapter()();

  const { topInset, bottomInset, stylesFull } = useDevice();
  const { isDarkMode, language } = useApp();
  const { t } = useTranslation();

  const { projectId } = route.params;
  const { link } = route.params;
  const { linkHash } = route.params;
  const { node } = route.params;

  const [showFusionModal, setShowFusionModal] = useState(true);
  const [fibersData, setFibersData] = useState([]);

  // Modal states for 6 pickers
  const [showSrcFiberModal, setShowSrcFiberModal] = useState(false);
  const [showSrcBufferModal, setShowSrcBufferModal] = useState(false);
  const [showSrcThreadModal, setShowSrcThreadModal] = useState(false);
  const [showDstFiberModal, setShowDstFiberModal] = useState(false);
  const [showDstBufferModal, setShowDstBufferModal] = useState(false);
  const [showDstThreadModal, setShowDstThreadModal] = useState(false);

  const [srcLink, setSrcLink] = useState({
    fiber: null,
    buffer: null,
    thread: null,
    threads: [],
  });
  const [dstLink, setDstLink] = useState({
    fiber: null,
    buffer: null,
    thread: null,
    threads: [],
  });

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
    cardBackground: isDarkMode ? "#1e1e1e" : "#f6f1f1be",
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
      marginBottom: 25,
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
    formCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 14,
      padding: 10,
      shadowColor: "#000",
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

  const pickerSelectStyles = StyleSheet.create({
    inputWeb: {
      fontSize: 16,
      paddingVertical: 15,
      paddingHorizontal: 8,
      borderWidth: 2,
      borderColor: "#E5E7EB",
      borderRadius: 12,
      color: "#1F2937",
      backgroundColor: "#F9FAFB",
      paddingRight: 10,
      marginVertical: 8,
      cursor: "pointer",
    },
    inputIOS: {
      fontSize: 16,
      paddingVertical: 15,
      paddingHorizontal: 20,
      borderWidth: 2,
      borderColor: "#E5E7EB",
      borderRadius: 12,
      color: "#1F2937",
      backgroundColor: "#F9FAFB",
      paddingRight: 50,
      marginVertical: 8,
      shadowColor: "#000",
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
      borderColor: "#E5E7EB",
      borderRadius: 12,
      color: "#1F2937",
      backgroundColor: "#197ee2ff",
      paddingRight: 50,
      marginVertical: 8,
      elevation: 3,
    },
    placeholder: {
      color: "#6B7280",
    },
    iconContainer: {
      top: 18,
      right: 15,
    },
  });

  const pickerButtonStyles = StyleSheet.create({
    pickerButton: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.inputBackground,
      marginVertical: 8,
    },
    pickerButtonText: {
      fontSize: 14,
      color: colors.text,
      flex: 1,
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

  const saveAndGoBack = () => {
    let result = {
      src: {
        fiberId: srcLink.fiber.id,
        fiberLabel: srcLink.fiber.label,
        bufferId: srcLink.buffer != null ? srcLink.buffer : null,
        bufferLabel:
          srcLink.bufferLabel != undefined ? srcLink.bufferLabel : null,
        thread: srcLink.thread - 1,
      },
      dst: {
        fiberId: dstLink.fiber.id,
        fiberLabel: dstLink.fiber.label,
        bufferId: dstLink.buffer != null ? dstLink.buffer : null,
        bufferLabel:
          dstLink.bufferLabel != undefined ? dstLink.bufferLabel : null,
        thread: dstLink.thread - 1,
      },
      deleted: false,
    };

    if (link == undefined) result.hash = linkHash;
    else result.hash = link.hash;

    console.log('🔗 ==================== GUARDANDO FUSION ====================');
    console.log('🔗 Nodo:', node?.label, '(ID:', node?.id, ')');
    console.log('🔗 SRC:');
    console.log('🔗   Fibra ID:', srcLink.fiber?.id, '| Label:', srcLink.fiber?.label);
    console.log('🔗   Buffer:', srcLink.buffer);
    console.log('🔗   Hilo:', srcLink.thread - 1, '(mostrado como:', srcLink.thread, ')');
    console.log('🔗 DST:');
    console.log('🔗   Fibra ID:', dstLink.fiber?.id, '| Label:', dstLink.fiber?.label);
    console.log('🔗   Buffer:', dstLink.buffer);
    console.log('🔗   Hilo:', dstLink.thread - 1, '(mostrado como:', dstLink.thread, ')');
    console.log('🔗 ===========================================================');

    route.params.onSaveFusionLink(result);
    navigation.goBack();
  };

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
    const hex = hexColor.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Fórmula de luminancia relativa
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance > 0.5 ? "#000000" : "#FFFFFF";
  };

  const RenderThread = ({ item }) => {
    const textColor = getContrastColor(item.color);

    return (
      <View
        style={{
          backgroundColor: item.color,
          paddingLeft: 8,
          paddingRight: 8,
          margin: 2,
          borderWidth: 1,
          borderColor: "#e9ecef",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 2,
          borderRadius: 5,
        }}
      >
        <Text
          style={[
            item.active ? styles.enabledPort : styles.disabledPort,
            { color: textColor },
          ]}
        >
          {`${t("port")} - ${item.number}`}
        </Text>
      </View>
    );
  };

  // 📋 FUNCIÓN REFACTORIZADA: loadFibers - Reutilizable
  const loadFibersForPicker = React.useCallback(async () => {
    console.log('📋 Loading fibers for FusionLink picker...');
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
        console.log('🔷 FusionLink - UNIT Filter:', node.label, '| Node ID (normalized):', currentNodeId);
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
        console.log(`✅ FusionLink - Showing ${records.length} fiber(s) for this UNIT`);
      } else if (node.typeId === 1) {
        // MDF (typeId===1): Excluir TODAS las fibras DROP (nunca conexión directa MDF→UNIT)
        console.log('🔷 FusionLink - MDF Filter: Excluding DROP fibers');
        records = records.filter(f => {
          const isNotDropFiber = !f.nodeId;
          if (!isNotDropFiber) {
            console.log(`  ❌ Excluding DROP fiber: ${f.label}`);
          }
          return isNotDropFiber;
        });
        console.log(`✅ FusionLink - Showing ${records.length} main line fiber(s)`);
      } else {
        // IDF (typeId===2) y Pedestal (typeId===3): Mostrar TODAS las fibras (incluidas DROP para fusionar a UNITs)
        console.log('🔷 FusionLink - Pedestal/IDF Filter: Showing ALL fibers (main line + DROP)');
        console.log(`✅ FusionLink - Total ${records.length} fiber(s) available`);
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
    console.log('🔷 FusionLink - Final fibersData for picker:', records.map(f => ({ label: f.label, value: f.value })));
    setFibersData(records);
    return records;
  }, [projectId, node, getFibers, getNodes, t]);

  // 🔄 FOCUS LISTENER: Recargar fibras cuando la pantalla vuelve a enfoque
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 FusionLink screen focused - reloading fibers');
      loadFibersForPicker();
      return () => {
        // Cleanup si es necesario
      };
    }, [loadFibersForPicker])
  );

  useEffect(() => {
    loadFibersForPicker()
      .then((fibers) => {
        if (link != undefined) {
          const srcFiber = fibers.find((x) => x.id == link.src.fiberId);
          const srcBufer = srcFiber.buffers.find(
            (x) => x.id == link.src.bufferId
          );
          const srcHilos =
            srcBufer == undefined ? srcFiber.threads : srcBufer.threads;

          const src = {
            fiber: srcFiber,
            buffer: srcBufer,
            thread: link.src.thread,
            threads: srcHilos.map((x) => {
              return {
                ...x,
                value: x.number,
                label: `${t("thread")}-${x.number}`,
              };
            }),
          };

          setSrcLink(src);

          const dstFiber = fibers.find((x) => x.id == link.dst.fiberId);
          const dstBufer = dstFiber.buffers.find(
            (x) => x.id == link.dst.bufferId
          );
          const dstHilos =
            dstBufer == undefined ? dstFiber.threads : dstBufer.threads;

          const dst = {
            fiber: dstFiber,
            buffer: dstBufer,
            thread: link.dst.thread,
            threads: dstHilos.map((x) => {
              return {
                ...x,
                value: x.number,
                label: `${t("thread")}-${x.number}`,
              };
            }),
          };

          setDstLink(dst);
        }
      })
      .catch((e) => {
        console.error(e);
      });
  }, [projectId, node?.id, link, t, loadFibersForPicker]);

  const buildThreads = (fiber, threads, isSource) => {
    let tmp = threads.filter((x) => x.active == true && x.inUse == false);

    let result = [];

    const links = node.fusionLinks || [];

    tmp.forEach((t) => {
      let found = false;
      const number = t.number - 1;

      for (let i = 0; i < links.length; i++) {
          // CRÍTICO: Buscar en AMBOS lados de la fusión, no solo en el lado especificado
          // Esto evita crear fusiones duplicadas independiente de la dirección
          const src = links[i].src;
          const dst = links[i].dst;

          // Verificar si este hilo está en el lado SRC
          const inSrc = (src?.fiberId === fiber.id || src?.bufferId === fiber.id) && src?.thread === number;
          
          // Verificar si este hilo está en el lado DST
          const inDst = (dst?.fiberId === fiber.id || dst?.bufferId === fiber.id) && dst?.thread === number;

          // Si el hilo está en CUALQUIERA de los dos lados, marcarlo como usado
          if (inSrc || inDst) {
            found = true;
            console.log(`🔗 Hilo ${number + 1} de ${fiber.label} ya está en uso en fusión`);
            break;
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
          {t("fusionLink")}
        </Text>

        <View style={{ flexDirection: "row" }}>
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
          <Text style={styles.label}>{t("Source")}</Text>
          <TouchableOpacity
            style={pickerButtonStyles.pickerButton}
            onPress={() => setShowSrcFiberModal(true)}
          >
            <Text style={pickerButtonStyles.pickerButtonText}>
              {srcLink.fiber ? srcLink.fiber.label : t("selectAnOption")}
            </Text>
            <Ionicons name="chevron-down" size={20} color={colors.primary} />
          </TouchableOpacity>
          <PickerModal
            visible={showSrcFiberModal}
            onClose={() => setShowSrcFiberModal(false)}
            onSelect={(value) => {
              const fiber = fibersData.find((x) => x.value == value);

              if (fiber != null) {
                const tmp = {
                  ...srcLink,
                  fiber: fiber,
                  thread: null,
                  threads:
                    fiber.buffers.length == 1
                      ? buildThreads(fiber, fiber.threads, true)
                      : [],
                };

                setSrcLink(tmp);
              }
              setShowSrcFiberModal(false);
            }}
            items={fibersData}
            selectedValue={srcLink.fiber ? srcLink.fiber.value : null}
            title={t("Source")}
            isDarkMode={isDarkMode}
            colors={colors}
          />
        </View>

        {/**Source Buffer*/}
        {srcLink.fiber != null && srcLink.fiber.buffers.length > 1 && (
          <View>
            <Text style={styles.label}>{t("Buffer")}</Text>
            <TouchableOpacity
              style={pickerButtonStyles.pickerButton}
              onPress={() => setShowSrcBufferModal(true)}
            >
              <Text style={pickerButtonStyles.pickerButtonText}>
                {srcLink.buffer ? (srcLink.bufferLabel || srcLink.buffer.label) : t("selectAnOption")}
              </Text>
              <Ionicons name="chevron-down" size={20} color={colors.primary} />
            </TouchableOpacity>
            <PickerModal
              visible={showSrcBufferModal}
              onClose={() => setShowSrcBufferModal(false)}
              onSelect={(value) => {
                const buffer = srcLink.fiber.buffers.find(
                  (x) => x.value == value
                );

                const tmp = {
                  ...srcLink,
                  buffer: value,
                  bufferLabel: buffer.label,
                  threads: buildThreads(buffer, buffer.threads, true),
                };
                setSrcLink(tmp);
                setShowSrcBufferModal(false);
              }}
              items={srcLink.fiber.buffers}
              selectedValue={srcLink.buffer}
              title={t("Buffer")}
              isDarkMode={isDarkMode}
              colors={colors}
            />
          </View>
        )}

        {/**Destiny */}
        <View>
          <Text style={styles.label}>{t("Destiny")}</Text>
          <TouchableOpacity
            style={pickerButtonStyles.pickerButton}
            onPress={() => setShowDstFiberModal(true)}
          >
            <Text style={pickerButtonStyles.pickerButtonText}>
              {dstLink.fiber ? dstLink.fiber.label : t("selectAnOption")}
            </Text>
            <Ionicons name="chevron-down" size={20} color={colors.primary} />
          </TouchableOpacity>
          <PickerModal
            visible={showDstFiberModal}
            onClose={() => setShowDstFiberModal(false)}
            onSelect={(value) => {
              const fiber = fibersData.find((x) => x.value == value);

              if (fiber != null) {
                const tmp = {
                  ...dstLink,
                  fiber: fiber,
                  thread: null,
                  threads:
                    fiber.buffers.length == 1
                      ? buildThreads(fiber, fiber.threads, false)
                      : [],
                };

                setDstLink(tmp);
              }
              setShowDstFiberModal(false);
            }}
            items={fibersData}
            selectedValue={dstLink.fiber ? dstLink.fiber.value : null}
            title={t("Destiny")}
            isDarkMode={isDarkMode}
            colors={colors}
          />
        </View>

        {/**Destiny Buffer*/}
        {dstLink.fiber != null && dstLink.fiber.buffers.length > 1 && (
          <View>
            <Text style={styles.label}>{t("Buffer")}</Text>
            <TouchableOpacity
              style={pickerButtonStyles.pickerButton}
              onPress={() => setShowDstBufferModal(true)}
            >
              <Text style={pickerButtonStyles.pickerButtonText}>
                {dstLink.buffer ? (dstLink.bufferLabel || dstLink.buffer.label) : t("selectAnOption")}
              </Text>
              <Ionicons name="chevron-down" size={20} color={colors.primary} />
            </TouchableOpacity>
            <PickerModal
              visible={showDstBufferModal}
              onClose={() => setShowDstBufferModal(false)}
              onSelect={(value) => {
                const buffer = dstLink.fiber.buffers.find(
                  (x) => x.value == value
                );

                const tmp = {
                  ...dstLink,
                  buffer: value,
                  bufferLabel: buffer.label,
                  threads: buildThreads(buffer, buffer.threads, false),
                };
                setDstLink(tmp);
                setShowDstBufferModal(false);
              }}
              items={dstLink.fiber.buffers}
              selectedValue={dstLink.buffer}
              title={t("Buffer")}
              isDarkMode={isDarkMode}
              colors={colors}
            />
          </View>
        )}

        {/** LINK */}
        <Text style={styles.label}>{t("Link")}</Text>

        <View style={styles.formCard}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View style={{ flex: 1, marginRight: 8 }}>
              <TouchableOpacity
                style={pickerButtonStyles.pickerButton}
                onPress={() => setShowSrcThreadModal(true)}
              >
                <Text style={pickerButtonStyles.pickerButtonText}>
                  {srcLink.thread ? srcLink.thread : t("selectAnOption")}
                </Text>
                <Ionicons name="chevron-down" size={20} color={colors.primary} />
              </TouchableOpacity>
              <PickerModal
                visible={showSrcThreadModal}
                onClose={() => setShowSrcThreadModal(false)}
                onSelect={(value) => {
                  const tmp = {
                    ...srcLink,
                    thread: value,
                  };
                  setSrcLink(tmp);
                  setShowSrcThreadModal(false);
                }}
                items={srcLink.threads}
                selectedValue={srcLink.thread}
                title={t("Link")}
                isDarkMode={isDarkMode}
                colors={colors}
              />
            </View>

            <View style={{ padding: 2 }}>
              <Ionicons name="link" size={24} color="#666261ff" />
            </View>

            <View style={{ flex: 1, marginLeft: 8 }}>
              <TouchableOpacity
                style={pickerButtonStyles.pickerButton}
                onPress={() => setShowDstThreadModal(true)}
              >
                <Text style={pickerButtonStyles.pickerButtonText}>
                  {dstLink.thread ? dstLink.thread : t("selectAnOption")}
                </Text>
                <Ionicons name="chevron-down" size={20} color={colors.primary} />
              </TouchableOpacity>
              <PickerModal
                visible={showDstThreadModal}
                onClose={() => setShowDstThreadModal(false)}
                onSelect={(value) => {
                  const tmp = {
                    ...dstLink,
                    thread: value,
                  };
                  setDstLink(tmp);
                  setShowDstThreadModal(false);
                }}
                items={dstLink.threads}
                selectedValue={dstLink.thread}
                title={t("Link")}
                isDarkMode={isDarkMode}
                colors={colors}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default FusionLink;
