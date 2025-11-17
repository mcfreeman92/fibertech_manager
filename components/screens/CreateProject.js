import React, { useState, useEffect, useRef, useCallback } from "react";

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
  ActivityIndicator,

  Button,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";
import { captureRef } from "react-native-view-shot";
import * as DocumentPicker from "expo-document-picker";
import { Picker } from "@react-native-picker/picker";
import {
  ProjectService,
  UnitsService,
  ProjectTypeService,
  NodeService,
  FileService,
} from "../../service/storage";
import { useTranslation } from "../hooks/useTranslation";
import { useApp } from "../context/AppContext";
import { useDevice } from "../context/DeviceContext";

/** ADAPTER PARA LOS DATOS */
import { useAdapter } from "@/api/contexts/DatabaseContext";

import { generateHash } from "../../utils/utils";
import {
  checkDataConsistency,
  checkDatabaseParsing,
} from "../../utils/dataConsistencyChecker";

import { v4 as uuidv4 } from "uuid";

// import ViewShot from 'react-native-view-shot';
// import CameraRoll from '@react-native-cameraroll/cameraroll';
import * as MediaLibrary from "expo-media-library";
import FusionLink from "./FusionLink";

import Svg, { Circle, G } from "react-native-svg";

const CreateProject = ({ navigation, route, theme }) => {
  const {
    createProject,
    updateProject,
    getProjectById,
    createNode,
    createFiber,
    getFibers,
    getFiberById,
    getNodes,
    updateFiber,
    updateNode,
    updateFiberThread,
    deleteNode,
    deleteFiber,
    getMediasByNodeId,
    createMedia
  } = useAdapter()();

  const { topInset, isTablet, bottomInset, stylesFull } = useDevice();

  const qrRef = useRef();
  const [qrData, setQrData] = useState(null);
  const [projectId, setProjectId] = useState(
    route.params != undefined ? route.params.projectId : undefined
  );
  const [createdProjId, setCreatedProjId] = useState(null);

  const [isEditMode, setIsEditMode] = useState(!!projectId);

  const fiberTypesList = [
    {
      typeId: "12F",
      name: "12F",
      description: "fiber12FDescription",
      buffersCount: 1,
    },
    {
      typeId: "24F",
      name: "24F",
      description: "fiber24FDescription",
      buffersCount: 2,
    },
    {
      typeId: "48F",
      name: "48F",
      description: "fiber48FDescription",
      buffersCount: 4,
    },
    {
      typeId: "96F",
      name: "96F",
      description: "fiber96FDescription",
      buffersCount: 8,
    },
    {
      typeId: "192F",
      name: "192F",
      description: "fiber192FDescription",
      buffersCount: 16,
    },
  ];

  const sinleFiberTpeId = "12F";

  // const viewShotRef = useRef();
  const { t } = useTranslation();
  const { isDarkMode, nodesTypesList } = useApp();

  const [showAddFiberModal, setShowAddFiberModal] = useState(false);
  const [showAddNodeModal, setShowAddNodeModal] = useState(false);

  const [showFilterNodesModal, setShowFilterNodesModal] = useState(false);

  const [fibers, setFibers] = useState([]);
  const [deletedFiberIds, setDeletedFiberIds] = useState([]); // Track deleted fiber IDs
  const [nodes, setNodes] = useState([]);
  const [allNodes, setAllNodes] = useState([]); // Estado completo sin filtrar

  const [showCloseProjectModal, setShowCloseProjectModal] = useState(false);

  // Colores dinámicos basados en el tema
  const colors = {
    background: isDarkMode ? "#121212" : "#f5f7fa",
    cardBackground: isDarkMode ? "#1e1e1e" : "white",
    text: isDarkMode ? "#ffffff" : "#2c3e50",
    qrtext: "#2c3e50",
    secondaryText: isDarkMode ? "#b0b0b0" : "#7f8c8d",
    border: isDarkMode ? "#333333" : "#e1e8ed",
    inputBackground: isDarkMode ? "#2a2a2a" : "#f8f9fa",
    placeholder: isDarkMode ? "#888888" : "#a0a0a0",
    primary: "#3498db",
    success: "#2ecc71",
    warning: "#f39c12",
    danger: "#e74c3c",
    purple: "#9b59b6",
  };

  // Tipos disponibles de dispositivos y fibras
  const deviceTypes = [
    {
      id: "switch",
      name: "Switch",
      description: "ethernetSwitching",
      defaultPorts: 24,
    },
    {
      id: "router",
      name: "Router",
      description: "networkRouting",
      defaultPorts: 8,
    },
    {
      id: "access_point",
      name: "Access Point",
      description: "wirelessConnectivity",
      defaultPorts: 4,
    },
    {
      id: "olt",
      name: "OLT",
      description: "opticalLineTerminal",
      defaultPorts: 16,
    },
    {
      id: "ont",
      name: "ONT",
      description: "opticalNetworkTerminal",
      defaultPorts: 1,
    },
    {
      id: "splitter",
      name: "Splitter",
      description: "opticalSignalSplitting",
      defaultPorts: 8,
    },
  ];

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

  // Tipos disponibles de dispositivos y fibras

  const nodesFiltersList = [
    { id: 0, name: t("allNodeFilter"), type: "ALL" },
    { id: 1, name: "MDF", type: "MDF" }, // Coincide con nodeType id: 1
    { id: 2, name: "IDF", type: "IDF" }, // Coincide con nodeType id: 2
    { id: 3, name: t("pedestal"), type: "P" }, // Coincide con nodeType id: 3
    { id: 4, name: t("unit"), type: "U" }, // Coincide con nodeType id: 4
  ];

  const showAlert = (title, message) => {
    if (Platform.OS === "web") {
      // Opciones para web
      if (typeof window !== "undefined" && window.alert) {
        window.alert(`${title}\n${message}`);
      }
    } else {
      // Para iOS y Android
      Alert.alert(t("error"), message);
    }
  };

  const [selectedNodesFilter, setSelectedNodesFilter] = useState(
    nodesFiltersList[0] // Iniciar con "Todos" en lugar de MDF
  );

  const handleNodesFilterSelect = () => {
    setShowFilterNodesModal(true);
  };

  const handleFilterNodeSelect = (filter) => {
    // Filtrar desde allNodes, no recargar desde DB
    let filtered = [];

    if (filter.id == 0) {
      filtered = allNodes; // Mostrar todos
    } else {
      filtered = allNodes.filter((x) => x.typeId == filter.id);
    }

    setNodes(filtered);
    setSelectedNodesFilter(filter);
    setShowFilterNodesModal(false);

    console.log(
      `🔍 Filter applied: ${filter.name}, showing ${filtered.length} nodes`
    );
  };

  // Estilos base (sin colores específicos para mantener la estructura)
  const styles = StyleSheet.create({
    backButton: {
      padding: 5,
    },
    headerActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 15,
    },
    clearButton: {
      padding: 5,
    },
    selectProjectButton: {
      padding: 5,
    },
    scrollView: {
      flex: 1,
    },
    inputGroup: {
      marginBottom: 18,
    },
    textArea: {
      height: 100,
      textAlignVertical: "top",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
    },
    pickerContainerIOS: {
      height: 50,
      justifyContent: "center",
    },
    picker: {
      height: 50,
    },
    pickerIOS: {},
    attachmentsList: {
      marginTop: 15,
    },
    fileInfo: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      gap: 12,
    },
    fileDetails: {
      flex: 1,
    },
    actionButtons: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 12,
    },
    actionButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 10,
      padding: 14,
      gap: 8,
    },
    qrButton: {
      backgroundColor: "#9b59b6",
    },
    shareButton: {
      backgroundColor: "#2ecc71",
    },
    saveButton: {
      backgroundColor: "#3498db",
    },
    saveButtonDisabled: {
      backgroundColor: "#bdc3c7",
    },
    actionButtonText: {
      color: "white",
      fontWeight: "600",
      fontSize: 15,
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    modalContainer: {
      width: "100%",
      maxWidth: 400,
      borderRadius: 16,
      overflow: "hidden",
    },
    selectorModal: {
      maxHeight: "80%",
    },
    closeModalButton: {
      backgroundColor: "#3498db",
      borderRadius: 10,
      padding: 15,
      alignItems: "center",
    },
    cancelButton: {
      backgroundColor: "#e74c3c",
      marginTop: 10,
    },
    closeModalText: {
      color: "white",
      fontWeight: "600",
      fontSize: 16,
    },
    projectList: {
      maxHeight: 300,
      marginBottom: 20,
    },
    projectInfo: {
      flex: 1,
    },
    // Añade estos estilos al objeto styles
    qrActionButtons: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      gap: 10,
      marginBottom: 20,
    },
    qrActionButton: {
      flex: 1,
      minWidth: "45%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 8,
      padding: 12,
      gap: 8,
    },
    saveQrButton: {
      backgroundColor: "#3498db",
    },
    shareQrButton: {
      backgroundColor: "#2ecc71",
    },
    shareDataButton: {
      backgroundColor: "#9b59b6",
    },
    qrActionButtonText: {
      color: "white",
      fontWeight: "600",
      fontSize: 14,
      textAlign: "center",
    },
    qrWrapper: {
      alignItems: "center",
      justifyContent: "center",
      padding: 10,
    },
    container: {
      flex: 1,
      marginTop: 0,
    },
    tabHeader: {
      flexDirection: "row",
      backgroundColor: "#f0f0f0",
    },
    tabButton: {
      flex: 1,
      paddingVertical: 15,
      alignItems: "center",
    },
    activeTabButton: {
      borderBottomWidth: 2,
      borderBottomColor: "#3498db",
    },
    tabText: {
      fontSize: 16,
      color: "#666",
    },
    activeTabText: {
      color: "#3498db",
      fontWeight: "bold",
    },
    content: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    fiberCard: {
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
    },
    deviceInfo: {
      flex: 1,
    },
    fiberCard: {
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
    deviceName: {
      fontSize: 16,
      fontWeight: "500",
      color: colors.text,
    },
    deviceDescription: {
      fontSize: 12,
      color: colors.secondaryText,
      marginTop: 2,
    },
    removeButton: {
      padding: 4,
    },
    configRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 8,
    },
  });

  const [projectData, setProjectData] = useState({
    name: "",
    address: "",
    city: "",
    country: "",
    state: "",
    description: "",
    status: "active",
  });

  const [unitsInfo, setUnitsInfo] = useState({
    living_unit: "0",
    office_amenities: "0",
    commercial_unit: "0",
  });

  const [projectType, setProjectType] = useState({
    build_type: "MDU",
    job_type: "Residential",
    building_type: "Garden Style",
  });

  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    { id: 0, title: "Home", content: "Contenido de Home" },
    { id: 1, title: "Settings", content: "Contenido de Settings" },
    { id: 2, title: "Profile", content: "Contenido de Profile" },
  ];

  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [existingProjects, setExistingProjects] = useState([]);
  const [projectSelectorVisible, setProjectSelectorVisible] = useState(false);

  useEffect(() => {
    const initializeEmptyProject = async () => {
      const hash = uuidv4();
      const mdfNode = {
        hash: hash,
        label: `MDF`,
        createdDate: new Date().toISOString(),
        modifiedDate: new Date().toISOString(),
        deleted: 0,
        typeId: 1,
        devices: [],
        fusionLinks: [],
      };

      setAllNodes([mdfNode]);
      setNodes([mdfNode]);
    };

    if (projectId == null || projectId == undefined) initializeEmptyProject();

    loadExistingProjects();

    if (isEditMode) {
      loadProjectData(projectId)
        .then((r) => {
          console.info("loadProjectData [OK]");
        })
        .catch((e) => {});
    }
  }, [projectId]);

  // COMENTADO: Este listener causaba que se recargaran los datos desde DB
  // cada vez que volvías de NodeDetails/DeviceLinks, perdiendo los cambios en memoria
  // Solo se debe recargar cuando se abre el proyecto inicialmente (useEffect con projectId)

  // useEffect(() => {
  //   const unsubscribe = navigation.addListener('focus', () => {
  //     console.log('🔍 CreateProject screen focused');
  //     if (isEditMode && projectId) {
  //       console.log('🔄 Recargando datos del proyecto por focus:', projectId);
  //       loadProjectData(projectId)
  //         .then((r) => {
  //           console.info("loadProjectData [OK] after focus");
  //         })
  //         .catch((e) => {
  //           console.error("loadProjectData [ERROR] after focus:", e);
  //         });
  //     }
  //   });

  //   return unsubscribe;
  // }, [navigation, isEditMode, projectId]);

  const loadExistingProjects = async () => {
    try {
      const projects = await ProjectService.getProjects();
      setExistingProjects(projects);
    } catch (error) {
      console.log("Error loading projects:", error);
    }
  };

  const loadProjectData = async (id) => {
    try {
      // Clear deleted fibers list when loading a project
      setDeletedFiberIds([]);

      // Cargar datos del proyecto
      const data = await getProjectById(id);
      const project = data.meta;
      if (project) {
        setProjectData({
          name: project.name || "",
          address: project.address || "",
          city: project.city || "",
          country: project.country || "",
          state: project.state || "",
          description: project.description || "",
          status: project.status || "active",
        });
      }

      /**Load nodes and fibers */
      const dbNodes = await getNodes(id);
      console.log("📦 Loaded nodes from DB:", dbNodes);
      console.log("📦 First node details:", dbNodes[0]);

      // 🔍 DIAGNÓSTICO: Verificar cómo vienen los datos de la BD
      checkDatabaseParsing(dbNodes);

      // Mapear campos de DB - el adapter web ya retorna en camelCase
      // pero el adapter REST retorna PascalCase, por eso chequeamos ambos
      const mappedNodes = dbNodes.map((node) => {
        // Parsear metadata si es string
        let parsedMetadata = null;
        const metadataStr = node.metadata || node.Metadata;

        if (metadataStr && typeof metadataStr === "string") {
          try {
            parsedMetadata = JSON.parse(metadataStr);
            console.log(
              `✅ Parsed metadata for node ${node.label || node.Label}`
            );
          } catch (e) {
            console.error(
              `❌ Error parsing metadata for node ${node.label || node.Label}:`,
              e
            );
          }
        } else if (metadataStr && typeof metadataStr === "object") {
          parsedMetadata = metadataStr;
        }

        return {
          id: node.id || node.Id,
          hash: node.hash || node.Hash,
          label: node.label || node.Label,
          projectId: node.projectId || node.ProjectId,
          typeId: node.typeId || node.TypeId,
          description: node.description || node.Description,
          createdDate: node.createdDate || node.CreatedDate,
          modifiedDate: node.modifiedDate || node.ModifiedDate,
          deleted: node.deleted || node.Deleted || 0,
          devices: parsedMetadata?.devices || [],
          fusionLinks: parsedMetadata?.fusionLinks || [],
        };
      });

      // Guardar TODOS los nodos
      setAllNodes(mappedNodes);

      // Mostrar TODOS los nodos inicialmente (sin filtrar)
      setNodes(mappedNodes);

      console.log("✅ Loaded", mappedNodes.length, "nodes successfully");

      // Log detallado de devices por nodo
      mappedNodes.forEach((node) => {
        const devCount = node.devices?.length || 0;
        const fusCount = node.fusionLinks?.length || 0;
        console.log(
          `   📍 ${node.label}: ${devCount} devices, ${fusCount} fusions`
        );
      });

      // Cargar solo fibras principales (sin parentId)
      let records = await getFibers(id, null);
      console.log("📦 Loaded main fibers from DB:", records.length);
      let dbFibers = [];

      for (let f of records) {
        // Cargar buffers de esta fibra (si tiene)
        const buffers = await getFibers(id, f.id);
        console.log(`📦 Fiber "${f.label}" has ${buffers.length} buffer(s)`);
        dbFibers.push({
          ...f,
          buffers: buffers,
        });
      }

      setFibers(dbFibers);
      console.log("✅ Total fibers loaded:", dbFibers.length);

      // 🔍 DIAGNÓSTICO: Verificar consistencia de datos después de mapear
      const consistency = checkDataConsistency(mappedNodes, dbFibers);
      if (!consistency.isValid) {
        console.error(
          "⚠️  Se encontraron problemas de consistencia en los datos"
        );
      }

      // Cargar información de unidades
      const units = project.unitsInfo;
      if (units) {
        setUnitsInfo({
          living_unit: units.living_unit?.toString() || "0",
          office_amenities: units.office_amenities?.toString() || "0",
          commercial_unit: units.commercial_unit?.toString() || "0",
        });
      }

      // Cargar tipo de proyecto
      // const projectTypeData = await ProjectTypeService.getProjectType(projectId);
      // if (projectTypeData) {
      //   setProjectType({
      //     build_type: projectTypeData.build_type || 'MDU',
      //     job_type: projectTypeData.job_type || 'Residential',
      //     building_type: projectTypeData.building_type || 'Garden Style'
      //   });
      // }
    } catch (error) {
      console.log("Error loading project data:", error);
      Alert.alert(t("error"), t("failedToLoadProject"));
    } finally {
      setSaving(false);
    }
  };

  const renderTabContent = () => {
    return (
      <View style={styles.content}>
        <Text>{tabs[activeTab].content}</Text>
      </View>
    );
  };

  const RenderTabs = () => {
    return (
      <View style={styles.container}>
        {/* Header de tabs */}
        <View style={styles.tabHeader}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tabButton,
                activeTab === tab.id && styles.activeTabButton,
              ]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.id && styles.activeTabText,
                ]}
              >
                {tab.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Contenido */}
        {renderTabContent()}
      </View>
    );
  };

  //   const saveQRCodeToGalleryComplete = async () => {
  //   try {
  //     const { status } = await MediaLibrary.requestPermissionsAsync();
  //     if (status !== 'granted') {
  //       Alert.alert(t('permissionDenied'), t('galleryPermissionMessage'));
  //       return;
  //     }

  //     const uri = await captureRef(viewShotRef, {
  //       format: 'png',
  //       quality: 1.0
  //     });

  //     await MediaLibrary.saveToLibraryAsync(uri);
  //     Alert.alert(t('success'), t('qrSavedSuccess'));
  //   } catch (error) {
  //     Alert.alert(t('error'), t('failedToSaveQR'));
  //   }
  // };

  const selectProjectToEdit = (project) => {
    setProjectSelectorVisible(false);
    navigation.setParams({ projectId: project.id });
  };

  const calculateTotalUnits = () => {
    const living = parseInt(unitsInfo.living_unit || "0");
    const offices = parseInt(unitsInfo.office_amenities || "0");
    const commercial = parseInt(unitsInfo.commercial_unit || "0");
    return living + offices + commercial;
  };

  const handleInputChange = (field, value) => {
    setProjectData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleUnitsChange = (field, value) => {
    // Solo permitir números
    if (/^\d*$/.test(value)) {
      setUnitsInfo((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleTypeChange = (field, value) => {
    setProjectType((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const attachFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (result.type === "success") {
        const fileInfo = {
          name: result.name,
          uri: result.uri, // Guardamos la URI/ruta del archivo
          size: result.size,
          type: result.mimeType,
          lastModified: result.lastModified,
        };
        setAttachedFiles((prev) => [...prev, fileInfo]);
        Alert.alert(t("success"), t("fileAttachedSuccess"));
      }
    } catch (error) {
      Alert.alert(t("error"), t("failedToAttachFile") + error.message);
    }
  };

  const removeFile = (index) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const generateProjectQR = () => {
    const projectSummary = {
      projectId: projectId,
      project: {
        ...projectData,
        created: new Date().toISOString(),
        status: "draft",
      },
      units: {
        ...unitsInfo,
        total: calculateTotalUnits(),
      },
      type: projectType,
      files: attachedFiles.map((file) => ({
        name: file.name,
        uri: file.uri, // Solo guardamos la URI/ruta del archivo
        type: file.type,
        size: file.size,
      })),
      metadata: {
        generated: new Date().toISOString(),
        app: "FTTH Project Manager",
        version: "1.0",
      },
    };
    // setQrData(projectSummary)
    // console.log("SIIIII " + JSON.stringify(projectSummary))
    return JSON.stringify(projectSummary);
  };

  const shareProject = async () => {
    try {
      const result = await Share.share({
        message: `${t("ftthProject")}: ${projectData.name}\n${t("address")}: ${
          projectData.address
        }\n${t("totalUnits")}: ${calculateTotalUnits()}\n\n${t(
          "scanQRForDetails"
        )}`,
        title: t("ftthProjectDetails"),
      });
    } catch (error) {
      Alert.alert(t("error"), t("failedToShare"));
    }
  };

  const addFiber = (fiberType) => {
    const newFiber = {
      hash: uuidv4(),
      count: 1,
      typeId: fiberType.typeId,
      label: fiberType.name,
      description: fiberType.name,
    };

    setShowAddFiberModal(true);
  };

  const addNode = async () => {
    setShowAddNodeModal(true);
  };

  const handleConnectionMap = () => {};

  const buildFiberThreads = () => {
    let items = [];
    for (let i = 0; i < 12; i++) {
      const color = fiberColors12Hex.at(i);
      items = [
        ...items,
        {
          number: i + 1,
          color: color.color,
          active: true,
          inUse: false,
        },
      ];
    }

    return items;
  };

  const buildFiber = (label, typeId) => {
    const newFiber = {
      hash: uuidv4(),
      label: label,
      createdDate: new Date().toISOString(),
      modifiedDate: new Date().toISOString(),
      deleted: 0,
      typeId: typeId,
      threads: buildFiberThreads(),
      buffers: [],
    };

    return newFiber;
  };

  const handleOnSelectFiberType = (fiberType) => {
    // Contar fibras existentes del mismo tipo para nomenclatura inteligente
    const existingFibersOfType = fibers.filter(
      (x) => x.typeId === fiberType.typeId && !x.deleted
    );

    // Generar nombre único validando que no exista
    let fiberNumber = existingFibersOfType.length + 1;
    let fiberLabel = `${fiberType.name}_${fiberNumber}`;

    // Validar que el nombre no esté duplicado
    while (fibers.some((f) => f.label === fiberLabel && !f.deleted)) {
      fiberNumber++;
      fiberLabel = `${fiberType.name}_${fiberNumber}`;
    }

    let fiber = buildFiber(fiberLabel, fiberType.typeId);

    let buffers = [];

    if (fiberType.buffersCount > 1) {
      /**Build buffers */
      for (let i = 0; i < fiberType.buffersCount - 1; i++) {
        const buffer = buildFiber(
          `${fiberLabel}_Buffer_${i + 1}`,
          sinleFiberTpeId
        );
        buffers.push(buffer);
      }
    }

    fiber.buffers = buffers;

    console.log(
      "✅ Added fiber:",
      fiberLabel,
      "with",
      buffers.length,
      "buffers"
    );
    setFibers((prev) => [...prev, fiber]);
    setShowAddFiberModal(false);
  };

  const handleNodeSelect = async (nodeType) => {
    // Validar límite de unidades solo para nodos tipo Unit
    const unitType = nodesTypesList().find((x) => x.type == "U");

    let nodeLabel = "";

    if (nodeType.id === unitType.id) {
      // Contar unidades existentes en allNodes
      const existingUnits = allNodes.filter(
        (x) => x.typeId == unitType.id && !x.deleted
      );
      const unitsCount = existingUnits.length;
      const maxUnits = calculateTotalUnits();

      if (unitsCount >= maxUnits) {
        showAlert(t("error"), t("maxUnits"));
        return;
      }

      // Generar nombre de unidad secuencial
      nodeLabel = `UNIT_${unitsCount + 1}`;
    } else {
      // Para otros tipos (IDF, Pedestal), contar del mismo tipo
      const sameTypeNodes = allNodes.filter(
        (x) => x.typeId == nodeType.id && !x.deleted
      );

      // Generar nombre único validando que no exista
      let nodeNumber = sameTypeNodes.length + 1;
      nodeLabel = `${nodeType.name}_${nodeNumber}`;

      // Validar que el nombre no esté duplicado
      while (allNodes.some((n) => n.label === nodeLabel && !n.deleted)) {
        nodeNumber++;
        nodeLabel = `${nodeType.name}_${nodeNumber}`;
      }
    }

    const newNode = {
      hash: uuidv4(),
      label: nodeLabel,
      createdDate: new Date().toISOString(),
      modifiedDate: new Date().toISOString(),
      deleted: 0,
      typeId: nodeType.id,
      devices: [],
      fusionLinks: [],
    };

    console.log("🔍 Adding node:", {
      label: nodeLabel,
      typeId: nodeType.id,
      currentFilter: selectedNodesFilter.id,
      filterName: selectedNodesFilter.name,
      willShow:
        selectedNodesFilter.id === 0 || selectedNodesFilter.id === nodeType.id,
    });

    // Si es una UNIT, crear automáticamente la fibra DROP con estructura 12F pero nomenclatura 2F
    if (nodeType.id === unitType.id) {
      const dropFiberLabel = `2F_${nodeLabel}`;

      // Crear los 12 hilos con código de colores estándar (para compatibilidad con pathfinding)
      // pero solo los primeros 2 estarán activos para uso del técnico
      const dropThreads = [];
      for (let i = 0; i < 12; i++) {
        const color = fiberColors12Hex[i];
        dropThreads.push({
          number: i + 1,
          color: color.color,
          active: i < 2, // Solo hilos 1 (Azul) y 2 (Naranja) disponibles
          inUse: false,
        });
      }

      const dropFiber = {
        hash: uuidv4(),
        label: dropFiberLabel,
        createdDate: new Date().toISOString(),
        modifiedDate: new Date().toISOString(),
        deleted: 0,
        typeId: "12F", // Estructura interna 12F para compatibilidad con sistema
        threads: dropThreads,
        buffers: [],
        nodeId: newNode.hash, // Asociar la fibra con el nodo UNIT
        isSystemFiber: true, // Fibra gestionada por el sistema (no editable por técnico)
      };

      console.log(
        "🔷 Creating DROP fiber for UNIT:",
        dropFiberLabel,
        "- 2 active threads (system managed)"
      );
      setFibers((prev) => [...prev, dropFiber]);
    }

    // Actualizar TODOS los nodos
    setAllNodes((prev) => {
      const updated = [...prev, newNode];
      console.log("📦 AllNodes updated. Total:", updated.length);
      return updated;
    });

    // Si el filtro actual coincide, mostrar el nuevo nodo
    if (
      selectedNodesFilter.id === 0 ||
      selectedNodesFilter.id === nodeType.id
    ) {
      setNodes((prev) => {
        const updated = [...prev, newNode];
        console.log("👁️ Visible nodes updated. Total:", updated.length);
        return updated;
      });
    } else {
      console.log("⚠️ Node added but not visible due to current filter");
    }

    setShowAddNodeModal(false);
    console.log("✅ Node added successfully:", newNode.label);
  };

  const doCreateNode = async (node) => {
    const links = node.fusionLinks || [];

    for (let i = 0; i < links.length; i++) {
      const link = links[i];

      doUpdateFiberThread(link.src, true);
      doUpdateFiberThread(link.dst, true);
    }

    const meta = {
      devices: node.devices || [],
      fusionLinks: links,
    };

    const dbNode = await createNode({
      label: node.label,
      projectId: node.projectId,
      typeId: node.typeId || "",
      description: "",
      metadata: JSON.stringify(meta),
      createdDate: node.createdDate,
      modifiedDate: node.modifiedDate,
    });

    console.log(
      "✅ Created node:",
      node.label,
      "with ID:",
      dbNode.id,
      "(DB returned:",
      JSON.stringify(dbNode),
      ")"
    );

    // El adapter web ya retorna en camelCase, solo necesitamos agregar los campos extra
    return {
      ...dbNode,
      hash: node.hash,
      devices: meta.devices,
      fusionLinks: meta.fusionLinks,
    };
  };

  const doCreateFiber = async (fiber) => {
    const meta = JSON.stringify(fiber.threads);

    let dbFiber = await createFiber({
      label: fiber.label,
      projectId: fiber.projectId,
      typeId: fiber.typeId || sinleFiberTpeId,
      description: "",
      metadata: meta,
      nodeId: fiber.nodeId || null,
      createdDate: fiber.createdDate,
      modifiedDate: fiber.modifiedDate,
    });

    /**Save buffers */
    for (let j = 0; j < fiber.buffers.length; j++) {
      const buffer = fiber.buffers[j];

      const meta2 = JSON.stringify(buffer.threads);

      const dbBuffer = await createFiber({
        label: buffer.label,
        projectId: fiber.projectId,
        parentId: dbFiber.id,
        typeId: buffer.typeId || sinleFiberTpeId,
        description: "",
        metadata: meta2,
        createdDate: buffer.createdDate,
        modifiedDate: buffer.modifiedDate,
      });

      if (dbFiber.buffers == undefined) dbFiber.buffers = [];

      dbFiber.buffers.push(dbBuffer);
    }

    return dbFiber;
  };

  const doUpdateFiberThread = (link, inUse) => {
    let items = [...fibers];

    let fiber = null;

    if (link.buffer != null) {
      let f = items.find((x) => x.id == link.fiberId);
      fiber = f.buffers.find((x) => x.id == link.buffer);
    } else {
      fiber = items.find((x) => x.id == link.fiberId);
    }

    const t = fiber.threads[link.thread];
    fiber.threads[link.thread] = {
      ...t,
      inUse: inUse ? t.inUse + 1 : t.inUse - 1,
    };

    setFibers(items);
  };

  const handleSaveProject = async () => {
    if (saving) return;

    setSaving(true);
    setShowCloseProjectModal(true);

    try {
      if (!projectData.name?.trim() /**|| !projectData.address?.trim() */) {
        Alert.alert(t("error"), t("nameAndAddressRequired"));
        setSaving(false);
        return;
      }

      console.log("💾 Starting save process...");
      console.log("📊 All nodes to save:", allNodes.length);
      console.log(
        "📋 All nodes:",
        allNodes.map((n) => `${n.label} (${n.id ? "DB" : "NEW"})`).join(", ")
      );
      console.log("👁️ Currently filtered nodes visible:", nodes.length);
      console.log("🔧 Edit mode:", isEditMode);

      // Modo creación: Crear nuevo proyecto
      let meta = await ProjectService.createProject({
        name: projectData.name.trim(),
        address: projectData.address.trim(),
        city: projectData.city || "",
        country: projectData.country || "USA",
        state: projectData.state || "",
        description: projectData.description || "",
        status: "active",
        unitsInfo: {
          living_unit: unitsInfo.living_unit || "0",
          office_amenities: unitsInfo.office_amenities || "0",
          commercial_unit: unitsInfo.commercial_unit || "0",
        },
      });

      const prjData = {
        name: meta.name,
        metadata: JSON.stringify(meta),
      };

      if (isEditMode) {
        await updateProject(projectId, prjData);

        /**Persist/Update new nodes */

        for (let i = 0; i < allNodes.length; i++) {
          const node = allNodes[i];

          if (node.id == undefined) {
            if (!node.deleted) {
              let newObj = {
                ...node,
                projectId: projectId,
              };
              const createdNode = await doCreateNode(newObj);

              // Si es una UNIT, actualizar el nodeId de su fibra DROP con el ID de BD
              if (node.typeId === 4 && createdNode.id) {
                const dropFiberIndex = fibers.findIndex(
                  (f) => f.nodeId === node.hash
                );
                if (dropFiberIndex !== -1) {
                  console.log(
                    "🔷 Updating DROP fiber nodeId from hash to DB id:",
                    node.hash,
                    "→",
                    createdNode.id
                  );
                  fibers[dropFiberIndex] = {
                    ...fibers[dropFiberIndex],
                    nodeId: createdNode.id, // Actualizar con el ID de BD
                  };
                }
              }

              /**Create media */
              const finalMedia = (node.media || []).filter(x => x.deleted == false);
              for (let j = 0; j < finalMedia; j++){
                 const item = finalMedia[j];

                 const media = {
                  nodeId : createNode.id,
                  label : item.label,
                  content : {
                    comment : item.comment,
                    data : item.data,
                    type : item.type
                  }
                 };

                 await createMedia(media);
              }
            }
          } else {
            const links = node.fusionLinks || [];

            const deletedLinks = links.filter((x) => x.deleted);

            for (let i = 0; i < deletedLinks.length; i++) {
              const link = deletedLinks[i];

              doUpdateFiberThread(link.src, false);
              doUpdateFiberThread(link.dst, false);
            }

            if ((node.deleted || false) == false) {
              const updateLinks = links.filter((x) => x.deleted == false);

              for (let i = 0; i < updateLinks.length; i++) {
                const link = updateLinks[i];

                doUpdateFiberThread(link.src, true);
                doUpdateFiberThread(link.dst, true);
              }

              const meta = {
                devices: node.devices || [],
                fusionLinks: updateLinks,
              };

              const updateData = {
                label: node.label,
                typeId: node.typeId,
                description: node.description || "",
                metadata: JSON.stringify(meta),
                modifiedDate: new Date().toISOString(),
              };

              await updateNode(node.id, updateData);

              console.log(
                "✅ Updated node:",
                node.label,
                "with typeId:",
                node.typeId,
                "ID:",
                node.id,
                "Devices:",
                (node.devices || []).length
              );
            } else {
              for (let i = 0; i < links.length; i++) {
                const link = links[i];

                doUpdateFiberThread(link.src, false);
                doUpdateFiberThread(link.dst, false);
              }

              await deleteNode(node.id);
            }
          }


        }

        /**Delete removed fibers */
        console.log("🗑️ Deleting", deletedFiberIds.length, "fiber(s)");
        for (let i = 0; i < deletedFiberIds.length; i++) {
          const fiberId = deletedFiberIds[i];
          try {
            await deleteFiber(fiberId);
            console.log("✅ Deleted fiber ID:", fiberId);
          } catch (error) {
            console.error("❌ Error deleting fiber:", fiberId, error);
          }
        }

        // Clear deleted fibers list after deletion
        setDeletedFiberIds([]);

        /**Actualizar nodeId de fibras DROP con los IDs de BD de los nodos UNIT */
        const updatedFibers = fibers.map((fiber) => {
          if (fiber.nodeId && typeof fiber.nodeId === "string") {
            // Esta fibra DROP tiene un hash, buscar el nodo para obtener su ID de BD
            const unitNode = allNodes.find(
              (n) => n.hash === fiber.nodeId && n.typeId === 4
            );
            if (unitNode && unitNode.id) {
              console.log(
                "🔷 Mapping DROP fiber nodeId from hash to DB id:",
                fiber.label,
                fiber.nodeId,
                "→",
                unitNode.id
              );
              return {
                ...fiber,
                nodeId: unitNode.id,
              };
            }
          }
          return fiber;
        });
        setFibers(updatedFibers);

        /**Persist new fibers */
        for (let i = 0; i < updatedFibers.length; i++) {
          const fiber = updatedFibers[i];
          if (fiber.id == undefined) {
            let newObj = {
              ...fiber,
              projectId: projectId,
            };
            await doCreateFiber(newObj);
          } else {
            // Para fibras existentes, verificar si necesita actualizar nodeId
            const needsNodeIdUpdate =
              fiber.nodeId && updatedFibers[i].nodeId !== fibers[i].nodeId;

            if (needsNodeIdUpdate) {
              console.log(
                "🔷 Updating existing DROP fiber in DB:",
                fiber.label,
                "nodeId:",
                updatedFibers[i].nodeId
              );
              // Actualizar con el nuevo nodeId
              await updateFiber(fiber.id, {
                label: fiber.label,
                metadata: JSON.stringify(fiber.threads),
                nodeId: updatedFibers[i].nodeId, // Actualizar nodeId en BD
              });
            } else {
              await updateFiber(fiber.id, {
                label: fiber.label,
                metadata: JSON.stringify(fiber.threads),
              });
            }
            console.log("✅ Updated fiber:", fiber.label, "ID:", fiber.id);
          }

          /**Save buffers */
          for (let j = 0; j < updatedFibers[i].buffers.length; j++) {
            const buffer = updatedFibers[i].buffers[j];

            if (buffer.id == undefined) {
              let newObj = {
                ...buffer,
                projectId: projectId,
              };
              await doCreateFiber(newObj);
            } else {
              await updateFiber(buffer.id, {
                label: buffer.label,
                metadata: JSON.stringify(buffer.threads),
              });
              console.log("✅ Updated buffer:", buffer.label, "ID:", buffer.id);
            }
          }
        }
      } else {
        /**Persist on db or API storage */
        const project = await createProject(prjData);

        /**Prepare nodes */
        let nodesList = [...allNodes];

        /**NO auto-crear unidades - se agregan manualmente hasta el límite */

        /**Guardar nodos existentes */
        for (let i = 0; i < nodesList.length; i++) {
          const node = nodesList[i];

          const createdNode = await doCreateNode({
            ...node,
            projectId: project.id,
          });

          // Actualizar el nodo en la lista con el ID de BD
          nodesList[i] = {
            ...nodesList[i],
            id: createdNode.id,
          };
          console.log(
            "✅ Node created with DB ID:",
            createdNode.label,
            "ID:",
            createdNode.id,
            "Hash:",
            createdNode.hash
          );
        }

        console.log(
          "✅ Saved",
          nodesList.length,
          "nodes to project ID:",
          project.id
        );
        console.log(
          "📋 Nodes saved:",
          nodesList.map((n) => n.label).join(", ")
        );

        /**Actualizar nodeId de fibras DROP con los IDs de BD */
        const fibersToSave = fibers.map((fiber) => {
          if (fiber.nodeId && typeof fiber.nodeId === "string") {
            // Esta fibra DROP tiene un hash, buscar el nodo para obtener su ID de BD
            const unitNode = nodesList.find(
              (n) => n.hash === fiber.nodeId && n.typeId === 4
            );
            if (unitNode && unitNode.id) {
              console.log(
                "🔷 Mapping DROP fiber nodeId for new project:",
                fiber.label,
                fiber.nodeId,
                "→",
                unitNode.id
              );
              return {
                ...fiber,
                nodeId: unitNode.id,
              };
            }
          }
          return fiber;
        });

        /**Persist fibers */
        let saveFibers = [];

        for (let i = 0; i < fibersToSave.length; i++) {
          const fiber = fibersToSave[i];

          const f = await doCreateFiber({
            ...fiber,
            projectId: project.id,
          });

          saveFibers.push(f);
        }

        /**Reload project data from DB */
        setCreatedProjId(project.id);
        setProjectId(project.id);
        setIsEditMode(true);

        // Recargar nodos desde DB para obtener los IDs asignados
        console.log("🔄 Reloading project data after creation...");
        await loadProjectData(project.id);
      }
    } catch (error) {
      setSaving(false);
      console.log("❌ Error saving project:", error);
      Alert.alert(
        "❌ " + t("error"),
        t(isEditMode ? "failedToUpdate" : "failedToSave")
      );
    } finally {
      console.log("✅ Project saved");
      setSaving(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const clearForm = () => {
    setProjectData({
      name: "",
      address: "",
      city: "",
      country: "",
      state: "",
      description: "",
      status: "active",
    });
    setUnitsInfo({
      living_unit: "0",
      office_amenities: "0",
      commercial_unit: "0",
    });
    setProjectType({
      build_type: "MDU",
      job_type: "Residential",
      building_type: "Garden Style",
    });
    setAttachedFiles([]);
    setAllNodes([]);
    setNodes([]);
    navigation.setParams({ projectId: null });
  };

  const saveQRCodeToGallery = async () => {
    Alert.alert(t("saveQR"), t("saveQRMessage"), [
      {
        text: t("cancel"),
        style: "cancel",
      },
      {
        text: t("copyData"),
        onPress: async () => {
          try {
            const qrData = generateProjectQR();
            Clipboard.setString(qrData);
            Alert.alert(t("success"), t("qrDataCopied"));
          } catch (error) {
            Alert.alert(t("error"), t("failedToSaveQR"));
          }
        },
      },
      {
        text: t("takeScreenshot"),
        onPress: () => {
          Alert.alert(t("info"), t("screenshotInstructions"));
        },
      },
    ]);
  };

  const handleSave = async () => {
    if (saving) return;

    Alert.alert(t("saveQRCode"), t("confirmSaveQR"), [
      {
        text: t("cancel"),
        style: "cancel",
      },
      {
        text: t("save"),
        onPress: saveQRCode,
        style: "default",
      },
    ]);
  };

  const captureQRCode = async () => {
    try {
      // Asegúrate de que el QR esté renderizado antes de capturarlo
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Capturar el componente QR como imagen
      const uri = await captureRef(qrRef, {
        format: "png",
        quality: 1,
      });

      return uri;
    } catch (error) {
      console.error("Error capturing QR code:", error);
      throw error;
    }
  };

  const shareQRCode = async () => {
    try {
      setSaving(true);
      const qrImageUri = await captureQRCode();

      const projectName = projectData.name || "Unnamed Project";
      const message = t("shareProjectMessage").replace(
        "{projectName}",
        projectName
      );

      const shareOptions = {
        title: t("shareProjectQR"),
        message: message,
        url: qrImageUri,
        type: "image/png",
      };

      const result = await Share.share(shareOptions);

      if (result.action === Share.sharedAction) {
        Alert.alert(t("success"), t("qrSharedSuccessfully"));
      }
    } catch (error) {
      console.error("Error sharing QR code:", error);
      Alert.alert(t("error"), t("couldNotShareQR"));
    } finally {
      setSaving(false);
    }
  };

  const shareAsData = async () => {
    try {
      const projectName = projectData.name || "Unnamed Project";
      const message = t("shareProjectMessage").replace(
        "{projectName}",
        projectName
      );
      const qrData = generateProjectQR();
      const shareOptions = {
        title: t("shareProjectData"),
        message: ` ${message} \n\n${qrData}`,
      };

      const result = await Share.share(shareOptions);

      if (result.action === Share.sharedAction) {
        Alert.alert(t("success"), t("dataSharedSuccessfully"));
      }
    } catch (error) {
      console.error("Error sharing data:", error);
      Alert.alert(t("error"), t("couldNotShareData"));
    }
  };

  const handleShare = async () => {
    if (saving) return;

    Alert.alert(t("shareQRCode"), t("chooseShareOption"), [
      {
        text: t("cancel"),
        style: "cancel",
      },
      {
        text: t("shareAsImage"),
        onPress: shareQRCode,
      },
      {
        text: t("shareAsData"),
        onPress: () => shareAsData(),
      },
    ]);
  };

  const requestStoragePermission = async () => {
    if (Platform.OS === "android") {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: "Storage Permission",
            message: "App needs access to storage to save QR codes",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK",
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true; // iOS no necesita este permiso
  };

  const saveQRCode = async () => {
    try {
      setSaving(true);

      // Solicitar permisos en Android
      if (Platform.OS === "android") {
        const hasPermission = await requestStoragePermission();
        if (!hasPermission) {
          Alert.alert(t("error"), t("storagePermissionDenied"));
          return;
        }
      }

      // Solicitar permisos para la galería
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(t("error"), t("photoLibraryPermissionDenied"));
        return;
      }

      // Capturar el QR como imagen
      const qrImageUri = await captureQRCode();

      // Guardar en la galería
      const asset = await MediaLibrary.createAssetAsync(qrImageUri);

      // Crear álbum si no existe
      const album = await MediaLibrary.getAlbumAsync("FiberQR");
      if (album) {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      } else {
        await MediaLibrary.createAlbumAsync("FiberQR", asset, false);
      }

      Alert.alert(t("success"), t("qrSavedSuccessfully"));
    } catch (error) {
      console.error("Error saving QR code:", error);
      Alert.alert(t("error"), t("couldNotSaveQR"));
    } finally {
      setSaving(false);
    }
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 15,
      top: 10,
      backgroundColor: colors.cardBackground,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
      zIndex: 10,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.text,
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 40,
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
    formCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 14,
      padding: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 3,
    },
    label: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 8,
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
    totalUnits: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingTop: 15,
      marginTop: 10,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    totalLabel: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
    },
    totalValue: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.primary,
    },
    pickerContainer: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      backgroundColor: colors.inputBackground,
      overflow: "hidden",
    },
    attachButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: 10,
      padding: 14,
      backgroundColor: isDarkMode
        ? "rgba(52, 152, 219, 0.2)"
        : "rgba(52, 152, 219, 0.1)",
      gap: 8,
    },
    attachButtonText: {
      color: colors.primary,
      fontWeight: "600",
      fontSize: 16,
    },
    fileItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 12,
      backgroundColor: colors.inputBackground,
      borderRadius: 8,
      marginBottom: 10,
    },
    fileName: {
      fontSize: 15,
      color: colors.text,
      fontWeight: "500",
    },
    fileSize: {
      fontSize: 13,
      color: colors.secondaryText,
      marginTop: 2,
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
    qrContainer: {
      alignItems: "center",
      marginVertical: 20,
      padding: 15,
      backgroundColor: "white",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    qrDescription: {
      fontSize: 15,
      color: colors.secondaryText,
      textAlign: "center",
      marginBottom: 20,
      lineHeight: 22,
    },
    projectItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: 15,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 15,
    },
    projectName: {
      fontSize: 16,
      // fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    projectAddress: {
      fontSize: 14,
      color: colors.secondaryText,
    },
    noProjectsText: {
      textAlign: "center",
      fontSize: 16,
      color: colors.secondaryText,
      padding: 30,
    },
  });

  const handleRemoveNode = (node) => {
    // Si es una UNIT (typeId === 4), también eliminar su fibra DROP
    if (node.typeId === 4) {
      const nodeIdentifier = node.id || node.hash; // Usar id de BD si existe, sino hash
      const dropFiber = fibers.find((f) => f.nodeId === nodeIdentifier);

      if (dropFiber) {
        console.log("🔷 Removing DROP fiber for UNIT:", dropFiber.label);
        const updatedFibers = fibers.filter((f) => f.nodeId !== nodeIdentifier);
        setFibers(updatedFibers);

        // Track for deletion if it has DB id
        if (dropFiber.id) {
          setDeletedFiberIds((prev) => [...prev, dropFiber.id]);
        }
      }
    }

    // Actualizar en allNodes
    const allIndex = node.id
      ? allNodes.findIndex((x) => x.id == node.id)
      : allNodes.findIndex((x) => x.hash == node.hash);

    if (allIndex != -1) {
      const updatedAll = [...allNodes];
      updatedAll[allIndex] = {
        ...updatedAll[allIndex],
        deleted: true,
      };
      setAllNodes(updatedAll);

      // Actualizar vista filtrada
      const nodesIndex = node.id
        ? nodes.findIndex((x) => x.id == node.id)
        : nodes.findIndex((x) => x.hash == node.hash);

      if (nodesIndex != -1) {
        const updatedNodes = [...nodes];
        updatedNodes[nodesIndex] = {
          ...updatedNodes[nodesIndex],
          deleted: true,
        };
        setNodes(updatedNodes);
      }

      console.log("🗑️ Node marked as deleted:", node.label);
    }
  };

  const RenderFiber = ({ fiber }) => {
    return (
      <View style={combinedStyles.fiberCard}>
        <View style={combinedStyles.deviceHeader}>
          <View style={combinedStyles.deviceInfo}>
            <Text style={combinedStyles.deviceName}>
              {fiber.label} {fiber.isSystemFiber && "🔒"}
            </Text>
            <Text style={combinedStyles.deviceDescription}>{fiber.typeId}</Text>
          </View>
          <TouchableOpacity
            onPress={() => handleSeeFiberInfo(fiber)}
            style={{ marginRight: 3 }}
          >
            <Ionicons name="information-circle" size={24} color={"#504d4cff"} />
          </TouchableOpacity>
          {!fiber.isSystemFiber && !fiber.nodeId && (
            <TouchableOpacity
              style={dynamicStyles.removeButton}
              onPress={() => handleRemoveFiber(fiber)}
            >
              <Ionicons name="trash" size={24} color={"salmon"} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const updateLocalNode = (node) => {
    console.log(
      "📝 Updating node:",
      node.label,
      "Devices count:",
      node.devices?.length || 0
    );

    // Actualizar en allNodes
    const allIndex =
      node.hash != undefined
        ? allNodes.findIndex((x) => x.hash == node.hash)
        : allNodes.findIndex((x) => x.id == node.id);

    if (allIndex != -1) {
      const tmpAll = [...allNodes];
      tmpAll[allIndex] = node;
      setAllNodes(tmpAll);
      console.log("✅ Updated in allNodes at index:", allIndex);
    } else {
      console.warn("⚠️ Node not found in allNodes");
    }

    // Actualizar en nodes (vista filtrada)
    const index =
      node.hash != undefined
        ? nodes.findIndex((x) => x.hash == node.hash)
        : nodes.findIndex((x) => x.id == node.id);

    if (index != -1) {
      const tmp = [...nodes];
      tmp[index] = node;
      setNodes(tmp);
      console.log("✅ Updated in visible nodes at index:", index);
    }

    // 💾 PERSISTIR EN BASE DE DATOS
    if (node.id) {
      console.log("💾 Persisting node to database...");
      console.log("   Node ID:", node.id);
      console.log("   Devices:", node.devices?.length || 0);
      console.log("   FusionLinks:", node.fusionLinks?.length || 0);

      // Preparar metadata para guardar
      const metadata = JSON.stringify({
        devices: node.devices || [],
        fusionLinks: node.fusionLinks || [],
      });

      const nodeToUpdate = {
        ...node,
        metadata: metadata,
      };

      updateNode(node.id, nodeToUpdate)
        .then(() => {
          console.log("✅ Node persisted to database successfully");
        })
        .catch((error) => {
          console.error("❌ Error persisting node to database:", error);
          Alert.alert(
            t("error") || "Error",
            "No se pudo guardar el nodo en la base de datos",
            [{ text: t("ok") || "OK" }]
          );
        });
    } else {
      console.log("⚠️ Node has no ID, cannot persist to database yet");
    }

    console.log("🔄 Node updated:", node.label);
  };

  const updateNodeMedia = (node) => {
    console.log(
      "📝 Updating node media:",
      node.label
    );

    console.log("🔄 Node media updated:", node.label);
  };  

  const findLocalNode = (id, hash) => {
    const result =
      allNodes.find(
        (n) => (n.id && n.id === id) || (n.hash && n.hash === hash)
      ) || undefined;

    return result;
  };

  const handleSeeNodeMedia = async (node) => {
    // Buscar el nodo actualizado en allNodes para asegurar que tiene los últimos cambios

    //const media = await getMediasByNodeId(node.id);

    const media = [
      {
        id: 1,
        type: "video",
        label: "Foto del proyecto",
        comment: "Esta es una imagen de ejemplo",
        data: "base64string...", // Tu base64 real aquí
      },
      {
        id: 2,
        type: "video",
        label: "Video demostración",
        comment: "Video explicativo del proceso",
        data: "videoreference...",
      },
      {
        id: 3,
        type: "video",
        label: "Especificaciones.pdf",
        comment: "Documento con las especificaciones técnicas",
        data: "documentdata...",
      },
    ];

    const tmp = {
      nodeId: node.id,
      nodeHash: node.hash,
      media: media,
      onSaveNodeMedia: (data) => {
        if (data.nodeId != undefined) {
        }
      },
    };

    navigation.navigate("NodeMedia", tmp);
  };

  const handleSeeNodeInfo = (node) => {
    // Buscar el nodo actualizado en allNodes para asegurar que tiene los últimos cambios
    const currentNode =
      allNodes.find(
        (n) => (n.id && n.id === node.id) || (n.hash && n.hash === node.hash)
      ) || node;

    console.log(
      "🔍 Opening node details:",
      currentNode.label,
      "Devices:",
      currentNode.devices?.length || 0
    );

    const tmp = {
      node: currentNode,
      onSaveNode: (data) => {
        updateLocalNode(data);
      },
    };

    navigation.navigate("NodeDetails", tmp);
  };

  const updateLocalFiber = (fiber) => {
    let index = -1;

    if (fiber.hash != undefined) {
      index = fibers.findIndex((x) => x.hash == fiber.hash);
    } else {
      index = fibers.findIndex((x) => x.id == fiber.id);
    }

    if (index != -1) {
      let tmp = [...fibers];
      tmp[index] = fiber;
      setFibers(tmp);
    }
  };

  const handleRemoveFiber = (fiber) => {
    // Verificar si es una fibra del sistema (DROP de UNIT) - no se puede eliminar
    if (fiber.isSystemFiber || fiber.nodeId) {
      Alert.alert(
        t("error") || "Error",
        "Esta fibra DROP pertenece a una UNIT y no puede ser eliminada. Solo se eliminará cuando se elimine la UNIT.",
        [{ text: t("ok") || "OK" }]
      );
      return;
    }

    // Verificar si la fibra tiene fusiones en algún nodo
    const fiberId = fiber.id || fiber.hash;
    let fusionCount = 0;

    // Buscar fusiones en todos los nodos
    allNodes.forEach((node) => {
      if (node.fusionLinks && Array.isArray(node.fusionLinks)) {
        const fusions = node.fusionLinks.filter(
          (link) =>
            link.fiberId === fiberId ||
            link.src?.fiberId === fiberId ||
            link.dst?.fiberId === fiberId
        );
        fusionCount += fusions.length;
      }
    });

    if (fusionCount > 0) {
      // Mostrar diálogo de confirmación
      Alert.alert(
        t("warning"),
        t("fiberHasFusions", { count: fusionCount }) ||
          `Esta fibra tiene ${fusionCount} fusión(es) activa(s). Si la eliminas, también se eliminarán todas sus fusiones. ¿Deseas continuar?`,
        [
          {
            text: t("cancel") || "Cancelar",
            style: "cancel",
          },
          {
            text: t("delete") || "Eliminar",
            style: "destructive",
            onPress: () => removeFiberAndFusions(fiber, fiberId),
          },
        ]
      );
    } else {
      // No tiene fusiones, eliminar directamente
      removeFiberAndFusions(fiber, fiberId);
    }
  };

  const removeFiberAndFusions = (fiber, fiberId) => {
    // 1. Eliminar la fibra (filtrar en lugar de marcar como deleted)
    const updatedFibers = fibers.filter((f) => {
      const fId = f.id || f.hash;
      return fId !== fiberId;
    });

    console.log(
      `🗑️ Fiber deleted. Total fibers: ${fibers.length} -> ${updatedFibers.length}`
    );
    setFibers(updatedFibers);

    // Track fiber ID and buffer IDs for deletion on save (only if they have DB ids)
    const idsToDelete = [];
    if (fiber.id) {
      idsToDelete.push(fiber.id);
      console.log(`📝 Added fiber ID ${fiber.id} to deletion list`);
    }

    // Also track buffer IDs
    if (fiber.buffers && Array.isArray(fiber.buffers)) {
      fiber.buffers.forEach((buffer) => {
        if (buffer.id) {
          idsToDelete.push(buffer.id);
          console.log(`📝 Added buffer ID ${buffer.id} to deletion list`);
        }
      });
    }

    if (idsToDelete.length > 0) {
      setDeletedFiberIds((prev) => [...prev, ...idsToDelete]);
    }

    // 2. Limpiar fusiones de todos los nodos
    const updatedAllNodes = allNodes.map((node) => {
      if (node.fusionLinks && Array.isArray(node.fusionLinks)) {
        const cleanedLinks = node.fusionLinks.filter((link) => {
          const linkFiberId =
            link.fiberId || link.src?.fiberId || link.dst?.fiberId;
          return linkFiberId !== fiberId;
        });

        if (cleanedLinks.length !== node.fusionLinks.length) {
          console.log(
            `🧹 Cleaned ${
              node.fusionLinks.length - cleanedLinks.length
            } fusion(s) from node: ${node.label}`
          );
          return { ...node, fusionLinks: cleanedLinks };
        }
      }
      return node;
    });
    setAllNodes(updatedAllNodes);

    // 3. Actualizar vista filtrada
    const updatedNodes = nodes.map((node) => {
      const updated = updatedAllNodes.find(
        (n) => (n.id && n.id === node.id) || (n.hash && n.hash === node.hash)
      );
      return updated || node;
    });
    setNodes(updatedNodes);

    console.log("🗑️ Fiber deleted:", fiber.label);
  };

  const handleSeeFiberInfo = (fiber) => {
    let buffers = [
      {
        ...fiber,
        value: fiber.id == undefined ? fiber.hash : fiber.id,
      },
    ];

    fiber.buffers.forEach((b) => {
      const buffer = {
        ...b,
        value: b.id == undefined ? b.hash : b.id,
      };

      buffers = [...buffers, buffer];
    });

    const tmp = {
      buffers: buffers,
      onSaveFiber: (data) => {
        /**Build updated fiber */
        const update = {
          ...data[0],
          buffers: data.slice(1),
        };
        updateLocalFiber(update);
      },
    };

    navigation.navigate("FiberDetails", tmp);
  };

  const handleSeeNodeLinks = (node) => {
    navigation.navigate("NodeLinks", {
      node: node,
      onSaveNode: (data) => {
        updateLocalNode(data);
      },
    });
  };

  const handleSeeNodePath = async (node) => {
    let allNodes = [];

    if (projectId != undefined) {
      allNodes = await getNodes(projectId);
    } else {
      allNodes = [...nodes];
    }

    // extract mdf
    const mdfType = nodesTypesList().find((x) => x.type == "MDF");
    const mdf = allNodes.find((x) => x.typeId == mdfType.id);

    console.log("🛤️ NodePath navigation:", {
      sourceNode: node.label,
      sourceId: node.id || node.hash,
      mdfNode: mdf?.label,
      mdfId: mdf?.id || mdf?.hash,
      totalNodes: allNodes.length,
      totalFibers: fibers.length,
    });

    // NO filtrar nodos - el algoritmo necesita todos los nodos incluyendo origen y destino
    navigation.navigate("NodePath", {
      mdf: mdf,
      node: node,
      nodes: allNodes,
      fibers: fibers,
    });
  };

  const RenderNode = ({ node }) => {
    const mdfType = nodesTypesList().find((x) => x.type == "MDF");

    return (
      <View style={combinedStyles.fiberCard}>
        <View style={combinedStyles.deviceHeader}>
          <View style={combinedStyles.deviceInfo}>
            <Text style={combinedStyles.deviceName}>{node.label} </Text>
            <Text style={combinedStyles.deviceDescription}></Text>
          </View>

          {/**PATH */}

          {node.typeId != mdfType.id && (
            <TouchableOpacity
              disabled={projectId == undefined}
              style={{ marginRight: 3 }}
              onPress={() => handleSeeNodePath(node)}
            >
              <svg
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#666261ff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 17h4v4h-4z" />
                <path d="M17 3h4v4h-4z" />
                <path d="M11 19h5.5a3.5 3.5 0 0 0 0 -7h-8a3.5 3.5 0 0 1 0 -7h4.5" />
              </svg>
            </TouchableOpacity>
          )}

          {/**FUSION LINK - No mostrar para MDF y UNIT */}
          {(() => {
            const unitType = nodesTypesList().find((x) => x.type === "U");
            const showFusionLink =
              node.typeId != mdfType.id && node.typeId != unitType?.id;

            return (
              showFusionLink && (
                <TouchableOpacity
                  disabled={projectId == undefined}
                  style={{ marginRight: 3 }}
                  onPress={() => handleSeeNodeLinks(node)}
                >
                  <Ionicons
                    name="git-network"
                    size={24}
                    color={
                      projectId == undefined || projectId == null
                        ? "#cfcbcaff"
                        : "#666261ff"
                    }
                  />
                </TouchableOpacity>
              )
            );
          })()}

          {/**LOCATION */}
          {/* <TouchableOpacity style={{ marginRight: 3 }}>
            <Ionicons name="location" size={24} color={"#666261ff"} />
          </TouchableOpacity> */}

          {/**MEDIA */}
          <TouchableOpacity
            onPress={() => {
              handleSeeNodeMedia(node);
            }}
            style={{ marginRight: 3 }}
          >
            <Ionicons name="attach" size={24} color={"#666261ff"} />
          </TouchableOpacity>

          {/**INFO */}
          <TouchableOpacity
            onPress={() => {
              handleSeeNodeInfo(node);
            }}
            style={{ marginRight: 3 }}
          >
            <Ionicons name="information-circle" size={24} color={"#666261ff"} />
          </TouchableOpacity>

          {/**REMOVE */}
          {node.typeId != mdfType.id && (
            <TouchableOpacity
              style={dynamicStyles.removeButton}
              onPress={() => handleRemoveNode(node)}
            >
              <Ionicons name="trash" size={24} color={"salmon"} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // Combinar estilos estáticos con dinámicos
  const combinedStyles = {
    ...styles,
    ...dynamicStyles,
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
      <View style={[combinedStyles.header, { paddingTop: topInset - 20 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={combinedStyles.headerTitle}>
          {isEditMode ? t("editProject") : t("createProject")}
        </Text>
        <View style={styles.headerActions}>
          {isEditMode && (
            <TouchableOpacity
              onPress={clearForm}
              style={styles.clearButton}
              disabled={saving}
            >
              <Ionicons name="add" size={24} color={colors.primary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => setProjectSelectorVisible(true)}
            style={styles.selectProjectButton}
            disabled={saving}
          >
            <Ionicons name="folder-open" size={24} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSaveProject} disabled={saving}>
            <Ionicons
              name="save"
              size={24}
              color={saving ? colors.secondaryText : colors.primary}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={combinedStyles.scrollContent}
      >
        {/* Property Information */}
        <View style={combinedStyles.section}>
          <Text style={combinedStyles.sectionTitle}>
            {t("propertyInformation")}
          </Text>

          <View style={combinedStyles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={[combinedStyles.label, { color: colors.text }]}>
                {t("propertyName")} *
              </Text>
              <TextInput
                style={combinedStyles.input}
                value={projectData.name}
                onChangeText={(text) => handleInputChange("name", text)}
                placeholder={t("propertyName")}
                editable={!saving}
                placeholderTextColor={colors.placeholder}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={combinedStyles.label}>{t("propertyAddress")} *</Text>
              <TextInput
                style={combinedStyles.input}
                value={projectData.address}
                onChangeText={(text) => handleInputChange("address", text)}
                placeholder={t("enterAddress")}
                editable={!saving}
                placeholderTextColor={colors.placeholder}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={combinedStyles.label}>{t("city")}</Text>
                <TextInput
                  style={combinedStyles.input}
                  value={projectData.city}
                  onChangeText={(text) => handleInputChange("city", text)}
                  placeholder={t("city")}
                  editable={!saving}
                  placeholderTextColor={colors.placeholder}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={combinedStyles.label}>{t("state")}</Text>
                <TextInput
                  style={combinedStyles.input}
                  value={projectData.state}
                  onChangeText={(text) => handleInputChange("state", text)}
                  placeholder={t("state")}
                  maxLength={2}
                  editable={!saving}
                  placeholderTextColor={colors.placeholder}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={combinedStyles.label}>{t("description")}</Text>
              <TextInput
                style={[combinedStyles.input, styles.textArea]}
                value={projectData.description}
                onChangeText={(text) => handleInputChange("description", text)}
                placeholder={t("projectDescription")}
                multiline={true}
                editable={!saving}
                placeholderTextColor={colors.placeholder}
              />
            </View>
          </View>
        </View>

        {/* Unit Information */}
        <View style={combinedStyles.section}>
          <Text style={combinedStyles.sectionTitle}>
            {t("unitInformation")}
          </Text>

          <View style={combinedStyles.formCard}>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={combinedStyles.label}>{t("livingUnits")}</Text>
                <TextInput
                  style={combinedStyles.input}
                  value={unitsInfo.living_unit}
                  onChangeText={(text) =>
                    handleUnitsChange("living_unit", text)
                  }
                  placeholder="0"
                  keyboardType="numeric"
                  editable={!saving}
                  placeholderTextColor={colors.placeholder}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={combinedStyles.label}>
                  {t("officesAmenities")}
                </Text>
                <TextInput
                  style={combinedStyles.input}
                  value={unitsInfo.office_amenities}
                  onChangeText={(text) =>
                    handleUnitsChange("office_amenities", text)
                  }
                  placeholder="0"
                  keyboardType="numeric"
                  editable={!saving}
                  placeholderTextColor={colors.placeholder}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={combinedStyles.label}>{t("commercialUnits")}</Text>
                <TextInput
                  style={combinedStyles.input}
                  value={unitsInfo.commercial_unit}
                  onChangeText={(text) =>
                    handleUnitsChange("commercial_unit", text)
                  }
                  placeholder="0"
                  keyboardType="numeric"
                  editable={!saving}
                  placeholderTextColor={colors.placeholder}
                />
              </View>
            </View>

            <View style={combinedStyles.totalUnits}>
              <Text style={combinedStyles.totalLabel}>{t("totalUnits")}:</Text>
              <Text style={combinedStyles.totalValue}>
                {calculateTotalUnits()}
              </Text>
            </View>
          </View>
        </View>

        {/* Nodos */}
        <View style={combinedStyles.section}>
          <View style={combinedStyles.deviceHeader}>
            <Text style={combinedStyles.sectionTitle}>{t("netNodes")}</Text>
            <View style={{ flexDirection: "row" }}>
              <TouchableOpacity
                onPress={handleConnectionMap}
                style={styles.clearButton}
                disabled={saving}
              >
                <Ionicons name="link" size={24} color={colors.primary} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleNodesFilterSelect}
                style={styles.clearButton}
                disabled={saving}
              >
                <Ionicons name="filter" size={24} color={colors.primary} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={addNode}
                style={styles.clearButton}
                disabled={saving}
              >
                <Ionicons name="add-circle" size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {nodes.length == 0 && (
            <Text style={[combinedStyles.label, { color: colors.text }]}>
              {t("nodesEmpty")}
            </Text>
          )}

          <View>
            {nodes
              .filter((x) => (x.deleted || false) == false)
              .map((item, index) => (
                <RenderNode key={item.id || index} node={item} />
              ))}
          </View>
        </View>

        {/* Fibras */}
        <View style={combinedStyles.section}>
          <View style={combinedStyles.deviceHeader}>
            <Text style={combinedStyles.sectionTitle}>{t("netFibers")}</Text>
            <TouchableOpacity
              onPress={addFiber}
              style={styles.clearButton}
              disabled={saving}
            >
              <Ionicons name="add-circle" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {fibers.length == 0 && (
            <Text style={[combinedStyles.label, { color: colors.text }]}>
              {t("fibersEmpty")}
            </Text>
          )}

          <View>
            {fibers.map((item, index) => (
              <RenderFiber key={item.id || index} fiber={item} />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* // QR Code Modal mejorado */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={qrModalVisible}
        onRequestClose={() => setQrModalVisible(false)}
      >
        <View style={combinedStyles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={combinedStyles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={combinedStyles.modalTitle}>
                  {t("projectQRCode")}
                </Text>
                <TouchableOpacity onPress={() => setQrModalVisible(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <View style={combinedStyles.qrContainer}>
                {/* <ViewShot ref={ref => (this.viewShot = ref)} options={{ format: 'png', quality: 0.9 }}> */}
                <View ref={qrRef} collapsable={false} style={styles.qrWrapper}>
                  <QRCode
                    value={generateProjectQR()}
                    size={200}
                    color={colors.qrtext}
                    backgroundColor="white"
                  />
                </View>

                {/* </ViewShot> */}
              </View>

              <Text style={combinedStyles.qrDescription}>
                {t("scanQRDescription")}
              </Text>

              {/* Nuevos botones de acción para el QR */}
              <View style={styles.qrActionButtons}>
                <TouchableOpacity
                  style={[styles.qrActionButton, styles.saveQrButton]}
                  onPress={handleSave}
                >
                  <Ionicons name="download-outline" size={20} color="white" />
                  <Text style={styles.qrActionButtonText}>{t("saveQR")}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.qrActionButton, styles.shareQrButton]}
                  onPress={handleShare}
                >
                  <Ionicons name="share-outline" size={20} color="white" />
                  <Text style={styles.qrActionButtonText}>
                    {t("shareAsImage")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Project Selector Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={projectSelectorVisible}
        onRequestClose={() => setProjectSelectorVisible(false)}
      >
        <View style={combinedStyles.modalOverlay}>
          <View style={[styles.modalContainer, styles.selectorModal]}>
            <View style={combinedStyles.modalContent}>
              <Text style={combinedStyles.modalTitle}>
                {t("selectProjectToEdit")}
              </Text>

              <ScrollView style={styles.projectList}>
                {existingProjects.map((project) => (
                  <TouchableOpacity
                    key={project.id}
                    style={combinedStyles.projectItem}
                    onPress={() => selectProjectToEdit(project)}
                  >
                    <Ionicons
                      name="business"
                      size={24}
                      color={colors.primary}
                    />
                    <View style={styles.projectInfo}>
                      <Text style={combinedStyles.projectName}>
                        {project.name}
                      </Text>
                      <Text style={combinedStyles.projectAddress}>
                        {project.address}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={colors.secondaryText}
                    />
                  </TouchableOpacity>
                ))}

                {existingProjects.length === 0 && (
                  <Text style={combinedStyles.noProjectsText}>
                    {t("noProjectsFound")}
                  </Text>
                )}
              </ScrollView>

              <TouchableOpacity
                style={[styles.closeModalButton, styles.cancelButton]}
                onPress={() => setProjectSelectorVisible(false)}
              >
                <Text style={styles.closeModalText}>{t("cancel")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Fiber Modal */}
      <Modal
        visible={showAddFiberModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddFiberModal(false)}
      >
        <View style={dynamicStyles.modalOverlay}>
          <View style={dynamicStyles.modalContent}>
            <Text style={dynamicStyles.modalTitle}>
              {t("selectFiberTypesQuantities")}
            </Text>
            <FlatList
              data={fiberTypesList}
              keyExtractor={(item) => item.typeId}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={dynamicStyles.modalItem}
                  onPress={() => handleOnSelectFiberType(item)}
                >
                  <Text style={dynamicStyles.modalItemText}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Add Node Modal */}
      <Modal
        visible={showAddNodeModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddNodeModal(false)}
      >
        <View style={dynamicStyles.modalOverlay}>
          <View style={dynamicStyles.modalContent}>
            <Text style={dynamicStyles.modalTitle}>
              {t("selectFiberTypesQuantities")}
            </Text>
            <FlatList
              data={nodesTypesList().filter((x) => x.visible == true)}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={dynamicStyles.modalItem}
                  onPress={() => handleNodeSelect(item)}
                >
                  <Text style={dynamicStyles.modalItemText}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Show Filter Nodes Modal */}
      <Modal
        visible={showFilterNodesModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddNodeModal(false)}
      >
        <View style={dynamicStyles.modalOverlay}>
          <View style={dynamicStyles.modalContent}>
            <Text style={dynamicStyles.modalTitle}>
              {t("filterNodesModalTitle")}
            </Text>
            <FlatList
              data={nodesFiltersList}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={dynamicStyles.modalItem}
                  onPress={() => handleFilterNodeSelect(item)}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 3,
                    }}
                  >
                    {selectedNodesFilter.id == item.id && (
                      <Ionicons
                        name="checkmark"
                        size={24}
                        color={colors.primary}
                      />
                    )}

                    <Text style={dynamicStyles.modalItemText}>{item.name}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Show Closing Project */}
      <Modal
        visible={showCloseProjectModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCloseProjectModal(false)}
      >
        <View style={dynamicStyles.modalOverlay}>
          <View style={dynamicStyles.modalContent}>
            <Text style={dynamicStyles.modalTitle}>{t("Proyecto")}</Text>

            {saving && (
              <View>
                <Text style={dynamicStyles.modalItem}>{t("saving")}</Text>
                <ActivityIndicator size="large" />
              </View>
            )}

            {!saving && (
              <View>
                <Text style={dynamicStyles.modalItem}>{t("projectSaved")}</Text>
              </View>
            )}

            <View
              style={{
                marginTop: 20,
                flexDirection: "row",
                justifyContent: "space-between",
                gap: 5,
              }}
            >
              <Button
                onPress={() => navigation.goBack()}
                title={t("buttonNo")}
                color="salmon"
                accessibilityLabel="Learn more about this purple button"
              />
              <Button
                onPress={async () => {
                  setShowCloseProjectModal(false);
                  if (createdProjId) {
                    setProjectId(createdProjId);
                    setIsEditMode(true);
                    // Recargar datos completos
                    await loadProjectData(createdProjId);
                  }
                }}
                disabled={saving}
                title={t("buttonYes")}
                color={colors.primary}
                accessibilityLabel="Learn more about this purple button"
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default CreateProject;
