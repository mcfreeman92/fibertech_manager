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
import QRCode from 'react-native-qrcode-svg';
import { captureRef } from 'react-native-view-shot';
import * as DocumentPicker from 'expo-document-picker';
import { Picker } from '@react-native-picker/picker';
import { ProjectService, UnitsService, ProjectTypeService, NodeService, FileService } from '../../service/storage';
import { useTranslation } from '../hooks/useTranslation';
import { useApp } from '../context/AppContext';
import { useDevice } from '../context/DeviceContext';

/** ADAPTER PARA LOS DATOS */
import { useAdapter } from '@/api/contexts/DatabaseContext';


import { generateHash } from '../../utils/utils'

import { v4 as uuidv4 } from 'uuid';

// import ViewShot from 'react-native-view-shot';
// import CameraRoll from '@react-native-cameraroll/cameraroll';
import * as MediaLibrary from 'expo-media-library';

const CreateProject = ({ navigation, route, theme }) => {
  const { createProject, updateProject, getProjectById, createNode, createFiber, getFibers, getFiberById, getNodes } = useAdapter()();

  const { topInset, isTablet, bottomInset, stylesFull } = useDevice();
  const { projectId } = route.params || {};
  const isEditMode = !!projectId;
  const qrRef = useRef();
  const [qrData, setQrData] = useState(null);

  const fiberTypesList = [
    { typeId: '12F', name: '12F', description: 'fiber12FDescription', buffersCount: 1 },
    { typeId: '24F', name: '24F', description: 'fiber24FDescription', buffersCount: 2 },
    { typeId: '48F', name: '48F', description: 'fiber48FDescription', buffersCount: 4 },
    { typeId: '96F', name: '96F', description: 'fiber96FDescription', buffersCount: 8 },
    { typeId: '192F', name: '192F', description: 'fiber192FDescription', buffersCount: 16 }
  ];

  const sinleFiberTpeId = '12F';



  // const viewShotRef = useRef();
  const { t } = useTranslation();
  const { isDarkMode } = useApp();

  const [showAddFiberModal, setShowAddFiberModal] = useState(false);
  const [showAddNodeModal, setShowAddNodeModal] = useState(false);

  const [showFilterNodesModal, setShowFilterNodesModal] = useState(false);

  const [fibers, setFibers] = useState([]);
  const [nodes, setNodes] = useState([]);

  // Colores dinámicos basados en el tema
  const colors = {
    background: isDarkMode ? '#121212' : '#f5f7fa',
    cardBackground: isDarkMode ? '#1e1e1e' : 'white',
    text: isDarkMode ? '#ffffff' : '#2c3e50',
    qrtext: '#2c3e50',
    secondaryText: isDarkMode ? '#b0b0b0' : '#7f8c8d',
    border: isDarkMode ? '#333333' : '#e1e8ed',
    inputBackground: isDarkMode ? '#2a2a2a' : '#f8f9fa',
    placeholder: isDarkMode ? '#888888' : '#a0a0a0',
    primary: '#3498db',
    success: '#2ecc71',
    warning: '#f39c12',
    danger: '#e74c3c',
    purple: '#9b59b6'
  };


  // Tipos disponibles de dispositivos y fibras
  const deviceTypes = [
    { id: 'switch', name: 'Switch', description: 'ethernetSwitching', defaultPorts: 24 },
    { id: 'router', name: 'Router', description: 'networkRouting', defaultPorts: 8 },
    { id: 'access_point', name: 'Access Point', description: 'wirelessConnectivity', defaultPorts: 4 },
    { id: 'olt', name: 'OLT', description: 'opticalLineTerminal', defaultPorts: 16 },
    { id: 'ont', name: 'ONT', description: 'opticalNetworkTerminal', defaultPorts: 1 },
    { id: 'splitter', name: 'Splitter', description: 'opticalSignalSplitting', defaultPorts: 8 }
  ];



  const fiberColors12Hex = [
    { index: 0, color: '#0000FF' },
    { index: 1, color: '#FFA500' },
    { index: 2, color: '#008000' },
    { index: 3, color: '#A52A2A' },
    { index: 4, color: '#708090' },
    { index: 5, color: '#FFFFFF' },
    { index: 6, color: '#FF0000' },
    { index: 7, color: '#000000' },
    { index: 8, color: '#FFFF00' },
    { index: 9, color: '#EE82EE' },
    { index: 10, color: '#FFC0CB' },
    { index: 11, color: '#00FFFF' }
  ];

  // Tipos disponibles de dispositivos y fibras
  const nodesTypesList = [
    { id: 1, name: 'MDF', type: 'MDF' },
    { id: 2, name: 'IDF', type: 'IDF' },
    { id: 3, name: 'UNIT', type: 'U' },
  ];

  const nodesFiltersList = [
    { id: 0, name: t('allNodeFilter'), type: 'ALL' },
    { id: 1, name: 'MDF', type: 'MDF' },
    { id: 2, name: 'IDF', type: 'IDF' },
    { id: 3, name: 'UNIT', type: 'U' },
  ];

  const [selectedNodesFilter, setSelectedNodesFilter] = useState(nodesFiltersList[1]);

  const handleNodesFilterSelect = () => {
    setShowFilterNodesModal(true);
  }

  const handleFilterNodeSelect = (filter) => {
    setSelectedNodesFilter(filter);
    setShowFilterNodesModal(false);

    /** update nodes list */
    getNodes(projectId).then(result => {
      if (filter.id == 0)
        setNodes(result);
      else
        setNodes(result.filter(x => x.typeId == filter.id));
    }).catch(e => {

    })

  }

  // Estilos base (sin colores específicos para mantener la estructura)
  const styles = StyleSheet.create({
    backButton: {
      padding: 5,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
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
      textAlignVertical: 'top',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    pickerContainerIOS: {
      height: 50,
      justifyContent: 'center',
    },
    picker: {
      height: 50,
    },
    pickerIOS: {
    },
    attachmentsList: {
      marginTop: 15,
    },
    fileInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: 12,
    },
    fileDetails: {
      flex: 1,
    },
    actionButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 10,
      padding: 14,
      gap: 8,
    },
    qrButton: {
      backgroundColor: '#9b59b6',
    },
    shareButton: {
      backgroundColor: '#2ecc71',
    },
    saveButton: {
      backgroundColor: '#3498db',
    },
    saveButtonDisabled: {
      backgroundColor: '#bdc3c7',
    },
    actionButtonText: {
      color: 'white',
      fontWeight: '600',
      fontSize: 15,
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    modalContainer: {
      width: '100%',
      maxWidth: 400,
      borderRadius: 16,
      overflow: 'hidden',
    },
    selectorModal: {
      maxHeight: '80%',
    },
    closeModalButton: {
      backgroundColor: '#3498db',
      borderRadius: 10,
      padding: 15,
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: '#e74c3c',
      marginTop: 10,
    },
    closeModalText: {
      color: 'white',
      fontWeight: '600',
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
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: 10,
      marginBottom: 20,
    },
    qrActionButton: {
      flex: 1,
      minWidth: '45%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
      padding: 12,
      gap: 8,
    },
    saveQrButton: {
      backgroundColor: '#3498db',
    },
    shareQrButton: {
      backgroundColor: '#2ecc71',
    },
    shareDataButton: {
      backgroundColor: '#9b59b6',
    },
    qrActionButtonText: {
      color: 'white',
      fontWeight: '600',
      fontSize: 14,
      textAlign: 'center',
    },
    qrWrapper: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 10,
    },
    container: {
      flex: 1,
      marginTop: 0,
    },
    tabHeader: {
      flexDirection: 'row',
      backgroundColor: '#f0f0f0',
    },
    tabButton: {
      flex: 1,
      paddingVertical: 15,
      alignItems: 'center',
    },
    activeTabButton: {
      borderBottomWidth: 2,
      borderBottomColor: '#3498db',
    },
    tabText: {
      fontSize: 16,
      color: '#666',
    },
    activeTabText: {
      color: '#3498db',
      fontWeight: 'bold',
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    fiberCard: {
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
    },
    deviceInfo: {
      flex: 1,
    },
    fiberCard: {
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
    deviceName: {
      fontSize: 16,
      fontWeight: '500',
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
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
  });

  const [projectData, setProjectData] = useState({
    name: '',
    address: '',
    city: '',
    country: '',
    state: '',
    description: '',
    status: 'active'
  });

  const [unitsInfo, setUnitsInfo] = useState({
    living_unit: '0',
    office_amenities: '0',
    commercial_unit: '0'
  });

  const [projectType, setProjectType] = useState({
    build_type: 'MDU',
    job_type: 'Residential',
    building_type: 'Garden Style'
  });

  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    { id: 0, title: 'Home', content: 'Contenido de Home' },
    { id: 1, title: 'Settings', content: 'Contenido de Settings' },
    { id: 2, title: 'Profile', content: 'Contenido de Profile' },
  ];

  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [existingProjects, setExistingProjects] = useState([]);
  const [projectSelectorVisible, setProjectSelectorVisible] = useState(false);

  useEffect(() => {

    const initializeNode = async () => {
      const hash = uuidv4();
      setNodes([
        {
          hash: hash,
          label: `MDF`,
          createdDate: new Date().toISOString(),
          modifiedDate: new Date().toISOString(),
          deleted: 0,
          typeId: 1,
          devices: []
        }
      ]);
    };

    initializeNode();

    loadExistingProjects();

    if (isEditMode) {
      loadProjectData();
    }
  }, [projectId]);

  const loadExistingProjects = async () => {
    try {
      const projects = await ProjectService.getProjects();
      setExistingProjects(projects);

    } catch (error) {
      console.log('Error loading projects:', error);
    }
  };

  const loadProjectData = async () => {
    try {
      setSaving(true);

      // Cargar datos del proyecto
      const data = await getProjectById(projectId);
      const project = data.meta;
      if (project) {
        setProjectData({
          name: project.name || '',
          address: project.address || '',
          city: project.city || '',
          country: project.country || '',
          state: project.state || '',
          description: project.description || '',
          status: project.status || 'active'
        });
      }

      /**Load nodes and fibers */
      const dbNodes = await getNodes(projectId);
      setNodes(dbNodes);

      let records = await getFibers(projectId, null);
      let dbFibers = [];

      for (let f of records) {
        const buffers = await getFibers(projectId, f.id);
        dbFibers.push({
          ...f,
          buffers: buffers
        });
      }

      setFibers(dbFibers);

      // Cargar información de unidades
      const units = project.unitsInfo;
      if (units) {
        setUnitsInfo({
          living_unit: units.living_unit?.toString() || '0',
          office_amenities: units.office_amenities?.toString() || '0',
          commercial_unit: units.commercial_unit?.toString() || '0'
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
      console.log('Error loading project data:', error);
      Alert.alert(t('error'), t('failedToLoadProject'));
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
  }

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
    const living = parseInt(unitsInfo.living_unit || '0');
    const offices = parseInt(unitsInfo.office_amenities || '0');
    const commercial = parseInt(unitsInfo.commercial_unit || '0');
    return living + offices + commercial;
  };

  const handleInputChange = (field, value) => {
    setProjectData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleUnitsChange = (field, value) => {
    // Solo permitir números
    if (/^\d*$/.test(value)) {
      setUnitsInfo(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleTypeChange = (field, value) => {
    setProjectType(prev => ({
      ...prev,
      [field]: value
    }));
  };


  const attachFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true
      });

      if (result.type === 'success') {
        const fileInfo = {
          name: result.name,
          uri: result.uri, // Guardamos la URI/ruta del archivo
          size: result.size,
          type: result.mimeType,
          lastModified: result.lastModified
        };
        setAttachedFiles(prev => [...prev, fileInfo]);
        Alert.alert(t('success'), t('fileAttachedSuccess'));
      }
    } catch (error) {
      Alert.alert(t('error'), t('failedToAttachFile') + error.message);
    }
  };

  const removeFile = (index) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const generateProjectQR = () => {
    const projectSummary = {
      projectId: projectId,
      project: {
        ...projectData,
        created: new Date().toISOString(),
        status: 'draft'
      },
      units: {
        ...unitsInfo,
        total: calculateTotalUnits()
      },
      type: projectType,
      files: attachedFiles.map(file => ({
        name: file.name,
        uri: file.uri, // Solo guardamos la URI/ruta del archivo
        type: file.type,
        size: file.size
      })),
      metadata: {
        generated: new Date().toISOString(),
        app: 'FTTH Project Manager',
        version: '1.0'
      }
    };
    // setQrData(projectSummary)
    // console.log("SIIIII " + JSON.stringify(projectSummary))
    return JSON.stringify(projectSummary);
  };

  const shareProject = async () => {
    try {
      const result = await Share.share({
        message: `${t('ftthProject')}: ${projectData.name}\n${t('address')}: ${projectData.address}\n${t('totalUnits')}: ${calculateTotalUnits()}\n\n${t('scanQRForDetails')}`,
        title: t('ftthProjectDetails')
      });
    } catch (error) {
      Alert.alert(t('error'), t('failedToShare'));
    }
  };

  const addFiber = (fiberType) => {
    const newFiber = {
      hash: uuidv4(),
      count: 1,
      typeId: fiberType.typeId,
      label: fiberType.name,
      description: fiberType.name
    };

    setShowAddFiberModal(true);
  };

  const addNode = () => {
    setShowAddNodeModal(true);
  };

  const handleConnectionMap = () => {

  }

  const buildFiberThreads = () => {
    let items = [];
    for (let i = 0; i < 12; i++) {
      const color = fiberColors12Hex.at(i);
      items = [...items, {
        number: i + 1,
        color: color.color,
        active: true
      }]
    }

    return items;
  }

  const buildFiber = (label, typeId) => {
    const newFiber = {
      hash: uuidv4(),
      label: label,
      createdDate: new Date().toISOString(),
      modifiedDate: new Date().toISOString(),
      deleted: 0,
      typeId: typeId,
      threads: buildFiberThreads(),
      buffers: []
    }

    return newFiber;
  }

  const handleOnSelectFiberType = (fiberType) => {

    let fiber = buildFiber(fiberType.name, fiberType.typeId);

    let buffers = [];

    if (fiberType.buffersCount > 1) {
      /**Build buffers */
      for (let i = 0; i < fiberType.buffersCount - 1; i++) {
        const buffer = buildFiber(`${fiberType.name} - ${i + 1}`, sinleFiberTpeId);
        buffers.push(buffer);
      }
    }

    fiber.buffers = buffers;

    setFibers(prev => [...prev, fiber]);
    setShowAddFiberModal(false);
  }

  const handleNodeSelect = (nodeType) => {
    const newNode = {
      label: `${nodeType.name} - ${nodes.length + 1}`,
      createdDate: new Date().toISOString(),
      modifiedDate: new Date().toISOString(),
      deleted: 0,
      typeId: nodeType.id,
    }
    setNodes(prev => [...prev, newNode]);
    setShowAddNodeModal(false);
  }

  const handleSaveProject = async () => {
    if (saving) return;

    setSaving(true);
    try {
      if (!projectData.name?.trim() || !projectData.address?.trim()) {
        Alert.alert(t('error'), t('nameAndAddressRequired'));
        setSaving(false);
        return;
      }

      console.log('💾 Starting save process...');

      // Modo creación: Crear nuevo proyecto
      let meta = await ProjectService.createProject({
        name: projectData.name.trim(),
        address: projectData.address.trim(),
        city: projectData.city || '',
        country: projectData.country || 'USA',
        state: projectData.state || '',
        description: projectData.description || '',
        status: 'active',
        unitsInfo: {
          living_unit: unitsInfo.living_unit || '0',
          office_amenities: unitsInfo.office_amenities || '0',
          commercial_unit: unitsInfo.commercial_unit || '0'
        }
      });


      const prjData = {
        name: meta.name,
        metadata: JSON.stringify(meta)
      }

      if (isEditMode) {
        await updateProject(projectId, prjData);

        /**Persist new nodes */
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];

          if (node.id == undefined) {
            const meta = JSON.stringify(node.devices);

            const dbNode = await createNode({
              label: node.label,
              projectId: project.id,
              typeId: node.typeId || '',
              description: '',
              metadata: meta,
              createdDate: node.createdDate,
              modifiedDate: node.modifiedDate,
            });
          }
        }

        /**Persist new fibers */
        for (let i = 0; i < fibers.length; i++) {
          const fiber = fibers[i];

          const meta = JSON.stringify(fiber.threads);

          const dbFiber = await createFiber({
            label: fiber.label,
            projectId: project.id,
            typeId: fiber.typeId || sinleFiberTpeId,
            description: '',
            metadata: meta,
            createdDate: fiber.createdDate,
            modifiedDate: fiber.modifiedDate,
          });

          /**Save buffers */
          for (let j = 0; j < fiber.buffers.length; j++) {
            const buffer = fiber.buffers[j];

            const meta2 = JSON.stringify(buffer.threads);

            await createFiber({
              label: buffer.label,
              projectId: project.id,
              parentId: dbFiber.id,
              typeId: buffer.typeId || sinleFiberTpeId,
              description: '',
              metadata: meta2,
              createdDate: buffer.createdDate,
              modifiedDate: buffer.modifiedDate,
            });
          }

        }

      } else {
        /**Persist on db or API storage */
        const project = await createProject(prjData);

        /**Persist nodes */
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          const meta = JSON.stringify(node.devices);

          const dbNode = await createNode({
            label: node.label,
            projectId: project.id,
            typeId: node.typeId || '',
            description: '',
            metadata: meta,
            createdDate: node.createdDate,
            modifiedDate: node.modifiedDate,
          });
        }

        /**Persist fibers */
        for (let i = 0; i < fibers.length; i++) {
          const fiber = fibers[i];

          const meta = JSON.stringify(fiber.threads);

          const dbFiber = await createFiber({
            label: fiber.label,
            projectId: project.id,
            typeId: fiber.typeId || sinleFiberTpeId,
            description: '',
            metadata: meta,
            createdDate: fiber.createdDate,
            modifiedDate: fiber.modifiedDate,
          });

          /**Save buffers */
          for (let j = 0; j < fiber.buffers.length; j++) {
            const buffer = fiber.buffers[j];

            const meta2 = JSON.stringify(buffer.threads);

            await createFiber({
              label: buffer.label,
              projectId: project.id,
              parentId: dbFiber.id,
              typeId: buffer.typeId || sinleFiberTpeId,
              description: '',
              metadata: meta2,
              createdDate: buffer.createdDate,
              modifiedDate: buffer.modifiedDate,
            });
          }

        }
      }

    } catch (error) {
      console.log('❌ Error saving project:', error);
      Alert.alert('❌ ' + t('error'), t(isEditMode ? 'failedToUpdate' : 'failedToSave'));
    } finally {
      setSaving(false);
      navigation.goBack();
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const clearForm = () => {
    setProjectData({
      name: '',
      address: '',
      city: '',
      country: '',
      state: '',
      description: '',
      status: 'active'
    });
    setUnitsInfo({
      living_unit: '0',
      office_amenities: '0',
      commercial_unit: '0'
    });
    setProjectType({
      build_type: 'MDU',
      job_type: 'Residential',
      building_type: 'Garden Style'
    });
    setAttachedFiles([]);
    navigation.setParams({ projectId: null });
  };


  const saveQRCodeToGallery = async () => {
    Alert.alert(
      t('saveQR'),
      t('saveQRMessage'),
      [
        {
          text: t('cancel'),
          style: 'cancel'
        },
        {
          text: t('copyData'),
          onPress: async () => {
            try {
              const qrData = generateProjectQR();
              Clipboard.setString(qrData);
              Alert.alert(t('success'), t('qrDataCopied'));
            } catch (error) {
              Alert.alert(t('error'), t('failedToSaveQR'));
            }
          }
        },
        {
          text: t('takeScreenshot'),
          onPress: () => {
            Alert.alert(t('info'), t('screenshotInstructions'));
          }
        }
      ]
    );
  };

  const handleSave = async () => {
    if (saving) return;

    Alert.alert(
      t('saveQRCode'),
      t('confirmSaveQR'),
      [
        {
          text: t('cancel'),
          style: 'cancel'
        },
        {
          text: t('save'),
          onPress: saveQRCode,
          style: 'default'
        }
      ]
    );
  };

  const captureQRCode = async () => {
    try {
      // Asegúrate de que el QR esté renderizado antes de capturarlo
      await new Promise(resolve => setTimeout(resolve, 100));

      // Capturar el componente QR como imagen
      const uri = await captureRef(qrRef, {
        format: 'png',
        quality: 1,
      });

      return uri;
    } catch (error) {
      console.error('Error capturing QR code:', error);
      throw error;
    }
  };


  const shareQRCode = async () => {
    try {
      setSaving(true);
      const qrImageUri = await captureQRCode();

      const projectName = projectData.name || 'Unnamed Project';
      const message = t('shareProjectMessage').replace('{projectName}', projectName);

      const shareOptions = {
        title: t('shareProjectQR'),
        message: message,
        url: qrImageUri,
        type: 'image/png'
      };

      const result = await Share.share(shareOptions);

      if (result.action === Share.sharedAction) {
        Alert.alert(t('success'), t('qrSharedSuccessfully'));
      }
    } catch (error) {
      console.error('Error sharing QR code:', error);
      Alert.alert(t('error'), t('couldNotShareQR'));
    } finally {
      setSaving(false);
    }
  };

  const shareAsData = async () => {
    try {
      const projectName = projectData.name || 'Unnamed Project';
      const message = t('shareProjectMessage').replace('{projectName}', projectName);
      const qrData = generateProjectQR()
      const shareOptions = {
        title: t('shareProjectData'),
        message: ` ${message} \n\n${qrData}`
      };

      const result = await Share.share(shareOptions);

      if (result.action === Share.sharedAction) {
        Alert.alert(t('success'), t('dataSharedSuccessfully'));
      }
    } catch (error) {
      console.error('Error sharing data:', error);
      Alert.alert(t('error'), t('couldNotShareData'));
    }
  };

  const handleShare = async () => {
    if (saving) return;

    Alert.alert(
      t('shareQRCode'),
      t('chooseShareOption'),
      [
        {
          text: t('cancel'),
          style: 'cancel'
        },
        {
          text: t('shareAsImage'),
          onPress: shareQRCode
        },
        {
          text: t('shareAsData'),
          onPress: () => shareAsData()
        }
      ]
    );
  };


  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message: 'App needs access to storage to save QR codes',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
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
      if (Platform.OS === 'android') {
        const hasPermission = await requestStoragePermission();
        if (!hasPermission) {
          Alert.alert(t('error'), t('storagePermissionDenied'));
          return;
        }
      }

      // Solicitar permisos para la galería
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('error'), t('photoLibraryPermissionDenied'));
        return;
      }

      // Capturar el QR como imagen
      const qrImageUri = await captureQRCode();

      // Guardar en la galería
      const asset = await MediaLibrary.createAssetAsync(qrImageUri);

      // Crear álbum si no existe
      const album = await MediaLibrary.getAlbumAsync('FiberQR');
      if (album) {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      } else {
        await MediaLibrary.createAlbumAsync('FiberQR', asset, false);
      }

      Alert.alert(t('success'), t('qrSavedSuccessfully'));
    } catch (error) {
      console.error('Error saving QR code:', error);
      Alert.alert(t('error'), t('couldNotSaveQR'));
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
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 15,
      top: 10,
      backgroundColor: colors.cardBackground,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
      zIndex: 10,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
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
      fontWeight: '700',
      color: colors.text,
      marginBottom: 15,
      paddingLeft: 5,
    },
    formCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 14,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 3,
    },
    label: {
      fontSize: 15,
      fontWeight: '600',
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
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 15,
      marginTop: 10,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    totalLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    totalValue: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.primary,
    },
    pickerContainer: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      backgroundColor: colors.inputBackground,
      overflow: 'hidden',
    },
    attachButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: 10,
      padding: 14,
      backgroundColor: isDarkMode ? 'rgba(52, 152, 219, 0.2)' : 'rgba(52, 152, 219, 0.1)',
      gap: 8,
    },
    attachButtonText: {
      color: colors.primary,
      fontWeight: '600',
      fontSize: 16,
    },
    fileItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 12,
      backgroundColor: colors.inputBackground,
      borderRadius: 8,
      marginBottom: 10,
    },
    fileName: {
      fontSize: 15,
      color: colors.text,
      fontWeight: '500',
    },
    fileSize: {
      fontSize: 13,
      color: colors.secondaryText,
      marginTop: 2,
    },
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
    qrContainer: {
      alignItems: 'center',
      marginVertical: 20,
      padding: 15,
      backgroundColor: 'white',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    qrDescription: {
      fontSize: 15,
      color: colors.secondaryText,
      textAlign: 'center',
      marginBottom: 20,
      lineHeight: 22,
    },
    projectItem: {
      flexDirection: 'row',
      alignItems: 'center',
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
      textAlign: 'center',
      fontSize: 16,
      color: colors.secondaryText,
      padding: 30,
    },
  });

  const RenderFiber = ({ fiber }) => {
    return (
      <View style={combinedStyles.fiberCard}>
        <View style={combinedStyles.deviceHeader}>
          <View style={combinedStyles.deviceInfo}>
            <Text style={combinedStyles.deviceName}>{fiber.label} </Text>
            <Text style={combinedStyles.deviceDescription}>
              {fiber.typeId}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => handleSeeFiberInfo(fiber)}
            style={{ marginRight: 3 }}
          >
            <Ionicons name="information-circle" size={24} color={'#504d4cff'} />
          </TouchableOpacity>
          <TouchableOpacity
            style={dynamicStyles.removeButton}
          >
            <Ionicons name="trash" size={24} color={'#666261ff'} />
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const updateNode = (node) => {
    let index = -1;

    if (node.hash != undefined) {
      index = nodes.findIndex(x => x.hash == node.hash);
    } else {
      index = nodes.findIndex(x => x.id == node.id);
    }

    if (index != -1) {
      let tmp = [...nodes];
      tmp[index] = node;
      setNodes(tmp);
    }
  }


  const handleSeeNodeInfo = (node) => {
    const tmp = {
      node: node,
      onSaveNode: (data) => {
        updateNode(data);
      }
    };

    navigation.navigate('NodeDetails', tmp);
  }

  const updateFiber = (fiber) => {
    let index = -1;

    if (fiber.hash != undefined) {
      index = fibers.findIndex(x => x.hash == fiber.hash);
    } else {
      index = fibers.findIndex(x => x.id == fiber.id);
    }

    if (index != -1) {
      let tmp = [...fibers];
      tmp[index] = fiber;
      setFibers(tmp);
    }
  }

  const handleSeeFiberInfo = (fiber) => {
    let buffers = [{
      ...fiber,
      value: fiber.id == undefined ? fiber.hash : fiber.id
    }];

    fiber.buffers.forEach(b => {
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
          buffers: data.slice(1)
        }
        updateFiber(update);
      }
    };

    navigation.navigate('FiberDetails', tmp);
  }

  const handleSeeNodeLinks = (node) => {
    navigation.navigate('NodeLinks', {
      node: node,
      onSaveNode: (data) => {
        updateNode(data);
      }

    });
  }

  const RenderNode = ({ node }) => {
    return (
      <View style={combinedStyles.fiberCard}>
        <View style={combinedStyles.deviceHeader}>
          <View style={combinedStyles.deviceInfo}>
            <Text style={combinedStyles.deviceName}>{node.label} </Text>
            <Text style={combinedStyles.deviceDescription}>

            </Text>
          </View>

          <TouchableOpacity
            style={{ marginRight: 3 }}
            onPress={() => handleSeeNodeLinks(node)}
          >
            <Ionicons name="git-network" size={24} color={colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={{ marginRight: 3 }}
          >
            <Ionicons name="location" size={24} color={'#666261ff'} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              handleSeeNodeInfo(node);
            }}
            style={{ marginRight: 3 }}
          >
            <Ionicons name="information-circle" size={24} color={'#666261ff'} />
          </TouchableOpacity>


          <TouchableOpacity
            style={dynamicStyles.removeButton}
          >
            <Ionicons name="trash" size={24} color={'#666261ff'} />
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  // Combinar estilos estáticos con dinámicos
  const combinedStyles = {
    ...styles,
    ...dynamicStyles
  };

  return (
    <View style={[stylesFull.screen, { backgroundColor: colors.background }, { paddingBottom: bottomInset }]}>
      {/* Header */}
      <View style={[combinedStyles.header, { paddingTop: topInset - 20 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={combinedStyles.headerTitle}>
          {isEditMode ? t('editProject') : t('createProject')}
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
              name="save-outline"
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
          <Text style={combinedStyles.sectionTitle}>{t('propertyInformation')}</Text>

          <View style={combinedStyles.formCard}>
            <View style={{ flex: isTablet ? 1 : undefined }}>
              <Text style={[combinedStyles.label, { color: colors.text }]}>{t('propertyName')} *</Text>
              <TextInput
                style={combinedStyles.input}
                value={projectData.name}
                onChangeText={(text) => handleInputChange('name', text)}
                placeholder={t('propertyName')}
                editable={!saving}
                placeholderTextColor={colors.placeholder}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={combinedStyles.label}>{t('propertyAddress')} *</Text>
              <TextInput
                style={combinedStyles.input}
                value={projectData.address}
                onChangeText={(text) => handleInputChange('address', text)}
                placeholder={t('enterAddress')}
                editable={!saving}
                placeholderTextColor={colors.placeholder}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={combinedStyles.label}>{t('city')}</Text>
                <TextInput
                  style={combinedStyles.input}
                  value={projectData.city}
                  onChangeText={(text) => handleInputChange('city', text)}
                  placeholder={t('city')}
                  editable={!saving}
                  placeholderTextColor={colors.placeholder}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={combinedStyles.label}>{t('state')}</Text>
                <TextInput
                  style={combinedStyles.input}
                  value={projectData.state}
                  onChangeText={(text) => handleInputChange('state', text)}
                  placeholder={t('state')}
                  maxLength={2}
                  editable={!saving}
                  placeholderTextColor={colors.placeholder}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={combinedStyles.label}>{t('description')}</Text>
              <TextInput
                style={[combinedStyles.input, styles.textArea]}
                value={projectData.description}
                onChangeText={(text) => handleInputChange('description', text)}
                placeholder={t('projectDescription')}
                multiline={true}
                editable={!saving}
                placeholderTextColor={colors.placeholder}
              />
            </View>
          </View>
        </View>

        {/* Nodos */}
        <View style={combinedStyles.section}>
          <View style={combinedStyles.deviceHeader}>
            <Text style={combinedStyles.sectionTitle}>{t('netNodes')}</Text>
            <View style={{ flexDirection: 'row' }}>

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
            <Text style={[combinedStyles.label, { color: colors.text }]}>{t('nodesEmpty')}</Text>
          )}

          <FlatList
            data={nodes}
            keyExtractor={item => nodes.id}
            renderItem={({ item }) => (
              <RenderNode node={item}></RenderNode>
            )}
          />

        </View>

        {/* Fibras */}
        <View style={combinedStyles.section}>
          <View style={combinedStyles.deviceHeader}>
            <Text style={combinedStyles.sectionTitle}>{t('netFibers')}</Text>
            <TouchableOpacity
              onPress={addFiber}
              style={styles.clearButton}
              disabled={saving}
            >
              <Ionicons name="add-circle" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {fibers.length == 0 && (
            <Text style={[combinedStyles.label, { color: colors.text }]}>{t('fibersEmpty')}</Text>
          )}

          <FlatList
            data={fibers}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <RenderFiber fiber={item}></RenderFiber>
            )}
          />

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
                <Text style={combinedStyles.modalTitle}>{t('projectQRCode')}</Text>
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
                {t('scanQRDescription')}
              </Text>

              {/* Nuevos botones de acción para el QR */}
              <View style={styles.qrActionButtons}>
                <TouchableOpacity
                  style={[styles.qrActionButton, styles.saveQrButton]}
                  onPress={handleSave}
                >
                  <Ionicons name="download-outline" size={20} color="white" />
                  <Text style={styles.qrActionButtonText}>{t('saveQR')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.qrActionButton, styles.shareQrButton]}
                  onPress={handleShare}
                >
                  <Ionicons name="share-outline" size={20} color="white" />
                  <Text style={styles.qrActionButtonText}>{t('shareAsImage')}</Text>
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
              <Text style={combinedStyles.modalTitle}>{t('selectProjectToEdit')}</Text>

              <ScrollView style={styles.projectList}>
                {existingProjects.map((project) => (
                  <TouchableOpacity
                    key={project.id}
                    style={combinedStyles.projectItem}
                    onPress={() => selectProjectToEdit(project)}
                  >
                    <Ionicons name="business" size={24} color={colors.primary} />
                    <View style={styles.projectInfo}>
                      <Text style={combinedStyles.projectName}>{project.name}</Text>
                      <Text style={combinedStyles.projectAddress}>{project.address}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.secondaryText} />
                  </TouchableOpacity>
                ))}

                {existingProjects.length === 0 && (
                  <Text style={combinedStyles.noProjectsText}>{t('noProjectsFound')}</Text>
                )}
              </ScrollView>

              <TouchableOpacity
                style={[styles.closeModalButton, styles.cancelButton]}
                onPress={() => setProjectSelectorVisible(false)}
              >
                <Text style={styles.closeModalText}>{t('cancel')}</Text>
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
            <Text style={dynamicStyles.modalTitle}>{t('selectFiberTypesQuantities')}</Text>
            <FlatList
              data={fiberTypesList}
              keyExtractor={item => item.typeId}
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
            <Text style={dynamicStyles.modalTitle}>{t('selectFiberTypesQuantities')}</Text>
            <FlatList
              data={nodesTypesList}
              keyExtractor={item => item.id}
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
            <Text style={dynamicStyles.modalTitle}>{t('filterNodesModalTitle')}</Text>
            <FlatList
              data={nodesFiltersList}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={dynamicStyles.modalItem}
                  onPress={() => handleFilterNodeSelect(item)}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      gap: 3
                    }}
                  >
                    {selectedNodesFilter.id == item.id && (
                      <Ionicons name="checkmark" size={24} color={colors.primary} />
                    )}

                    <Text style={dynamicStyles.modalItemText}>{item.name}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>

      </Modal>

    </View>
  );
};



export default CreateProject;