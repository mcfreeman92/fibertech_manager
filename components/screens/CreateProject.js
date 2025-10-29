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
  PermissionsAndroid
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

import { useDatabase, useAdapter } from '@/api/contexts/DatabaseContext';

// import ViewShot from 'react-native-view-shot';
// import CameraRoll from '@react-native-cameraroll/cameraroll';
import * as MediaLibrary from 'expo-media-library';

const CreateProject = ({ navigation, route, theme }) => {
  const { topInset, isTablet, bottomInset, stylesFull } = useDevice();
  const { projectId } = route.params || {};
  const isEditMode = !!projectId;
  const qrRef = useRef();
  const [qrData, setQrData] = useState(null);

  /** ADAPTER PARA LOS DATOS */
  const { createProject, getProjectById } = useAdapter()();

  // const viewShotRef = useRef();
  const { t } = useTranslation();
  const { isDarkMode } = useApp();

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
      marginBottom: 12,
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
    loadExistingProjects();

    if (isEditMode) {
      loadProjectData();
    }
  }, [projectId]);

  // useEffect(() => {
  //     if (qrModalVisible) {
  //       setQrData(generateQRCode());
  //       console.log(qrData)
  //     } else {
  //       setQrData(null);
  //     }
  //     console.log("Ahora")
  //   }, []);

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

  // const attachFile = async () => {
  //   try {
  //     const result = await DocumentPicker.getDocumentAsync({
  //       type: '*/*',
  //       copyToCacheDirectory: true
  //     });

  //     if (result.type === 'success') {
  //       const fileInfo = {
  //         name: result.name,
  //         uri: result.uri,
  //         size: result.size,
  //         type: result.mimeType,
  //         lastModified: result.lastModified
  //       };
  //       setAttachedFiles(prev => [...prev, fileInfo]);
  //       Alert.alert(t('success'), t('fileAttachedSuccess'));
  //     }
  //   } catch (error) {
  //     Alert.alert(t('error'), t('failedToAttachFile') + error.message);
  //   }
  // };

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

  const saveProjectAndCreateGraph = async () => {
    if (saving) return;

    setSaving(true);
    try {
      if (!projectData.name?.trim() || !projectData.address?.trim()) {
        Alert.alert(t('error'), t('nameAndAddressRequired'));
        setSaving(false);
        return;
      }

      console.log('💾 Starting save process...');

      let targetProjectId = projectId; // Para modo edición

      if (isEditMode) {
        // Modo edición: Actualizar proyecto existente
        await ProjectService.updateProject(projectId, {
          name: projectData.name.trim(),
          address: projectData.address.trim(),
          city: projectData.city || '',
          country: projectData.country || 'USA',
          state: projectData.state || '',
          description: projectData.description || '',
          status: 'active'
        });

        await UnitsService.updateUnitsInfo(projectId, {
          living_unit: unitsInfo.living_unit || '0',
          office_amenities: unitsInfo.office_amenities || '0',
          commercial_unit: unitsInfo.commercial_unit || '0'
        });

        await ProjectTypeService.updateProjectType(projectId, {
          build_type: projectType.build_type || 'MDU',
          job_type: projectType.job_type || 'Residential',
          building_type: projectType.building_type || 'Garden Style'
        });

        console.log('📋 Project updated with ID:', projectId);
      } else {
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


        const project = await createProject({
          name: meta.name,
          metadata: JSON.stringify(meta)
        })

        targetProjectId = project.id; // Actualizar para modo creación
        //console.log('📋 Project saved with ID:', targetProjectId);



        // await ProjectTypeService.saveProjectType(targetProjectId, {
        //   build_type: projectType.build_type || 'MDU',
        //   job_type: projectType.job_type || 'Residential',
        //   building_type: projectType.building_type || 'Garden Style'
        // });

        // if (attachedFiles.length > 0) {
        //   for (const file of attachedFiles) {
        //     await FileService.saveProjectFile(targetProjectId, file);
        //   }
        // }

        // const mdfNode = await NodeService.createNode({
        //   project_id: targetProjectId,
        //   name: 'MDF_Principal',
        //   type: 'MDF',
        //   description: 'Main Distribution Frame'
        // });

        // console.log('🏗️ MDF created with ID:', mdfNode.id);

        // const totalUnits = calculateTotalUnits();
        // if (totalUnits > 0) {
        //   console.log('🔢 Creating', totalUnits, 'units...');

        //   for (let i = 1; i <= totalUnits; i++) {
        //     await NodeService.createNode({
        //       project_id: targetProjectId,
        //       name: `Unit_${i}`,
        //       type: 'unit',
        //       description: `Living unit ${i}`,
        //       parent_node_id: mdfNode.id
        //     });
        //   }
        // }
      }



      navigation.navigate('ConnectivityDevices', {
        projectId: targetProjectId
      })

      // Alert.alert('✅ ' + t('success'), t(isEditMode ? 'projectUpdated' : 'projectCreated'), [
      //   {
      //     text: t('configureNetwork'),
      //     onPress: () => navigation.navigate('ConnectivityDevices', { 
      //       projectId: targetProjectId 
      //     })
      //   },
      //   {
      //     text: t('viewProject'),
      //     onPress: () => navigation.navigate('ProjectDetail', { 
      //       projectId: targetProjectId 
      //     })
      //   }
      // ]);

    } catch (error) {
      console.log('❌ Error saving project:', error);
      Alert.alert('❌ ' + t('error'), t(isEditMode ? 'failedToUpdate' : 'failedToSave'));
    } finally {
      setSaving(false);
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

  // Añade estas funciones después de la función generateProjectQR
  // const saveQRCodeToGallery = async () => {
  //   try {
  //     Alert.alert(
  //       t('saveQR'),
  //       t('saveQRMessage'),
  //       [
  //         {
  //           text: t('cancel'),
  //           style: 'cancel'
  //         },
  //         {
  //           text: t('save'),
  //           onPress: async () => {
  //             // En una implementación real, aquí usarías react-native-view-shot
  //             // para capturar el QR y guardarlo en la galería
  //             Alert.alert(t('info'), t('saveQRInfo'));
  //           }
  //         }
  //       ]
  //     );
  //   } catch (error) {
  //     Alert.alert(t('error'), t('failedToSaveQR'));
  //   }
  // };
  // const saveQRCodeToGallery = async () => {
  //   try {
  //     // Solicitar permisos
  //     const { status } = await MediaLibrary.requestPermissionsAsync();

  //     if (status !== 'granted') {
  //       Alert.alert(t('permissionDenied'), t('galleryPermissionMessage'));
  //       return;
  //     }

  //     // Crear el QR como imagen (usando una aproximación)
  //     // Nota: Para una implementación real necesitarías react-native-view-shot
  //     Alert.alert(
  //       t('saveQR'),
  //       t('saveQRMessage'),
  //       [
  //         {
  //           text: t('cancel'),
  //           style: 'cancel'
  //         },
  //         {
  //           text: t('save'),
  //           onPress: async () => {
  //             try {
  //               // En una implementación real, aquí usarías react-native-view-shot
  //               // Para este ejemplo, mostraremos un mensaje informativo
  //               Alert.alert(
  //                 t('info'), 
  //                 t('saveQRInfo') + '\n\n' + t('qrDataCopied')
  //               );

  //               // Copiar los datos del QR al portapapeles como alternativa
  //               const qrData = generateProjectQR();
  //               Clipboard.setString(qrData);
  //             } catch (error) {
  //               Alert.alert(t('error'), t('failedToSaveQR'));
  //             }
  //           }
  //         }
  //       ]
  //     );
  //   } catch (error) {
  //     Alert.alert(t('error'), t('failedToSaveQR'));
  //   }
  // };
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

  // const shareQRCodeAsImage = async () => {
  //   try {
  //     Alert.alert(
  //       t('shareQR'),
  //       t('shareQRImageMessage'),
  //       [
  //         {
  //           text: t('cancel'),
  //           style: 'cancel'
  //         },
  //         {
  //           text: t('share'),
  //           onPress: async () => {
  //             // En una implementación real, aquí capturarías el QR como imagen
  //             // y lo compartirías usando Share.share
  //             const qrData = generateProjectQR();
  //             Share.share({
  //               message: `${t('ftthProject')}: ${projectData.name}\n${t('qrData')}: ${qrData}`,
  //               title: t('projectQRCode')
  //             });
  //           }
  //         }
  //       ]
  //     );
  //   } catch (error) {
  //     Alert.alert(t('error'), t('failedToShareQR'));
  //   }
  // };

  // const shareQRCodeAsImage = async () => {
  //   try {
  //     const qrData = generateProjectQR();

  //     Share.share({
  //       message: `${t('ftthProject')}: ${projectData.name}\n${t('address')}: ${projectData.address}\n\n${t('qrData')}:\n${qrData.substring(0, 100)}...`,
  //       title: t('projectQRCode')
  //     });
  //   } catch (error) {
  //     Alert.alert(t('error'), t('failedToShareQR'));
  //   }
  // };

  // const shareQRDataAsJson = async () => {
  //   try {
  //     const qrData = generateProjectQR();
  //     Share.share({
  //       message: qrData,
  //       title: t('projectData')
  //     });
  //   } catch (error) {
  //     Alert.alert(t('error'), t('failedToShareData'));
  //   }
  // };

  // Estilos dinámicos que responden al tema

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

  // const captureQRCode = async () => {
  //     try {
  //       if (!qrRef.current) {
  //         throw new Error('QR reference not found');
  //       }

  //       // Use file URI instead of data URI to avoid extension issues
  //       const uri = await captureRef(qrRef, {
  //         format: 'png',
  //         quality: 1,
  //       });

  //       return uri;
  //     } catch (error) {
  //       console.error('Error capturing QR code:', error);
  //       throw error;
  //     }
  //   };

  //   const captureQRCode = async () => {
  //   try {
  //     if (!qrRef.current) {
  //       throw new Error('QR reference not found');
  //     }

  //     // Capturar el componente QR como imagen
  //     const uri = await captureRef(qrRef, {
  //       format: 'png',
  //       quality: 1,
  //     });

  //     return uri;
  //   } catch (error) {
  //     console.error('Error capturing QR code:', error);
  //     throw error;
  //   }
  // };

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

  // const shareQRCode = async () => {
  //     try {
  //       setSaving(true);
  //       const qrImageUri = await captureQRCode();

  //       const shareOptions = {
  //         title: t('shareProjectQR'),
  //         message: t('shareProjectMessage', { projectName: project.name || project.id }),
  //         url: qrImageUri,
  //         type: 'image/png'
  //       };

  //       const result = await Share.share(shareOptions);

  //       if (result.action === Share.sharedAction) {
  //         Alert.alert(t('success'), t('qrSharedSuccessfully'));
  //       }
  //     } catch (error) {
  //       console.error('Error sharing QR code:', error);
  //       Alert.alert(t('error'), t('couldNotShareQR'));
  //     } finally {
  //       setSaving(false);
  //     }
  //   };

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

  // const saveQRCode = async () => {
  //     try {
  //       setSaving(true);

  //       // Solicitar permisos en Android
  //       if (Platform.OS === 'android') {
  //         const hasPermission = await requestStoragePermission();
  //         if (!hasPermission) {
  //           Alert.alert(t('error'), t('storagePermissionDenied'));
  //           return;
  //         }
  //       }

  //       // Solicitar permisos para la galería
  //       const { status } = await MediaLibrary.requestPermissionsAsync();
  //       if (status !== 'granted') {
  //         Alert.alert(t('error'), t('photoLibraryPermissionDenied'));
  //         return;
  //       }

  //       // console.log(generateProjectQR)
  //       // const qrData1 = generateProjectQR();
  //       const qrImageUri = generateProjectQR();
  //       // console.log(qrImageUri)
  //       // const qrImageUri = await captureQRCode();

  //       // Guardar en la galería
  //       const asset = await MediaLibrary.createAssetAsync(qrImageUri);

  //       // Crear álbum si no existe
  //       const album = await MediaLibrary.getAlbumAsync('FiberQR');
  //       if (album) {
  //         await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
  //       } else {
  //         await MediaLibrary.createAlbumAsync('FiberQR', asset, false);
  //       }

  //       Alert.alert(t('success'), t('qrSavedSuccessfully'));
  //     } catch (error) {
  //       console.error('Error saving QR code:', error);
  //       Alert.alert(t('error'), t('couldNotSaveQR'));
  //     } finally {
  //       setSaving(false);
  //     }
  //   };

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
          <TouchableOpacity onPress={saveProjectAndCreateGraph} disabled={saving}>
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

        {/* Fibras */}
        <View style={combinedStyles.section}>
          <View style={combinedStyles.deviceHeader}>
            <Text style={combinedStyles.sectionTitle}>{t('netFibers')}</Text>
            <TouchableOpacity
              onPress={clearForm}
              style={styles.clearButton}
              disabled={saving}
            >
              <Ionicons name="add-circle" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={combinedStyles.fiberCard}>
            <View style={combinedStyles.deviceHeader}>
              <View style={combinedStyles.deviceInfo}>
                <Text style={combinedStyles.deviceName}>A</Text>
                <Text style={combinedStyles.deviceDescription}>
                  B
                </Text>
              </View>
              <TouchableOpacity
                style={dynamicStyles.removeButton}

              >
                <Ionicons name="close-circle" size={24} color={colors.danger} />
              </TouchableOpacity>
            </View>

            <View style={dynamicStyles.configRow}>
              <Text style={dynamicStyles.configLabel}>{t('quantity')}:</Text>
            </View>
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

                {/* <TouchableOpacity
            style={[styles.qrActionButton, styles.shareDataButton]}
            onPress={shareQRDataAsJson}
          >
            <Ionicons name="code-slash-outline" size={20} color="white" />
            <Text style={styles.qrActionButtonText}>{t('shareAsData')}</Text>
          </TouchableOpacity> */}
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
    </View>
  );
};



export default CreateProject;