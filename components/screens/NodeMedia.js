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
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../context/AppContext";
import { useTranslation } from "../hooks/useTranslation";
import { useDevice } from "../context/DeviceContext";
import { useAdapter } from "@/api/contexts/DatabaseContext";

import { v4 as uuidv4 } from "uuid";
import RNPickerSelect from "react-native-picker-select";

import { useFiberPath, formatPathForDisplay } from "../hooks/useFiberPath";
import TimelineVertical from "@/utils/TimelineVertical";
import { Button, Input } from "native-base";

const NodeMedia = ({ route, navigation }) => {
  const { updateNode } = useAdapter()();

  const { topInset, bottomInset, stylesFull } = useDevice();
  const { isDarkMode } = useApp();
  const { t } = useTranslation();
  const { nodeId } = route.params;
  const { nodeHash } = route.params;
  const { media } = route.params;

  const [showAttachModal, setShowAttachModal] = useState(false);

  const [selectedMedia, setSelectedMedia] = useState(null);
  const [mediaData, setMediaData] = useState(media);

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
    textArea: {
      height: 70,
      textAlignVertical: "top",
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
    listContainer: {
      flexGrow: 1,
      padding: 10,
    },
    list: {
      flex: 1,
    },
    itemContainer: {
      backgroundColor: "#fff",
      borderRadius: 12,
      marginBottom: 10,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
      borderWidth: 1,
      borderColor: "#f0f0f0",
      position: "relative", // Para posicionar el botón de eliminar
    },
    itemContent: {
      flexDirection: "row",
      padding: 12,
    },
    deleteButton: {
      position: "absolute",
      top: -8,
      right: -8,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: "#ff4444",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 10,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 3,
      borderWidth: 2,
      borderColor: "#fff",
    },
    deleteButtonText: {
      color: "#fff",
      fontSize: 18,
      fontWeight: "bold",
      lineHeight: 20,
      marginTop: -1,
    },
    previewContainer: {
      width: 80,
      height: 80,
      borderRadius: 8,
      overflow: "hidden",
      marginRight: 12,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#f8f8f8",
    },
    imagePreview: {
      width: "100%",
      height: "100%",
    },
    errorPreview: {
      width: "100%",
      height: "100%",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#ffebee",
    },
    errorIcon: {
      fontSize: 20,
      marginBottom: 4,
    },
    errorText: {
      fontSize: 10,
      color: "#d32f2f",
      fontWeight: "bold",
    },
    videoPreview: {
      width: "100%",
      height: "100%",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#ffebee",
    },
    documentPreview: {
      width: "100%",
      height: "100%",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#e8f5e8",
    },
    unknownPreview: {
      width: "100%",
      height: "100%",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#f5f5f5",
    },
    videoIcon: {
      fontSize: 24,
      marginBottom: 4,
    },
    documentIcon: {
      fontSize: 24,
      marginBottom: 4,
    },
    unknownIcon: {
      fontSize: 24,
      marginBottom: 4,
    },
    videoText: {
      fontSize: 10,
      fontWeight: "bold",
      color: "#d32f2f",
    },
    documentText: {
      fontSize: 10,
      fontWeight: "bold",
      color: "#388e3c",
    },
    unknownText: {
      fontSize: 10,
      fontWeight: "bold",
      color: "#757575",
    },
    infoContainer: {
      flex: 1,
      justifyContent: "space-between",
    },
    label: {
      fontSize: 16,
      fontWeight: "bold",
      color: "#333",
      marginBottom: 4,
      paddingVertical: 10,
    },
    type: {
      fontSize: 12,
      color: "#666",
      marginBottom: 4,
    },
    comment: {
      fontSize: 12,
      color: "#888",
      fontStyle: "italic",
      marginBottom: 4,
    },
    dataSize: {
      fontSize: 11,
      color: "#999",
    },
    typeIndicator: {
      position: "absolute",
      top: 8,
      right: 8,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    imageIndicator: {
      backgroundColor: "#4caf50",
    },
    videoIndicator: {
      backgroundColor: "#f44336",
    },
    documentIndicator: {
      backgroundColor: "#2196f3",
    },
    typeIndicatorText: {
      fontSize: 10,
      fontWeight: "bold",
      color: "#fff",
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 60,
    },
    emptyIcon: {
      fontSize: 64,
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#666",
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 14,
      color: "#999",
      textAlign: "center",
      paddingHorizontal: 20,
    },
  });

  const handleSave = () => {
    // Ejecutar el callback si existe
    if (route.params?.onSaveNodeMedia) {
      const upd = {
        nodeId: nodeId,
        nodeHash: nodeHash,
        media: mediaData,
      };

      route.params.onSaveNodeMedia(upd);
      navigation.goBack();
    } else {
      navigation.goBack();
    }
  };

  const onItemPress = (item, index) => {
    setSelectedMedia(item);
    setShowAttachModal(true);
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

  const handleApplyChanges = () => {
    let index = -1;
    if (selectedMedia.id != undefined)
      index = media.findIndex((x) => x.id == selectedMedia.id);
    else if (selectedMedia.hash != undefined)
      index = media.findIndex((x) => x.hash == selectedMedia.hash);

    if (index != -1) {
      let upd = [...mediaData];
      upd[index] = selectedMedia;
      setMediaData(upd);
      setShowAttachModal(false);
    }
  };

  const handleDelete = (item, index) => {
    if (index != -1) {
      let upd = [...mediaData];
      upd[index] = {
        ...mediaData[index],
        deleted : true
      };
      setMediaData(upd);
    }
  };

  // Función para renderizar cada item según su tipo
  const renderMediaItem = ({ item, index }) => {
    const { type, data, label, comment } = item;

    const handlePress = () => {
      if (onItemPress) {
        onItemPress(item, index);
      }
    };

    const handleLongPress = () => {
      Alert.alert("Opciones", `Archivo: ${label || "Sin nombre"}`, [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => onDeleteItem && onDeleteItem(item.id || index),
        },
      ]);
    };

    return (
      <View style={styles.itemContainer}>
        {/* Botón de eliminar - X en la esquina superior derecha */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item, index)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.deleteButtonText}>×</Text>
        </TouchableOpacity>

        <TouchableWithoutFeedback
          onPress={handlePress}
          onLongPress={handleLongPress}
        >
          <View style={styles.itemContent}>
            {/* Vista previa según el tipo */}
            <View style={styles.previewContainer}>
              {type === "image" && data ? (
                <Image
                  source={{ uri: `data:image/jpeg;base64,${data}` }}
                  style={styles.imagePreview}
                  resizeMode="cover"
                />
              ) : type === "image" && !data ? (
                <View style={styles.errorPreview}>
                  <Text style={styles.errorIcon}>❌</Text>
                  <Text style={styles.errorText}>Error</Text>
                </View>
              ) : null}

              {type === "video" && (
                <View style={styles.videoPreview}>
                  <Text style={styles.videoIcon}>🎬</Text>
                  <Text style={styles.videoText}>VIDEO</Text>
                </View>
              )}

              {type === "document" && (
                <View style={styles.documentPreview}>
                  <Text style={styles.documentIcon}>📄</Text>
                  <Text style={styles.documentText}>DOCUMENTO</Text>
                </View>
              )}

              {!["image", "video", "document"].includes(type) && (
                <View style={styles.unknownPreview}>
                  <Text style={styles.unknownIcon}>❓</Text>
                  <Text style={styles.unknownText}>ARCHIVO</Text>
                </View>
              )}
            </View>

            {/* Información del archivo */}
            <View style={styles.infoContainer}>
              <Text style={styles.label} numberOfLines={1}>
                {label || `Archivo ${index + 1}`}
              </Text>

              <Text style={styles.type}>
                Tipo: {type?.toUpperCase() || "DESCONOCIDO"}
              </Text>

              {comment && (
                <Text style={styles.comment} numberOfLines={2}>
                  {comment}
                </Text>
              )}

              <Text style={styles.dataSize}>
                Tamaño: {data ? Math.ceil(data.length / 1024) : 0} KB
              </Text>
            </View>

            {/* Indicador de tipo */}
            {/* <View style={[
              styles.typeIndicator,
              type === 'image' && styles.imageIndicator,
              type === 'video' && styles.videoIndicator,
              type === 'document' && styles.documentIndicator
            ]}>
              <Text style={styles.typeIndicatorText}>
                {type === 'image' ? 'IMG' : 
                 type === 'video' ? 'VID' : 
                 type === 'document' ? 'DOC' : '???'}
              </Text>
            </View> */}
          </View>
        </TouchableWithoutFeedback>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📁</Text>
      <Text style={styles.emptyTitle}>No hay archivos</Text>
      <Text style={styles.emptySubtitle}>
        Agrega imágenes, videos o documentos para verlos aquí
      </Text>
    </View>
  );

  useEffect(() => {}, []);

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
          {t("nodeMedia")}
        </Text>

        <View style={{ flexDirection: "row" }}>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleSave} style={styles.mapButton}>
              <Ionicons name="attach" size={24} color="#3498db" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} style={styles.mapButton}>
              <Ionicons name="save" size={24} color="#3498db" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Contenido */}
      <ScrollView style={styles.content}>
        <FlatList
          data={mediaData.filter(x => !x.deleted)}
          renderItem={renderMediaItem}
          keyExtractor={(item, index) =>
            item.id?.toString() || index.toString()
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          style={styles.list}
        />
      </ScrollView>

      <Modal
        visible={showAttachModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAttachModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t("information")}</Text>
            <Text style={[styles.label, { color: colors.text }]}>
              {t("description")}
            </Text>
            <TextInput
              style={styles.input}
              value={selectedMedia != null ? selectedMedia.label : ""}
              onChangeText={(text) => {
                setSelectedMedia((prev) => ({
                  ...prev,
                  label: text,
                }));
              }}
            ></TextInput>

            <Text style={[styles.label, { color: colors.text }]}>
              {t("comment")}
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={selectedMedia != null ? selectedMedia.comment : ""}
              onChangeText={(text) => {
                setSelectedMedia((prev) => ({
                  ...prev,
                  comment: text,
                }));
              }}
            ></TextInput>

            <Button
              onPress={() => handleApplyChanges()}
              style={{ flex: 1, marginTop: 20 }}
            >
              OK
            </Button>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default NodeMedia;
