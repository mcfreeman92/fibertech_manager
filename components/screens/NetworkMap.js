// screens/NetworkMap.js
import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  Dimensions,
  TextInput,
  ScrollView,
  ActivityIndicator, Pressable
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NodeService, DeviceConfigService, FiberConfigService, NetworkMapService } from '../../service/storage';
import { useApp } from '../context/AppContext';;
import { useTranslation } from '../hooks/useTranslation';
import { useDevice } from '../context/DeviceContext';

const { width, height } = Dimensions.get('window');

const lightTheme = {
  primary: '#2E86C1',
  secondary: '#AED6F1',
  accent: '#E74C3C',
  background: '#F8F9F9',
  text: '#2C3E50',
  lightText: '#7F8C8D',
  success: '#27AE60',
  warning: '#F39C12',
  danger: '#C0392B',
  white: '#FFFFFF',
  border: '#D5D8DC',
  card: '#FFFFFF',
  surface: '#FFFFFF'
};

const darkTheme = {
  primary: '#3498DB',
  secondary: '#2C3E50',
  accent: '#E74C3C',
  background: '#121212',
  text: '#ECF0F1',
  lightText: '#BDC3C7',
  success: '#27AE60',
  warning: '#F39C12',
  danger: '#C0392B',
  white: '#1E1E1E',
  border: '#34495E',
  card: '#1E1E1E',
  surface: '#2C2C2C'
};

const NetworkMap = ({ route, navigation }) => {

  const { topInset, bottomInset, stylesFull } = useDevice();
  const { projectId } = route.params;
  const { isDarkMode } = useApp();
  const { t } = useTranslation();
  
  const [nodes, setNodes] = useState([]);
  const [selectedNodeType, setSelectedNodeType] = useState(null);
  const [devices, setDevices] = useState([]);
  const [fibers, setFibers] = useState([]);
  const [showNodeModal, setShowNodeModal] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [currentConfig, setCurrentConfig] = useState(null);
  const [configType, setConfigType] = useState(''); 

  const [linkingMode, setLinkingMode] = useState(false);
  const [linkSource, setLinkSource] = useState(null);
   const [linkMenuVisible, setLinkMenuVisible] = useState(false);
  const [selectedNodeForMenu, setSelectedNodeForMenu] = useState(null); // ← nuevo
  const [connections, setConnections] = useState([]);
  const notificationCounter = useRef(0);

  // Agregar estado para el modal de nombre del mapa
  const [showNameModal, setShowNameModal] = useState(false);
  const [mapName, setMapName] = useState('');

  const [notifications, setNotifications] = useState([]);

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

  const [region, setRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [nodeForm, setNodeForm] = useState({
    name: '',
    owner: '',
    address: '',
    selectedFibers: [],
    selectedDevices: []
  });
  const [loadingAddress, setLoadingAddress] = useState(false);

  // Tema de colores basado en las preferencias del usuario
  const theme = isDarkMode ? darkTheme : lightTheme;

  // Cargar nodos existentes y configuración
  useEffect(() => {
    loadData();
    loadSavedNetworkMap();
    getCurrentLocation();
  }, []);

// let notificationCounter = 0;
  // Función para mostrar notificaciones
// const showNotification = (message, type = 'info', duration = 3000) => {
//   // const id = Date.now().toString();
//   const id = `notification-${notificationCounter++}`;
//   const newNotification = {
//     id,
//     message,
//     type,
//     duration
//   };
  
//   setNotifications(prev => [...prev, newNotification]);
  
//   // Cerrar automáticamente después de la duración especificada
//   if (duration > 0) {
//     setTimeout(() => {
//       removeNotification(id);
//     }, duration);
//   }
  
//   return id;
// };
const showNotification = (message, type = 'info', duration = 3000) => {
  const id = `notification-${notificationCounter.current++}`;
  const newNotification = {
    id,
    message,
    type,
    duration
  };
  
  setNotifications(prev => [...prev, newNotification]);
  
  if (duration > 0) {
    setTimeout(() => {
      removeNotification(id);
    }, duration);
  }
  
  return id;
};

// Función para abrir el modal de nombre del mapa
  const openSaveMapModal = () => {
    setMapName(''); // Limpiar el nombre anterior
    setShowNameModal(true);
  };

  // Función para guardar el mapa con nombre
  const saveNetworkMapWithName = async () => {
    if (!mapName.trim()) {
      showNotification(t('mapNameRequired'), 'error');
      return;
    }

    setShowNameModal(false);
    await saveNetworkMap(mapName.trim());
  };

// Función para eliminar notificaciones
const removeNotification = (id) => {
  setNotifications(prev => prev.filter(notification => notification.id !== id));
};

  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        // Alert.alert(t('permissionDenied'), t('locationAccessDenied'));
        showNotification(t('locationAccessDenied'), 'error');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
    } catch (error) {
      // // // console.log(t('errorGettingLocation'), error);
    }
  };

  const openConfigModal = async (item, type) => {
    
    if (!item) {
      // Alert.alert(t('error'), t('configItemNotFound'));
      showNotification(t('configItemNotFound'), 'error');
      return;
    }
    
    // Cerrar primero el modal del nodo
    setShowNodeModal(false);
    
    // Pequeña pausa para permitir que el modal se cierre completamente
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Crear un objeto limpio con solo las propiedades necesarias
    let configItem;
    if (type === 'device') {
      configItem = {
        type: item.type,
        ports: item.ports,
        quantity: item.quantity,
        portsUsed: item.portsUsed || Array(item.ports).fill().map((_, i) => ({
          port: i + 1,
          description: '',
          connectedTo: ''
        }))
      };
    } else {
      // Para fibra, usar colores estándar pero preservar los existentes
      const standardColors = getStandardFiberColors(item.type);
      
      // Siempre usar todos los colores estándar, preservando los datos existentes
      const existingColors = item.colors || [];
      const colors = standardColors.map((standardColor, index) => {
        const existingColor = existingColors.find(ec => ec.color === standardColor);
        return existingColor || {
          color: standardColor,
          description: '',
          connectedTo: ''
        };
      });
      
      configItem = {
        type: item.type,
        quantity: item.quantity,
        colors: colors // Todos los colores, no solo los de la cantidad
      };
    }
    
    // // // console.log(t('cleanConfigItem'), configItem);
    setCurrentConfig(configItem);
    setConfigType(type);
    setShowConfigModal(true);
    // // // console.log(t('configModalVisible'));
  };

  // Función para obtener colores estándar según tipo de fibra
  const getStandardFiberColors = (fiberType) => {
    if (!fiberType) return [];
    
    // // // console.log(t('gettingStandardColors'), fiberType);
    
    // Extraer el número de fibras del tipo (ej: "12F" -> 12)
    const fiberCount = parseInt(fiberType.replace(/\D/g, ''));
    
    if (isNaN(fiberCount)) {
      // Si no es un formato numérico, devolver colores genéricos
      // // // console.log(t('nonNumericFiberType'));
      return Array(12).fill().map((_, i) => `${t('fiber')} ${i + 1}`);
    }
    
    // Colores estándar para 12 fibras (en orden)
    const standard12Colors = [
      t('blue'), t('orange'), t('green'), t('brown'), t('slate'), t('white'),
      t('red'), t('black'), t('yellow'), t('violet'), t('rose'), t('aqua')
    ];
    
    // // // console.log(t('fiberCount'), fiberCount);
    
    // Para tipos con múltiplos de 12
    if (fiberCount % 12 === 0) {
      const tubeCount = fiberCount / 12;
      const colors = [];
      
      for (let tube = 1; tube <= tubeCount; tube++) {
        standard12Colors.forEach(color => {
          colors.push(`${tube}-${color}`);
        });
      }
      
      // // // console.log(t('multiplesOf12'), colors);
      return colors;
    }
    
    // Para tipos que no son múltiplos de 12
    const colors = [];
    for (let i = 1; i <= fiberCount; i++) {
      colors.push(`${t('fiber')} ${i}`);
    }
    
    // // // console.log(t('nonMultiplesOf12'), colors);
    return colors;
  };

  const saveConfig = (updatedConfig) => {
    if (configType === 'device') {
      setNodeForm(prev => ({
        ...prev,
        selectedDevices: prev.selectedDevices.map(d => 
          d.type === updatedConfig.type && d.ports === updatedConfig.ports
            ? updatedConfig 
            : d
        )
      }));
    } else {
      setNodeForm(prev => ({
        ...prev,
        selectedFibers: prev.selectedFibers.map(f => 
          f.type === updatedConfig.type
            ? updatedConfig 
            : f
        )
      }));
    }
    
    setShowConfigModal(false);
    
    // Reabrir el modal del nodo después de guardar la configuración
    setTimeout(() => {
      setShowNodeModal(true);
    }, 100);
  };

  const loadData = async () => {
    try {
      // // console.log(t('loadingData'));
      
      // Cargar nodos existentes
      const existingNodes = await NodeService.getNodesByProject(projectId);
      const nodesWithIds = existingNodes.map((node, index) => ({
        ...node,
        id: node.id || `temp-${index}-${node.latitude}-${node.longitude}`
      }));
      setNodes(nodesWithIds);
      // // console.log(t('nodesLoaded'), nodesWithIds.length);

      // Cargar dispositivos y fibras configurados
      const deviceConfig = await DeviceConfigService.getDeviceConfig(projectId);
      const fiberConfig = await FiberConfigService.getFiberConfig(projectId);
      
      // Normalizar datos
      const normalizedDevices = normalizeData(deviceConfig);
      const normalizedFibers = normalizeData(fiberConfig);
      
      setDevices(normalizedDevices);
      setFibers(normalizedFibers);

    } catch (error) {
      // // console.log(t('errorLoadingData'), error);
      // Alert.alert(t('error'), t('failedLoadNetworkData'));
      showNotification(t('failedLoadNetworkData'), 'error');
    }
  };

  // Función para obtener dirección desde coordenadas
  const getAddressFromCoordinates = async (latitude, longitude) => {
    try {
      setLoadingAddress(true);
      let reverseGeocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude
      });
      
      if (reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        const addressString = [
          address.street,
          address.city,
          address.region,
          address.country
        ].filter(Boolean).join(', ');
        
        return addressString;
      }
      return t('addressNotAvailable');
    } catch (error) {
      // // console.log(t('errorGettingAddress'), error);
      showNotification(t('errorGettingAddress'), 'error');
      return t('errorGettingAddress');
    } finally {
      setLoadingAddress(false);
    }
  };

  // Función para verificar disponibilidad
  const getAvailableCount = (device) => {
    const deviceKey = `${device.type}-${device.ports}`;
    const totalAssigned = nodes.reduce((count, node) => {
      if (node.id === selectedNode?.id) return count;
      
      const assignedCount = node.devices?.filter(d => 
        `${d.type}-${d.ports}` === deviceKey
      ).reduce((sum, d) => sum + (d.quantity || 1), 0) || 0;
      
      return count + assignedCount;
    }, 0);

    return Math.max(0, device.count - totalAssigned);
  };

  // Función para obtener la cantidad ya asignada en este nodo - CORREGIDA
  const getAssignedInThisNode = (device) => {
    if (!selectedNode?.id) return 0;
    
    const deviceKey = `${device.type}-${device.ports}`;
    const node = nodes.find(n => n.id === selectedNode.id);
    
    if (!node || !node.devices) return 0;
    
    const assignedDevice = node.devices.find(d => 
      `${d.type}-${d.ports}` === deviceKey
    );
    
    return assignedDevice ? (assignedDevice.quantity || 1) : 0;
  };
  
  // Buscar la función saveNetworkMap y reemplazarla con esta versión actualizada

  // const saveNetworkMap = async (name) => {
  //   try {
  //     // Obtener todas las conexiones (automáticas + manuales)
  //     const autoConnections = getConnections();
  //     const allConnections = [...autoConnections, ...connections];
      
  //     const networkMapData = {
  //       name: name, // Usar el nombre proporcionado
  //       projectId,
  //       nodes: nodes,
  //       connections: allConnections, // Guardar todas las conexiones
  //       createdAt: new Date().toISOString()
  //     };
      
  //     const result = await NetworkMapService.saveNetworkMap(projectId, networkMapData);
      
  //     if (result.success) {
  //       Alert.alert(t('success'), t('networkMapSaved'), [
  //         {
  //           text: 'OK',
  //           onPress: () => navigation.navigate('Dashboard')
  //         }
  //       ]);
  //     } else {
  //       showNotification(t('couldNotSaveNetworkMap'), 'error');
  //     }
  //   } catch (error) {
  //     showNotification(t('couldNotSaveNetworkMap'), 'error');
  //   }
  // };
  const saveNetworkMap = async (name) => {
  try {
    // Obtener todas las conexiones (automáticas + manuales)
    const autoConnections = getConnections();
    
    // Filtrar conexiones manuales para asegurar que no haya duplicados
    const uniqueManualConnections = connections.filter(manualConn => {
      const manualFromId = manualConn.from.id || `temp-${manualConn.from.latitude}-${manualConn.from.longitude}`;
      const manualToId = manualConn.to.id || `temp-${manualConn.to.latitude}-${manualConn.to.longitude}`;
      
      // Verificar que no existe ya una conexión automática equivalente
      return !autoConnections.some(autoConn => {
        const autoFromId = autoConn.from.id || `temp-${autoConn.from.latitude}-${autoConn.from.longitude}`;
        const autoToId = autoConn.to.id || `temp-${autoConn.to.latitude}-${autoConn.to.longitude}`;
        
        return (autoFromId === manualFromId && autoToId === manualToId) ||
               (autoFromId === manualToId && autoToId === manualFromId);
      });
    });
    
    const allConnections = [...autoConnections, ...uniqueManualConnections];
    
    const networkMapData = {
      name: name,
      projectId,
      nodes: nodes,
      connections: allConnections,
      createdAt: new Date().toISOString()
    };
    
    const result = await NetworkMapService.saveNetworkMap(projectId, networkMapData);
    
    if (result.success) {
      Alert.alert(t('success'), t('networkMapSaved'), [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Dashboard')
        }
      ]);
    } else {
      showNotification(t('couldNotSaveNetworkMap'), 'error');
    }
  } catch (error) {
    console.error('Error saving network map:', error);
    showNotification(t('couldNotSaveNetworkMap'), 'error');
  }
};
  

// Buscar la función loadSavedNetworkMap y reemplazarla con esta versión actualizada

// const loadSavedNetworkMap = async () => {
//   try {
//     const savedMap = await NetworkMapService.getNetworkMapById(projectId);
//     if (savedMap) {
//       // Actualizar el estado con los nodos guardados
//       setNodes(savedMap.nodes || []);
      
//       // Cargar las conexiones guardadas
//       setConnections(savedMap.connections || []);
      
//       // Si hay información de región guardada, puedes usarla
//       if (savedMap.nodes && savedMap.nodes.length > 0) {
//         const firstNode = savedMap.nodes[0];
//         setRegion({
//           latitude: firstNode.latitude,
//           longitude: firstNode.longitude,
//           latitudeDelta: 0.0922,
//           longitudeDelta: 0.0421,
//         });
//       }
//     }
//   } catch (error) {
//     console.error('Error loading network map:', error);
//   }
// };
const loadSavedNetworkMap = async () => {
  try {
    const savedMap = await NetworkMapService.getNetworkMapByProject(projectId);
    if (savedMap) {
      setNodes(savedMap.nodes || []);
      
      // Filtrar conexiones válidas
      const validConnections = (savedMap.connections || []).filter(conn => 
        conn.from && conn.to &&
        conn.from.latitude && conn.from.longitude &&
        conn.to.latitude && conn.to.longitude
      );
      
      setConnections(validConnections);
      
      if (savedMap.nodes && savedMap.nodes.length > 0) {
        const firstNode = savedMap.nodes[0];
        setRegion({
          latitude: firstNode.latitude,
          longitude: firstNode.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      }
    }
  } catch (error) {
    console.error('Error loading network map:', error);
  }
};

const handleMapPress = async (e) => {
  // Si estamos en modo de enlace, solo permitir agregar nuevos nodos
  if (linkingMode && linkSource) {
    // Permitir agregar nodos incluso en modo enlace
    if (!isAddingMode || !selectedNodeType) {
      // Mostrar mensaje indicando que primero debe seleccionar un tipo de nodo
      // Alert.alert('Modo enlace activo', 'Selecciona un tipo de nodo primero para agregar y enlazar automáticamente');
      showNotification('Selecciona un tipo de nodo primero para agregar y enlazar automáticamente', 'info');
      return; // Solo retornar si no hay tipo de nodo seleccionado
    }
    // Si hay tipo de nodo seleccionado, continuar con la creación normal
  }

  if (!isAddingMode || !selectedNodeType) return;
  
  const { coordinate } = e.nativeEvent;
  
  // Obtener dirección desde coordenadas
  const address = await getAddressFromCoordinates(coordinate.latitude, coordinate.longitude);
  
  setSelectedNode({
    type: selectedNodeType,
    latitude: coordinate.latitude,
    longitude: coordinate.longitude,
    name: `${selectedNodeType}_${nodes.filter(n => n.type === selectedNodeType).length + 1}`
  });
  
  setNodeForm({
    name: `${selectedNodeType}_${nodes.filter(n => n.type === selectedNodeType).length + 1}`,
    owner: '',
    address: address,
    selectedFibers: [],
    selectedDevices: []
  });
  
  setShowNodeModal(true);
};

// Función auxiliar para encontrar el nodo más cercano (excluyendo el nodo fuente)
const findClosestNode = (coordinate, excludeNode = null) => {
  let closestNode = null;
  let minDistance = Infinity;
  
  nodes.forEach(node => {
    // Excluir el nodo especificado
    if (excludeNode && node.id === excludeNode.id) {
      return;
    }
    
    const distance = Math.sqrt(
      Math.pow(node.latitude - coordinate.latitude, 2) +
      Math.pow(node.longitude - coordinate.longitude, 2)
    );
    
    if (distance < minDistance && distance < 0.001) { // Umbral de 0.001 grados
      minDistance = distance;
      closestNode = node;
    }
  });
  
  return closestNode;
};

// Agregar este componente antes del return principal
const NotificationContainer = () => {
  return (
    <View style={styles.notificationContainer}>
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          message={notification.message}
          type={notification.type}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </View>
  );
};

const Notification = ({ message, type, onClose }) => {
  const getNotificationStyle = () => {
    switch (type) {
      case 'success':
        return { backgroundColor: theme.success };
      case 'error':
        return { backgroundColor: theme.danger };
      case 'warning':
        return { backgroundColor: theme.warning };
      default:
        return { backgroundColor: theme.primary };
    }
  };

  return (
    <View style={[styles.notification, getNotificationStyle()]}>
      <Text style={styles.notificationText}>{message}</Text>
      <TouchableOpacity onPress={onClose} style={styles.notificationClose}>
        <Ionicons name="close" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};
  // const addNode = async () => {
  //   try {
  //     const newNode = {
  //       project_id: projectId,
  //       name: nodeForm.name,
  //       type: selectedNode.type,
  //       description: `${selectedNode.type} ${t('node')}`,
  //       latitude: selectedNode.latitude,
  //       longitude: selectedNode.longitude,
  //       owner: nodeForm.owner,
  //       address: nodeForm.address,
  //       fibers: nodeForm.selectedFibers, // Cambiado de fiber a fibers
  //       devices: nodeForm.selectedDevices,
  //       status: 'active',
  //       createdAt: new Date().toISOString()
  //     };

  //     const savedNode = await NodeService.createNode(newNode);
  //     setNodes(prev => [...prev, { ...newNode, id: savedNode.insertId }]);
      
  //     setShowNodeModal(false);
  //     setIsAddingMode(false);
  //     setSelectedNodeType(null);
  //     setSelectedNode(null);
      
  //     Alert.alert(t('success'), `${selectedNode.type} ${t('nodeAdded')}`);

  //   } catch (error) {
  //     // // console.log(t('errorAddingNode'), error);
  //     Alert.alert(t('error'), t('failedAddNode'));
  //   }
  // };

  // Seleccionar tipo de nodo
  
//   const addNode = async () => {
//   try {
//     const newNode = {
//       project_id: projectId,
//       name: nodeForm.name,
//       type: selectedNode.type,
//       description: `${selectedNode.type} ${t('node')}`,
//       latitude: selectedNode.latitude,
//       longitude: selectedNode.longitude,
//       owner: nodeForm.owner,
//       address: nodeForm.address,
//       fibers: nodeForm.selectedFibers,
//       devices: nodeForm.selectedDevices,
//       status: 'active',
//       createdAt: new Date().toISOString()
//     };

//     const savedNode = await NodeService.createNode(newNode);
//     const newNodeWithId = { ...newNode, id: savedNode.insertId };
    
//     // Agregar el nuevo nodo al estado
//     setNodes(prev => [...prev, newNodeWithId]);
    
//     // Si estamos en modo de enlace, crear conexión automáticamente
//     if (linkingMode && linkSource) {
//       createLink(linkSource, newNodeWithId);
//     }
    
//     setShowNodeModal(false);
//     setIsAddingMode(false);
//     setSelectedNodeType(null);
//     setSelectedNode(null);
    
//     Alert.alert(t('success'), `${selectedNode.type} ${t('nodeAdded')}`);

//   } catch (error) {
//     // // console.log(t('errorAddingNode'), error);
//     Alert.alert(t('error'), t('failedAddNode'));
//   }
// };

const addNode = async () => {
  try {
    const newNode = {
      project_id: projectId,
      name: nodeForm.name,
      type: selectedNode.type,
      description: `${selectedNode.type} ${t('node')}`,
      latitude: selectedNode.latitude,
      longitude: selectedNode.longitude,
      owner: nodeForm.owner,
      address: nodeForm.address,
      fibers: nodeForm.selectedFibers,
      devices: nodeForm.selectedDevices,
      status: 'active',
      createdAt: new Date().toISOString(),
      // Agregar una bandera para indicar que fue creado en modo enlace
      createdInLinkingMode: linkingMode && linkSource ? true : undefined
    };

    const savedNode = await NodeService.createNode(newNode);
    const newNodeWithId = { ...newNode, id: savedNode.id || savedNode.insertId };
    
    // Agregar el nuevo nodo al estado
    setNodes(prev => [...prev, newNodeWithId]);
    
    // Si estamos en modo de enlace, crear conexión automáticamente
    if (linkingMode && linkSource) {
      createLink(linkSource, newNodeWithId);
    }
    
    setShowNodeModal(false);
    setIsAddingMode(false);
    setSelectedNodeType(null);
    setSelectedNode(null);
    
    // Alert.alert(t('success'), `${selectedNode.type} ${t('nodeAdded')}`);
    // showNotification(t('nodeAdded'), 'success');
    showNotification(`${selectedNode.type} ${t('nodeAdded')}`, 'success');

  } catch (error) {
    // // console.log(t('errorAddingNode'), error);
    // Alert.alert(t('error'), t('failedAddNode'));
    showNotification(t('failedAddNode'), 'error');
  }
};
  
  const selectNodeType = (type) => {
    setSelectedNodeType(type);
    setIsAddingMode(true);
  };

  const selectNode = async (node) => {
    setSelectedNode(node);
    
    const matchedDevices = devices.filter(device => 
      node.devices?.some(nd => 
        nd.type === device.type && nd.ports === device.ports
      )
    ).map(device => {
      const nodeDevice = node.devices.find(nd => 
        nd.type === device.type && nd.ports === device.ports
      );
      return {
        ...device,
        quantity: nodeDevice?.quantity || 1
      };
    });
    
    // Cambiar para manejar múltiples fibras
    const matchedFibers = fibers.filter(fiber => 
      node.fibers?.some(nf => nf.type === fiber.type)
    ).map(fiber => {
      const nodeFiber = node.fibers?.find(nf => nf.type === fiber.type);
      return {
        ...fiber,
        quantity: nodeFiber?.quantity || 1,
        colors: nodeFiber?.colors || []
      };
    });
    
    setNodeForm({
      name: node.name || '',
      owner: node.owner || '',
      address: node.address || '',
      selectedFibers: matchedFibers || [], // Cambiado de selectedFiber a selectedFibers
      selectedDevices: matchedDevices || []
    });
    
    setShowNodeModal(true);
  };

  const updateNode = async () => {
    try {
      const updatedNodes = nodes.map(node =>
        node.id === selectedNode.id
          ? {
              ...node,
              name: nodeForm.name,
              owner: nodeForm.owner,
              address: nodeForm.address,
              fibers: nodeForm.selectedFibers, // Cambiado de fiber a fibers
              devices: nodeForm.selectedDevices
            }
          : node
      );

      setNodes(updatedNodes);
      
      await NodeService.updateNode(selectedNode.id, {
        name: nodeForm.name,
        owner: nodeForm.owner,
        address: nodeForm.address,
        fibers: nodeForm.selectedFibers, // Cambiado de fiber a fibers
        devices: nodeForm.selectedDevices
      });
      
      setShowNodeModal(false);
      setSelectedNode(null);
      // Alert.alert(t('success'), `${t('node')} ${selectedNode.name} ${t('updated')}`);
      showNotification(`${t('node')} ${selectedNode.name} ${t('updated')}`, 'success');

    } catch (error) {
      // // console.log(t('errorUpdatingNode'), error);
      // Alert.alert(t('error'), t('failedUpdateNode'));
      showNotification(t('failedUpdateNode'), 'error');
    }
  };

  const updateDeviceQuantity = (device, newQuantity) => {
    if (newQuantity < 0) return;
    
    const availableCount = getAvailableCount(device) + getAssignedInThisNode(device);
    if (newQuantity > availableCount) {
      // Alert.alert(t('notAvailable'), `${t('onlyAvailable')} ${availableCount} ${device.type}`);
      showNotification(`${t('onlyAvailable')} ${availableCount} ${device.type}`, 'warning');
      return;
    }
    
    setNodeForm(prev => {
      const deviceKey = `${device.type}-${device.ports}`;
      const isSelected = prev.selectedDevices.some(d => 
        `${d.type}-${d.ports}` === deviceKey
      );
      
      if (isSelected) {
        // Actualizar cantidad
        return {
          ...prev,
          selectedDevices: prev.selectedDevices.map(d => 
            `${d.type}-${d.ports}` === deviceKey 
              ? { 
                  ...d, 
                  quantity: newQuantity,
                  // Asegurar que portsUsed exista
                  portsUsed: d.portsUsed || []
                }
              : d
          )
        };
      } else if (newQuantity > 0) {
        // Agregar nuevo dispositivo - SOLO propiedades necesarias
        return {
          ...prev,
          selectedDevices: [...prev.selectedDevices, { 
            type: device.type,
            ports: device.ports,
            quantity: newQuantity,
            portsUsed: [] // Array para puertos utilizados
          }]
        };
      } else {
        // Eliminar dispositivo si cantidad es 0
        return {
          ...prev,
          selectedDevices: prev.selectedDevices.filter(d => 
            `${d.type}-${d.ports}` !== deviceKey
          )
        };
      }
    });
  };

  const getAvailableFiberCount = (fiber) => {
    const totalAssigned = nodes.reduce((count, node) => {
      if (node.id === selectedNode?.id) return count;
      
      const assignedCount = node.fibers?.filter(f => 
        f.type === fiber.type
      ).reduce((sum, f) => sum + (f.quantity || 1), 0) || 0;
      
      return count + assignedCount;
    }, 0);

    return Math.max(0, fiber.count - totalAssigned);
  };

  // Función para obtener la cantidad ya asignada en este nodo
  const getAssignedFiberInThisNode = (fiber) => {
    if (!selectedNode?.id) return 0;
    
    const node = nodes.find(n => n.id === selectedNode.id);
    
    if (!node || !node.fibers) return 0;
    
    const assignedFiber = node.fibers.find(f => f.type === fiber.type);
    
    return assignedFiber ? (assignedFiber.quantity || 1) : 0;
  };

  const updateFiberQuantity = (fiber, newQuantity) => {
    if (newQuantity < 0) return;
    
    const availableCount = getAvailableFiberCount(fiber) + getAssignedFiberInThisNode(fiber);
    if (newQuantity > availableCount) {
      // Alert.alert(t('notAvailable'), `${t('onlyAvailable')} ${availableCount} ${fiber.type}`);
      showNotification(`${t('onlyAvailable')} ${availableCount} ${fiber.type}`, 'warning');
      return;
    }
    
    setNodeForm(prev => {
      const isSelected = prev.selectedFibers.some(f => f.type === fiber.type);
      const standardColors = getStandardFiberColors(fiber.type);
      
      if (isSelected) {
        // Actualizar solo la cantidad, preservar los colores existentes
        return {
          ...prev,
          selectedFibers: prev.selectedFibers.map(f => 
            f.type === fiber.type 
              ? { 
                  ...f, // Mantener todas las propiedades incluyendo colors
                  quantity: newQuantity
                }
              : f
          )
        };
      } else if (newQuantity > 0) {
        // Agregar nueva fibra con todos los colores estándar
        return {
          ...prev,
          selectedFibers: [...prev.selectedFibers, { 
            type: fiber.type,
            quantity: newQuantity,
            colors: standardColors.map((color, index) => ({
              color: color,
              description: '',
              connectedTo: ''
            }))
          }]
        };
      } else {
        // Eliminar fibra si cantidad es 0
        return {
          ...prev,
          selectedFibers: prev.selectedFibers.filter(f => f.type !== fiber.type)
        };
      }
    });
  };

  // Obtener color según tipo de nodo
  const getNodeColor = (type) => {
    switch (type) {
      case 'MDF': return theme.accent;
      case 'pedestal': return theme.primary;
      case 'IDF': return theme.success;
      case 'unit': return theme.warning;
      default: return theme.lightText;
    }
  };

  // Obtener ícono según tipo de nodo
  const getNodeIcon = (type) => {
    switch (type) {
      case 'MDF': return 'server';
      case 'pedestal': return 'cube';
      case 'IDF': return 'hardware-chip';
      case 'unit': return 'home';
      default: return 'help';
    }
  };

  // const getConnections = () => {
  //   const connections = [];
    
  //   // Si no hay nodos o solo hay uno, no hay conexiones
  //   if (nodes.length <= 1) return connections;
    
  //   // Filtrar nodos válidos (con coordenadas)
  //   const validNodes = nodes.filter(node => 
  //     node.latitude && node.longitude && 
  //     typeof node.latitude === 'number' && 
  //     typeof node.longitude === 'number'
  //   );
    
  //   if (validNodes.length <= 1) return connections;
    
  //   // Ordenar nodos por fecha de creación (timestamp)
  //   const sortedNodes = [...validNodes].sort((a, b) => {
  //     // Ordenar por timestamp si está disponible
  //     if (a.createdAt && b.createdAt) {
  //       return new Date(a.createdAt) - new Date(b.createdAt);
  //     }
      
  //     // Fallback: ordenar por ID si no hay timestamp
  //     return (a.id || '').localeCompare(b.id || '');
  //   });
    
  //   // Asegurar que el MDF sea el primer nodo si existe
  //   const mdfIndex = sortedNodes.findIndex(node => node.type === 'MDF');
  //   if (mdfIndex > 0) {
  //     // Si el MDF no es el primero, moverlo al principio
  //     const mdfNode = sortedNodes.splice(mdfIndex, 1)[0];
  //     sortedNodes.unshift(mdfNode);
  //   }
    
  //   // Conectar cada nodo con el anterior (empezando desde el segundo nodo)
  //   for (let i = 1; i < sortedNodes.length; i++) {
  //     const previousNode = sortedNodes[i - 1];
  //     const currentNode = sortedNodes[i];
      
  //     // Verificar que ambos nodos tengan coordenadas válidas
  //     if (previousNode.latitude && previousNode.longitude && 
  //         currentNode.latitude && currentNode.longitude) {
  //       connections.push({
  //         from: previousNode,
  //         to: currentNode,
  //         color: getConnectionColor(previousNode.type, currentNode.type),
  //         type: `${previousNode.type}-${currentNode.type}`,
  //         isBackbone: previousNode.type === 'MDF' || currentNode.type === 'MDF'
  //       });
  //     }
  //   }
    
  //   return connections;
  // };

// const getConnections = () => {
//   const connections = [];
  
//   // Filtrar nodos válidos
//   const validNodes = nodes.filter(node => 
//     node.latitude && node.longitude && 
//     typeof node.latitude === 'number' && 
//     typeof node.longitude === 'number' &&
//     !node.createdInLinkingMode
//   );
  
//   if (validNodes.length <= 1) return connections;
  
//   // Ordenar y conectar nodos
//   const sortedNodes = [...validNodes].sort((a, b) => {
//     if (a.createdAt && b.createdAt) {
//       return new Date(a.createdAt) - new Date(b.createdAt);
//     }
//     return (a.id || '').localeCompare(b.id || '');
//   });
  
//   // Conectar nodos en orden
//   for (let i = 1; i < sortedNodes.length; i++) {
//     const previousNode = sortedNodes[i - 1];
//     const currentNode = sortedNodes[i];
    
//     // Verificar si ya existe una conexión manual entre estos nodos
//     const manualConnectionExists = connections.some(conn => {
//       const connFromId = conn.from.id || `temp-${conn.from.latitude}-${conn.from.longitude}`;
//       const connToId = conn.to.id || `temp-${conn.to.latitude}-${conn.to.longitude}`;
//       const prevId = previousNode.id || `temp-${previousNode.latitude}-${previousNode.longitude}`;
//       const currId = currentNode.id || `temp-${currentNode.latitude}-${currentNode.longitude}`;
      
//       return (connFromId === prevId && connToId === currId) ||
//              (connFromId === currId && connToId === prevId);
//     });
    
//     if (!manualConnectionExists) {
//       connections.push({
//         from: previousNode,
//         to: currentNode,
//         color: getConnectionColor(previousNode.type, currentNode.type),
//         type: `${previousNode.type}-${currentNode.type}`,
//         isBackbone: previousNode.type === 'MDF' || currentNode.type === 'MDF',
//         isAutomatic: true
//       });
//     }
//   }
  
//   return connections;
// };
const getConnections = () => {
  const autoConnections = [];
  
  // Filtrar nodos válidos
  const validNodes = nodes.filter(node => 
    node.latitude && node.longitude && 
    typeof node.latitude === 'number' && 
    typeof node.longitude === 'number' &&
    !node.createdInLinkingMode
  );
  
  if (validNodes.length <= 1) return autoConnections;
  
  // Ordenar nodos por fecha de creación
  const sortedNodes = [...validNodes].sort((a, b) => {
    if (a.createdAt && b.createdAt) {
      return new Date(a.createdAt) - new Date(b.createdAt);
    }
    return (a.id || '').localeCompare(b.id || '');
  });
  
  // Conectar cada nodo con el anterior
  for (let i = 1; i < sortedNodes.length; i++) {
    const previousNode = sortedNodes[i - 1];
    const currentNode = sortedNodes[i];
    
    // Verificar si ya existe una conexión manual entre estos nodos
    const manualConnectionExists = connections.some(manualConn => {
      const manualFromId = manualConn.from.id || `temp-${manualConn.from.latitude}-${manualConn.from.longitude}`;
      const manualToId = manualConn.to.id || `temp-${manualConn.to.latitude}-${manualConn.to.longitude}`;
      const prevId = previousNode.id || `temp-${previousNode.latitude}-${previousNode.longitude}`;
      const currId = currentNode.id || `temp-${currentNode.latitude}-${currentNode.longitude}`;
      
      return (manualFromId === prevId && manualToId === currId) ||
             (manualFromId === currId && manualToId === prevId);
    });
    
    // Solo agregar conexión automática si no existe manual
    if (!manualConnectionExists) {
      autoConnections.push({
        from: previousNode,
        to: currentNode,
        color: getConnectionColor(previousNode.type, currentNode.type),
        type: `${previousNode.type}-${currentNode.type}`,
        isBackbone: previousNode.type === 'MDF' || currentNode.type === 'MDF',
        isAutomatic: true
      });
    }
  }
  
  return autoConnections;
};

  // Obtener color de conexión según tipos de nodos
  
//   const getConnections = () => {
//   const connections = [];
  
//   // Si no hay nodos o solo hay uno, no hay conexiones
//   if (nodes.length <= 1) return connections;
  
//   // Filtrar nodos válidos (con coordenadas)
//   const validNodes = nodes.filter(node => 
//     node.latitude && node.longitude && 
//     typeof node.latitude === 'number' && 
//     typeof node.longitude === 'number'
//   );
  
//   if (validNodes.length <= 1) return connections;
  
//   // Ordenar nodos por fecha de creación (timestamp)
//   const sortedNodes = [...validNodes].sort((a, b) => {
//     // Ordenar por timestamp si está disponible
//     if (a.createdAt && b.createdAt) {
//       return new Date(a.createdAt) - new Date(b.createdAt);
//     }
    
//     // Fallback: ordenar por ID si no hay timestamp
//     return (a.id || '').localeCompare(b.id || '');
//   });
  
//   // Asegurar que el MDF sea el primer nodo si existe
//   const mdfIndex = sortedNodes.findIndex(node => node.type === 'MDF');
//   if (mdfIndex > 0) {
//     // Si el MDF no es el primero, moverlo al principio
//     const mdfNode = sortedNodes.splice(mdfIndex, 1)[0];
//     sortedNodes.unshift(mdfNode);
//   }
  
//   // Conectar cada nodo con el anterior (empezando desde el segundo nodo)
//   for (let i = 1; i < sortedNodes.length; i++) {
//     const previousNode = sortedNodes[i - 1];
//     const currentNode = sortedNodes[i];
    
//     // Verificar que ambos nodos tengan coordenadas válidas
//     if (previousNode.latitude && previousNode.longitude && 
//         currentNode.latitude && currentNode.longitude) {
      
//       // Verificar si esta conexión ya existe en las conexiones manuales
//       const connectionExists = connections.some(manualConn => {
//         const manualFromId = manualConn.from.id || `temp-${manualConn.from.latitude}-${manualConn.from.longitude}`;
//         const manualToId = manualConn.to.id || `temp-${manualConn.to.latitude}-${manualConn.to.longitude}`;
//         const autoFromId = previousNode.id || `temp-${previousNode.latitude}-${previousNode.longitude}`;
//         const autoToId = currentNode.id || `temp-${currentNode.latitude}-${currentNode.longitude}`;
        
//         return (manualFromId === autoFromId && manualToId === autoToId) ||
//                (manualFromId === autoToId && manualToId === autoFromId);
//       });
      
//       // Solo agregar la conexión automática si no existe una manual
//       if (!connectionExists) {
//         connections.push({
//           from: previousNode,
//           to: currentNode,
//           color: getConnectionColor(previousNode.type, currentNode.type),
//           type: `${previousNode.type}-${currentNode.type}`,
//           isBackbone: previousNode.type === 'MDF' || currentNode.type === 'MDF'
//         });
//       }
//     }
//   }
  
//   return connections;
// };
  
  const getConnectionColor = (typeA, typeB) => {
    if (typeA === 'MDF' || typeB === 'MDF') {
      return theme.accent; // Color de acento para conexiones con MDF
    }
    
    if (typeA === 'pedestal' && typeB === 'pedestal') {
      return theme.primary; // Color primario para conexiones entre pedestales
    }
    
    if (typeA === 'IDF' && typeB === 'IDF') {
      return theme.success; // Color de éxito para conexiones entre IDFs
    }
    
    if ((typeA === 'IDF' && typeB === 'unit') || 
        (typeA === 'unit' && typeB === 'IDF')) {
      return theme.warning; // Color de advertencia para IDF-Unit
    }
    
    if ((typeA === 'pedestal' && typeB === 'unit') || 
        (typeA === 'unit' && typeB === 'pedestal')) {
      return '#9b59b6'; // Púrpura para Pedestal-Unit
    }
    
    // Conexiones mixtas (diferentes tipos de infraestructura)
    if ((typeA === 'pedestal' && typeB === 'IDF') || 
        (typeA === 'IDF' && typeB === 'pedestal')) {
      return '#1abc9c'; // Turquesa para conexiones mixtas
    }
    
    return theme.lightText; // Color de texto claro por defecto
  };

// const createLink = async (fromNode, toNode) => {
//   // Verificar que ambos nodos existen y son diferentes
//   if (!fromNode || !toNode) {
//     // Alert.alert('Error', 'Nodos inválidos');
//     showNotification('Nodos inválidos', 'error');
//     return;
//   }

//   // Usar una comparación más robusta para IDs
//   const fromId = fromNode.id || `temp-${fromNode.latitude}-${fromNode.longitude}`;
//   const toId = toNode.id || `temp-${toNode.latitude}-${toNode.longitude}`;
  
//   if (fromId === toId) {
//     // Alert.alert('Error', 'No puedes enlazar un nodo consigo mismo');
//     showNotification('No puedes enlazar un nodo consigo mismo', 'error');
//     return;
//   }

//   // Evitar duplicados con comparación robusta
//   const exists = connections.some(
//     c => {
//       const cFromId = c.from.id || `temp-${c.from.latitude}-${c.from.longitude}`;
//       const cToId = c.to.id || `temp-${c.to.latitude}-${c.to.longitude}`;
      
//       return (cFromId === fromId && cToId === toId) ||
//              (cFromId === toId && cToId === fromId);
//     }
//   );
  
//   if (exists) {
//     // Alert.alert('Info', 'El enlace ya existe');
//     showNotification('El enlace ya existe', 'info');
//     setLinkingMode(false);
//     setLinkSource(null);
//     return;
//   }

//   const newConnection = {
//     from: fromNode,
//     to: toNode,
//     color: getConnectionColor(fromNode.type, toNode.type),
//     type: `${fromNode.type}-${toNode.type}`,
//     isBackbone: fromNode.type === 'MDF' || toNode.type === 'MDF',
//     isAutomatic: false 
//   };

//   // Guardar en estado local
//   setConnections(prev => [...prev, newConnection]);

//   // Salir del modo enlazar
//   setLinkingMode(false);
//   setLinkSource(null);
  
//   // Alert.alert('Éxito', `Enlace creado entre ${fromNode.name} y ${toNode.name}`);
//   showNotification(`Enlace creado entre ${fromNode.name} y ${toNode.name}`, 'success');
// };
  
const createLink = async (fromNode, toNode) => {
  if (!fromNode || !toNode) {
    showNotification('Nodos inválidos', 'error');
    return;
  }

  const fromId = fromNode.id || `temp-${fromNode.latitude}-${fromNode.longitude}`;
  const toId = toNode.id || `temp-${toNode.latitude}-${toNode.longitude}`;
  
  if (fromId === toId) {
    showNotification('No puedes enlazar un nodo consigo mismo', 'error');
    return;
  }

  // Verificar si ya existe esta conexión (incluyendo automáticas)
  const autoConnections = getConnections();
  const allExistingConnections = [...autoConnections, ...connections];
  
  const exists = allExistingConnections.some(conn => {
    const connFromId = conn.from.id || `temp-${conn.from.latitude}-${conn.from.longitude}`;
    const connToId = conn.to.id || `temp-${conn.to.latitude}-${conn.to.longitude}`;
    
    return (connFromId === fromId && connToId === toId) ||
           (connFromId === toId && connToId === fromId);
  });
  
  if (exists) {
    showNotification('El enlace ya existe', 'info');
    setLinkingMode(false);
    setLinkSource(null);
    return;
  }

  const newConnection = {
    from: fromNode,
    to: toNode,
    color: getConnectionColor(fromNode.type, toNode.type),
    type: `${fromNode.type}-${toNode.type}`,
    isBackbone: fromNode.type === 'MDF' || toNode.type === 'MDF',
    isAutomatic: false
  };

  setConnections(prev => [...prev, newConnection]);
  setLinkingMode(false);
  setLinkSource(null);
  
  showNotification(`Enlace creado entre ${fromNode.name} y ${toNode.name}`, 'success');
};  

const renderMarkers = () => {
   return nodes.map((node, index) => {
    // Asegurar que las coordenadas sean números válidos
    const latitude = parseFloat(node.latitude);
    const longitude = parseFloat(node.longitude);

    // Validar coordenadas
    if (isNaN(latitude) || isNaN(longitude)) {
      // console.warn(`Coordenadas inválidas para nodo ${node.name}`, node);
      return null;
    }

    return (
      <Marker
        key={`marker-${node.id || `temp-${index}-${latitude}-${longitude}`}`}
        coordinate={{ latitude, longitude }}
        onPress={() => {
          if (linkingMode && linkSource) {
            // Segundo tap -> crear enlace
            // createLink(linkSource, node);
            handleExistingNodeLink(node);
          } else {
            selectNode(node); // comportamiento normal
          }
        }}
      >
        <Pressable
          onLongPress={() => {
            setSelectedNodeForMenu(node);
            setLinkMenuVisible(true);
          }}
          delayLongPress={600}
        >
          <View style={styles.markerContainer}>
            <View style={[styles.marker, { 
              backgroundColor: linkingMode && linkSource?.id === node.id ? 
                theme.accent : getNodeColor(node.type) 
            }]}>
              <Ionicons name={getNodeIcon(node.type)} size={16} color="#ffffff" />
            </View>
            <View style={styles.markerLabel}>
              <Text style={styles.markerText}>{node.name}</Text>
              <Text style={styles.markerType}>{node.type}</Text>
            </View>
          </View>
        </Pressable>
      </Marker>
    );
  }).filter(Boolean);
};

// const renderConnections = () => {
//   const autoConnections = getConnections();
//   const allConnections = [...autoConnections, ...connections];
  
//   return allConnections.map((connection, index) => {
//     const fromId = connection.from.id || `temp-${connection.from.latitude}-${connection.from.longitude}`;
//     const toId = connection.to.id || `temp-${connection.to.latitude}-${connection.to.longitude}`;
    
//     // Validación adicional para evitar líneas fantasma
//     if (!connection.from.latitude || !connection.from.longitude ||
//         !connection.to.latitude || !connection.to.longitude) {
//       return null;
//     }
    
//     // Crear una clave única que incluya el tipo de conexión (automática vs manual)
//     const connectionType = connection.isAutomatic ? 'auto' : 'manual';
//     const uniqueKey = `connection-${fromId}-${toId}-${index}-${connectionType}`;
    
//     return (
//       <Polyline
//         key={uniqueKey}
//         coordinates={[
//           {
//             latitude: connection.from.latitude,
//             longitude: connection.from.longitude
//           },
//           {
//             latitude: connection.to.latitude,
//             longitude: connection.to.longitude
//           }
//         ]}
//         strokeColor={connection.color}
//         strokeWidth={connection.isBackbone ? 4 : 3}
//         lineDashPattern={connection.isBackbone ? [] : [5, 5]}
//       />
//     );
//   }).filter(Boolean);
// };

// const renderConnections = () => {
//   const autoConnections = getConnections();
//   const allConnections = [...autoConnections, ...connections];
  
//   return allConnections.map((connection, index) => {
//     const fromId = connection.from.id || `temp-${connection.from.latitude}-${connection.from.longitude}`;
//     const toId = connection.to.id || `temp-${connection.to.latitude}-${connection.to.longitude}`;
    
//     // Validación adicional para evitar líneas fantasma
//     if (!connection.from.latitude || !connection.from.longitude ||
//         !connection.to.latitude || !connection.to.longitude) {
//       return null;
//     }
    
//     // Crear una clave única que incluya el tipo de conexión (automática vs manual)
//     // Usar un valor por defecto si isAutomatic no está definido
//     const connectionType = connection.isAutomatic === true ? 'auto' : 'manual';
//     const uniqueKey = `connection-${fromId}-${toId}-${index}-${connectionType}`;
    
//     return (
//       <Polyline
//         key={uniqueKey}
//         coordinates={[
//           {
//             latitude: connection.from.latitude,
//             longitude: connection.from.longitude
//           },
//           {
//             latitude: connection.to.latitude,
//             longitude: connection.to.longitude
//           }
//         ]}
//         strokeColor={connection.color}
//         strokeWidth={connection.isBackbone ? 4 : 3}
//         lineDashPattern={connection.isBackbone ? [] : [5, 5]}
//       />
//     );
//   }).filter(Boolean);
// };

const renderConnections = () => {
  const autoConnections = getConnections();
  const allConnections = [...autoConnections, ...connections];
  
  return allConnections.map((connection, index) => {
    // Validación de coordenadas
    if (!connection.from || !connection.to || 
        !connection.from.latitude || !connection.from.longitude ||
        !connection.to.latitude || !connection.to.longitude) {
      return null;
    }
    
    const fromId = connection.from.id || `temp-${connection.from.latitude}-${connection.from.longitude}`;
    const toId = connection.to.id || `temp-${connection.to.latitude}-${connection.to.longitude}`;
    
    const uniqueKey = `connection-${fromId}-${toId}-${index}-${connection.isAutomatic ? 'auto' : 'manual'}`;
    
    return (
      <Polyline
        key={uniqueKey}
        coordinates={[
          {
            latitude: connection.from.latitude,
            longitude: connection.from.longitude
          },
          {
            latitude: connection.to.latitude,
            longitude: connection.to.longitude
          }
        ]}
        strokeColor={connection.color}
        strokeWidth={connection.isBackbone ? 4 : 3}
        lineDashPattern={connection.isBackbone ? [] : [5, 5]}
      />
    );
  }).filter(Boolean);
};

const deleteNode = async (nodeId) => {
    try {
      Alert.alert(
        t('confirmDelete'),
        t('confirmDeleteNode'),
        [
          {
            text: t('cancel'),
            style: "cancel"
          },
          {
            text: t('delete'),
            onPress: async () => {
              try {
                // Eliminar de la base de datos
                const result = await NodeService.deleteNode(nodeId);
                
                if (result.rowsAffected > 0) {
                  // Eliminar del estado local
                  setNodes(prev => prev.filter(node => node.id !== nodeId));
                  
                  setShowNodeModal(false);
                  setSelectedNode(null);
                  
                  // Alert.alert(t('success'), t('nodeDeleted'));
                  showNotification(t('nodeDeleted'), 'success');
                } else {
                  // Alert.alert(t('error'), t('nodeNotDeleted'));
                  showNotification(t('nodeNotDeleted'), 'error');
                }
              } catch (error) {
                // // // console.log(t('errorDeletingNode'), error);
                // Alert.alert(t('error'), t('failedDeleteNode'));
                showNotification(t('failedDeleteNode'), 'error');
              }
            },
            style: "destructive"
          }
        ]
      );
    } catch (error) {
      // // // console.log(t('errorDeleteConfirmation'), error);
      Alert.alert(t('error'), t('couldNotInitiateDelete'));
    }
  };

  // Función para eliminar todos los nodos
  // const clearAllNodes = async () => {
  //   try {
  //     Alert.alert(
  //       t('confirmClearAll'),
  //       t('confirmClearAllNodes'),
  //       [
  //         {
  //           text: t('cancel'),
  //           style: "cancel"
  //         },
  //         {
  //           text: t('deleteAll'),
  //           onPress: async () => {
  //             try {
  //               // Eliminar todos los nodos de la base de datos
  //               const deletePromises = nodes.map(node => 
  //                 NodeService.deleteNode(node.id)
  //               );
                
  //               await Promise.all(deletePromises);
                
  //               // Limpiar el estado local
  //               setNodes([]);
  //               setSelectedNode(null);
                
  //               Alert.alert(t('success'), t('allNodesDeleted'));
  //             } catch (error) {
  //               // // // console.log(t('errorDeletingAllNodes'), error);
  //               Alert.alert(t('error'), t('failedDeleteAllNodes'));
  //             }
  //           },
  //           style: "destructive"
  //         }
  //       ]
  //     );
  //   } catch (error) {
  //     // // // console.log(t('errorClearAllConfirmation'), error);
  //     Alert.alert(t('error'), t('couldNotInitiateClearAll'));
  //   }
  // };

  const clearAllNodes = async () => {
  try {
    Alert.alert(
      t('confirmClearAll'),
      t('confirmClearAllNodes'),
      [
        {
          text: t('cancel'),
          style: "cancel"
        },
        {
          text: t('deleteAll'),
          onPress: async () => {
            try {
              // Eliminar todos los nodos de la base de datos
              const deletePromises = nodes.map(node => 
                NodeService.deleteNode(node.id)
              );
              
              await Promise.all(deletePromises);
              
              // Limpiar el estado local de nodos Y conexiones
              setNodes([]);
              setConnections([]); // ← Añadir esta línea
              setSelectedNode(null);
              
              // Alert.alert(t('success'), t('allNodesDeleted'));
              showNotification(t('allNodesDeleted'), 'success');
            } catch (error) {
              // // console.log(t('errorDeletingAllNodes'), error);
              // Alert.alert(t('error'), t('failedDeleteAllNodes'));
               showNotification(t('failedDeleteAllNodes'), 'error');
            }
          },
          style: "destructive"
        }
      ]
    );
  } catch (error) {
    // // console.log(t('errorClearAllConfirmation'), error);
    Alert.alert(t('error'), t('couldNotInitiateClearAll'));
  }
};

  // Normalizar datos
  const normalizeData = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data.filter(item => item && typeof item === 'object');
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        return normalizeData(parsed);
      } catch (e) {
        return [];
      }
    }
    if (typeof data === 'object') {
      const values = Object.values(data);
      const validValues = values.filter(item => 
        item && typeof item === 'object' && item.type !== undefined
      );
      if (validValues.length > 0) return validValues;
      if (data.type !== undefined) return [data];
    }
    return [];
  };

  // Componente para configuración de dispositivos
  const DeviceConfig = ({ device, onSave }) => {
    const [ports, setPorts] = useState(
      device.portsUsed && device.portsUsed.length > 0 
        ? device.portsUsed 
        : Array(device.ports).fill().map((_, i) => ({
            port: i + 1,
            description: '',
            connectedTo: ''
          }))
    );

    const saveConfiguration = () => {
      onSave({
        ...device,
        portsUsed: ports
      });
    };

    return (
      <View>
        <Text style={[styles.configSectionTitle, {color: theme.text}]}>{device.type} - {device.ports} {t('ports')}</Text>
        
        {ports.map((port, index) => (
          <View key={index} style={[styles.portItem]}>
            <Text style={[styles.portLabel, {color: theme.text}]}>{t('port')} {port.port}:</Text>
            <TextInput
              style={[styles.portInput, {color: theme.text}]}
              value={port.description}
              onChangeText={(text) => {
                const newPorts = [...ports];
                newPorts[index].description = text;
                setPorts(newPorts);
              }}
              placeholder={t('description')}
            />
            <TextInput
              style={styles.portInput}
              value={port.connectedTo}
              onChangeText={(text) => {
                const newPorts = [...ports];
                newPorts[index].connectedTo = text;
                setPorts(newPorts);
              }}
              placeholder={t('connectedTo')}
            />
          </View>
        ))}
        
        <TouchableOpacity style={[styles.saveConfigButton, {backgroundColor: theme.success}]} onPress={saveConfiguration}>
          <Text style={styles.saveConfigButtonText}>{t('saveConfiguration')}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Función para obtener código hexadecimal de color basado en nombre (soporta inglés y español)
const getColorHexCode = (colorName) => {
  if (!colorName) return '#CCCCCC';
  
  // Limpiar el nombre del color (puede venir con prefijo de tubo como "1-Blue")
  const cleanColorName = colorName.toString().split('-').pop().trim().toLowerCase();
  
  const colorMap = {
    // English colors
    'blue': '#0000FF',
    'orange': '#FFA500',
    'green': '#008000',
    'brown': '#A52A2A',
    'slate': '#708090',
    'gray': '#808080',
    'white': '#FFFFFF',
    'red': '#FF0000',
    'black': '#000000',
    'yellow': '#FFFF00',
    'violet': '#EE82EE',
    'rose': '#FF007F',
    'pink': '#FF007F',
    'aqua': '#00FFFF',
    
    // Spanish colors
    'azul': '#0000FF',
    'naranja': '#FFA500',
    'verde': '#008000',
    'marrón': '#A52A2A',
    'marrÃ³n': '#A52A2A', // Por si hay problemas de encoding
    'pizarra': '#708090',
    'gris': '#808080',
    'blanco': '#FFFFFF',
    'rojo': '#FF0000',
    'negro': '#000000',
    'amarillo': '#FFFF00',
    'violeta': '#EE82EE',
    'rosa': '#FF007F',
    'agua': '#00FFFF'
  };
  
  const hexColor = colorMap[cleanColorName] || '#CCCCCC';
  return hexColor;
};

  const FiberConfig = ({ fiber, onSave }) => {
    // Obtener colores estándar según el tipo de fibra
    const standardColors = getStandardFiberColors(fiber.type);
    
    // Siempre mostrar TODOS los colores de la fibra, independientemente de la cantidad
    const [colors, setColors] = useState(() => {
      const existingColors = fiber.colors || [];
      
      // Si ya tenemos colores configurados, usarlos
      if (existingColors.length > 0) {
        return existingColors;
      }
      
      // Si no, crear array con todos los colores estándar
      return standardColors.map((color, index) => ({
        color: color,
        description: '',
        connectedTo: ''
      }));
    });

    const saveConfiguration = () => {
      onSave({
        ...fiber,
        colors: colors // Guardar todos los colores
      });
    };

    return (
      <View>
        <Text style={[styles.configSectionTitle, {color: theme.text}]}>{fiber.type} {t('fiber')}</Text>
        <Text style={[styles.configSubtitle, {color: theme.text}]}>
          {standardColors.length} {t('fibersWithStandardColors')}
        </Text>
        <Text style={[styles.configInfo, {color:theme.text}]}>
          {t('quantity')}: {fiber.quantity} {t('unit')}(s) - {t('configureAll')} {standardColors.length} {t('fibers')}
        </Text>
        
        {colors.map((colorObj, index) => (
          <View key={index} style={styles.colorItemWithIndicator}>
            <View style={[styles.colorIndicator, 
              {backgroundColor: getColorHexCode(colorObj.color.split('-').pop())}]} 
            />
            <Text style={[styles.colorLabel, {color: theme.text}]}>{colorObj.color}:</Text>
            <TextInput
              style={[styles.colorInput, {color: theme.text}]}
              value={colorObj.description}
              onChangeText={(text) => {
                const newColors = [...colors];
                newColors[index].description = text;
                setColors(newColors);
              }}
              placeholder={t('description')}
            />
            <TextInput
              style={[styles.colorInput, {color: theme.text}]}
              value={colorObj.connectedTo}
              onChangeText={(text) => {
                const newColors = [...colors];
                newColors[index].connectedTo = text;
                setColors(newColors);
              }}
              placeholder={t('connectedTo')}
            />
          </View>
        ))}
        
        <TouchableOpacity style={[styles.saveConfigButton, {backgroundColor: theme.success}]} onPress={saveConfiguration}>
          <Text style={styles.saveConfigButtonText}>{t('saveConfiguration')}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const handleExistingNodeLink = (node) => {
  if (linkingMode && linkSource) {
    createLink(linkSource, node);
  }
};

  return (
    <View style={[stylesFull.screen, {backgroundColor: theme.background}, { paddingTop: topInset , paddingBottom: bottomInset }]}>

      <NotificationContainer />
      <MapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        onPress={handleMapPress}
      >
        {renderMarkers()}
        {renderConnections()}
      </MapView>

      {/* Mensaje de depuración (puedes eliminarlo después) */}
      <View style={styles.debugInfo}>
        <Text style={styles.debugText}>
          {t('nodes')}: {nodes.length} | {t('connections')}: {getConnections().length}
        </Text>
      </View>

      {/* Controles de tipo de nodo */}
      <View style={[styles.nodeTypeControls, {backgroundColor: theme.white}]}>
        <Text style={[styles.sectionTitle, {color: theme.text}]}>{t('addNode')}</Text>
        <View style={styles.nodeTypeButtons}>
          <TouchableOpacity
            style={[
              styles.nodeTypeButton,
              {backgroundColor: theme.primary},
              selectedNodeType === 'MDF' && [styles.nodeTypeButtonSelected, {backgroundColor: theme.accent}]
            ]}
            onPress={() => selectNodeType('MDF')}
          >
            <Ionicons name="server" size={24} color="#ffffff" />
            <Text style={styles.nodeTypeButtonText}>MDF</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.nodeTypeButton,
              {backgroundColor: theme.primary},
              selectedNodeType === 'pedestal' && [styles.nodeTypeButtonSelected, {backgroundColor: theme.accent}]
            ]}
            onPress={() => selectNodeType('pedestal')}
          >
            <Ionicons name="cube" size={24} color="#ffffff" />
            <Text style={styles.nodeTypeButtonText}>{t('pedestal')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.nodeTypeButton,
              {backgroundColor: theme.primary},
              selectedNodeType === 'IDF' && [styles.nodeTypeButtonSelected, {backgroundColor: theme.accent}]
            ]}
            onPress={() => selectNodeType('IDF')}
          >
            <Ionicons name="hardware-chip" size={24} color="#ffffff" />
            <Text style={styles.nodeTypeButtonText}>IDF</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.nodeTypeButton,
              {backgroundColor: theme.primary},
              selectedNodeType === 'unit' && [styles.nodeTypeButtonSelected, {backgroundColor: theme.accent}]
            ]}
            onPress={() => selectNodeType('unit')}
          >
            <Ionicons name="home" size={24} color="#ffffff" />
            <Text style={styles.nodeTypeButtonText}>{t('unit')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Botón de guardar */}
      <TouchableOpacity style={[styles.saveButton, {backgroundColor: theme.success}]} onPress={openSaveMapModal}>
        <Ionicons name="save" size={24} color="#ffffff" />
        <Text style={styles.saveButtonText}>{t('saveNetwork')}</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.clearButton, {backgroundColor: theme.danger}]} onPress={clearAllNodes}>
        <Ionicons name="trash" size={24} color="#ffffff" />
        <Text style={styles.clearButtonText}>{t('clearAll')}</Text>
      </TouchableOpacity>

      {/* Botón de regresar */}
<TouchableOpacity 
  style={[styles.backButton, {backgroundColor: theme.warning}]} 
  onPress={() => navigation.goBack()}
>
  <Ionicons name="arrow-back" size={24} color="#ffffff" />
  <Text style={styles.backButtonText}>{t('back')}</Text>
</TouchableOpacity>

      {/* Modal de detalles del nodo */}
      <Modal
        visible={showNodeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNodeModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, {backgroundColor: theme.white, maxHeight: '90%'}]}>
            <View style={[styles.modalHeader, {borderBottomColor: theme.border}]}>
              <Text style={[styles.modalTitle, {color: theme.text}]}>
                {selectedNode?.id ? t('editNode') : t('addNode')}
              </Text>
              <TouchableOpacity onPress={() => setShowNodeModal(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView 
            style={styles.modalBody}
            contentContainerStyle={styles.modalBodyContent}
            showsVerticalScrollIndicator={true}
            >
              <View style={styles.formGroup}>
                <Text style={[styles.label, {color: theme.text}]}>{t('nodeName')}</Text>
                <TextInput
                  style={[styles.input, {borderColor: theme.border, color: theme.text}]}
                  value={nodeForm.name}
                  onChangeText={(text) => setNodeForm({ ...nodeForm, name: text })}
                  placeholder={t('enterNodeName')}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, {color: theme.text}]}>{t('owner')}</Text>
                <TextInput
                  style={[styles.input, {borderColor: theme.border, color: theme.text}]}
                  value={nodeForm.owner}
                  onChangeText={(text) => setNodeForm({ ...nodeForm, owner: text })}
                  placeholder={t('enterOwnerName')}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, {color: theme.text}]}>{t('address')}</Text>
                {loadingAddress ? (
                  <ActivityIndicator size="small" color={theme.primary} />
                ) : (
                  <TextInput
                    style={[styles.input, styles.addressInput, {borderColor: theme.border, color: theme.text}]}
                    value={nodeForm.address}
                    onChangeText={(text) => setNodeForm({ ...nodeForm, address: text })}
                    placeholder={t('addressFromCoordinates')}
                    multiline
                  />
                )}
              </View>

              {/* Selector de dispositivos - Solo mostrar para MDF y unit */}
              {(selectedNode?.type === 'MDF' || selectedNode?.type === 'unit') && (
                <View style={styles.formGroup}>
                  <Text style={[styles.label, {color: theme.text}]}>{t('devices')}</Text>
                  {devices.length > 0 ? (
                    devices.map((device, index) => {
                      const availableCount = getAvailableCount(device);
                      const assignedInThisNode = getAssignedInThisNode(device);
                      const currentQuantity = nodeForm.selectedDevices?.find(d => 
                        d.type === device.type && d.ports === device.ports
                      )?.quantity || 0;
                      
                      return (
                        <View key={`device-${index}`} style={[styles.deviceItem, {borderColor: theme.border}]}>
                          <View style={styles.deviceInfo}>
                            <Text style={[styles.deviceName, {color: theme.text}]}>{device.type} ({device.ports} {t('ports')})</Text>
                            <Text style={[styles.deviceCount, {color: theme.lightText}]}>
                              {t('available')}: {availableCount + assignedInThisNode}
                            </Text>
                          </View>
                          
                          <View style={styles.quantitySelector}>
                            <TouchableOpacity
                              style={[styles.quantityButton, {backgroundColor: theme.primary}]}
                              onPress={() => updateDeviceQuantity(device, currentQuantity - 1)}
                              disabled={currentQuantity <= 0}
                            >
                              <Ionicons name="remove" size={16} color="#ffffff" />
                            </TouchableOpacity>
                            
                            <Text style={[styles.quantityText, {color: theme.text}]}>{currentQuantity}</Text>
                            
                            <TouchableOpacity
                              style={[
                                styles.quantityButton,
                                {backgroundColor: theme.primary},
                                currentQuantity >= (availableCount + assignedInThisNode) && [styles.quantityButtonDisabled, {backgroundColor: theme.border}]
                              ]}
                              onPress={() => updateDeviceQuantity(device, currentQuantity + 1)}
                              disabled={currentQuantity >= (availableCount + assignedInThisNode)}
                            >
                              <Ionicons name="add" size={16} color="#ffffff" />
                            </TouchableOpacity>
                          </View>
                          
                          {currentQuantity > 0 && (
                            <TouchableOpacity
                              style={styles.configureButton}
                              onPress={() => openConfigModal(
                                nodeForm.selectedDevices.find(d => 
                                  d.type === device.type && d.ports === device.ports
                                ), 
                                'device'
                              )}
                            >
                              <Ionicons name="settings" size={20} color={theme.primary} />
                              <Text style={[styles.configureButtonText, {color: theme.primary}]}>{t('configure')}</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      );
                    })
                  ) : (
                    <Text style={[styles.noItemsText, {color: theme.lightText}]}>{t('noDevicesConfigured')}</Text>
                  )}
                </View>
              )}

              {/* Selector de fibra - Solo mostrar para MDF y unit */}
              {(selectedNode?.type === 'MDF' || selectedNode?.type === 'unit') && (
                <View style={styles.formGroup}>
                  <Text style={[styles.label, {color: theme.text}]}>{t('fiberTypes')}</Text>
                  {fibers.length > 0 ? (
                    fibers.map((fiber, index) => {
                      const availableCount = getAvailableFiberCount(fiber);
                      const assignedInThisNode = getAssignedFiberInThisNode(fiber);
                      const currentQuantity = nodeForm.selectedFibers?.find(f => f.type === fiber.type)?.quantity || 0;
                      
                      return (
                        <View key={`fiber-${index}`} style={[styles.fiberItem, {borderColor: theme.border}]}>
                          <View style={styles.fiberInfo}>
                            <Text style={[styles.fiberName, {color: theme.text}]}>{fiber.type}</Text>
                            <Text style={[styles.fiberCount, {color: theme.lightText}]}>
                              {t('available')}: {availableCount + assignedInThisNode}
                            </Text>
                          </View>
                          
                          <View style={styles.quantitySelector}>
                            <TouchableOpacity
                              style={[styles.quantityButton, {backgroundColor: theme.primary}]}
                              onPress={() => updateFiberQuantity(fiber, currentQuantity - 1)}
                              disabled={currentQuantity <= 0}
                            >
                              <Ionicons name="remove" size={16} color="#ffffff" />
                            </TouchableOpacity>
                            
                            <Text style={[styles.quantityText, {color: theme.text}]}>{currentQuantity}</Text>
                            
                            <TouchableOpacity
                              style={[
                                styles.quantityButton,
                                {backgroundColor: theme.primary},
                                currentQuantity >= (availableCount + assignedInThisNode) && [styles.quantityButtonDisabled, {backgroundColor: theme.border}]
                              ]}
                              onPress={() => updateFiberQuantity(fiber, currentQuantity + 1)}
                              disabled={currentQuantity >= (availableCount + assignedInThisNode)}
                            >
                              <Ionicons name="add" size={16} color="#ffffff" />
                            </TouchableOpacity>
                          </View>
                          
                          {currentQuantity > 0 && (
                            <TouchableOpacity
                              style={styles.configureButton}
                              onPress={() => openConfigModal(
                                nodeForm.selectedFibers.find(f => f.type === fiber.type), 
                                'fiber'
                              )}
                            >
                              <Ionicons name="settings" size={20} color={theme.primary} />
                              <Text style={[styles.configureButtonText, {color: theme.primary}]}>{t('configure')}</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      );
                    })
                  ) : (
                    <Text style={[styles.noItemsText, {color: theme.lightText}]}>{t('noFiberTypesConfigured')}</Text>
                  )}
                </View>
              )}

              {/* Mensaje informativo para pedestal e IDF */}
              {(selectedNode?.type === 'pedestal' || selectedNode?.type === 'IDF') && (
                <View style={[styles.infoBox, {backgroundColor: theme.secondary}]}>
                  <Ionicons name="information-circle" size={20} color={theme.primary} />
                  <Text style={[styles.infoText, {color: theme.text}]}>
                    {t('noConfigNeededForNode', {nodeType: selectedNode?.type})}
                  </Text>
                </View>
              )}
            </ScrollView>

            <View style={[styles.modalFooter, {borderTopColor: theme.border}]}>
              {selectedNode?.id && (
                <TouchableOpacity
                  style={[styles.deleteButton, {backgroundColor: theme.danger}]}
                  onPress={() => deleteNode(selectedNode.id)}
                >
                  <Ionicons name="trash" size={20} color="#ffffff" />
                  <Text style={styles.deleteButtonText}>{t('delete')}</Text>
                </TouchableOpacity>
              )}
              
              <View style={styles.footerRightButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowNodeModal(false)}
                >
                  <Text style={[styles.cancelButtonText, {color: theme.lightText}]}>{t('cancel')}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.saveModalButton, {backgroundColor: theme.success}]}
                  onPress={selectedNode?.id ? updateNode : addNode}
                >
                  <Text style={styles.saveModalButtonText}>
                    {selectedNode?.id ? t('update') : t('addNode')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de configuración de dispositivos/fibras */}
      <Modal
        visible={showConfigModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowConfigModal(false)}
      >
        <View style={styles.configModalContainer}>
          <View style={[styles.configModalContent, {backgroundColor: theme.white}]}>
            <View style={[styles.configModalHeader, {borderBottomColor: theme.border}]}>
              <Text style={[styles.configModalTitle, {color: theme.text}]}>
                {t('configure')} {configType === 'device' ? t('device') : t('fiber')}
              </Text>
              <TouchableOpacity onPress={() => setShowConfigModal(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.configModalBody}>
              {configType === 'device' && currentConfig && (
                <DeviceConfig 
                  device={currentConfig} 
                  onSave={saveConfig}
                />
              )}
              
              {configType === 'fiber' && currentConfig && (
                <FiberConfig 
                  fiber={currentConfig} 
                  onSave={saveConfig}
                />
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal para ingresar nombre del mapa */}
      <Modal
        visible={showNameModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNameModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, {backgroundColor: theme.white}]}>
            <View style={[styles.modalHeader, {borderBottomColor: theme.border}]}>
              <Text style={[styles.modalTitle, {color: theme.text}]}>
                {t('nameYourMap')}
              </Text>
              <TouchableOpacity onPress={() => setShowNameModal(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.label, {color: theme.text}]}>
                {t('enterMapName')}
              </Text>
              <TextInput
                style={[styles.input, {borderColor: theme.border, color: theme.text}]}
                value={mapName}
                onChangeText={setMapName}
                placeholder={t('mapNamePlaceholder')}
                autoFocus={true}
              />
            </View>

            <View style={[styles.modalFooter, {borderTopColor: theme.border}]}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowNameModal(false)}
              >
                <Text style={[styles.cancelButtonText, {color: theme.lightText}]}>
                  {t('cancel')}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.saveModalButton, {backgroundColor: theme.success}]}
                onPress={saveNetworkMapWithName}
                disabled={!mapName.trim()}
              >
                <Text style={styles.saveModalButtonText}>
                  {t('save')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal ligero para nuevos enlaces*/}
<Modal
  visible={linkMenuVisible}
  transparent
  animationType="fade"
  onRequestClose={() => setLinkMenuVisible(false)}
>
  <View style={styles.linkMenuOverlay}>
    <View style={styles.linkMenu}>
      <Text style={styles.linkMenuTitle}>{t('optionEnlace')}</Text>
      <Text style={styles.linkMenuSubtitle}>
        {t('nodoSelec')} {selectedNodeForMenu?.name}
      </Text>
      
      <TouchableOpacity
        style={styles.linkMenuButton}
        onPress={() => {
          setLinkSource(selectedNodeForMenu);
          setLinkingMode(true);
          setLinkMenuVisible(false);
          Alert.alert(t('modoEnlace'), 
            t('newNode'));
        }}
      >
        <Ionicons name="link" size={20} color="#fff" />
        <Text style={styles.linkMenuButtonText}>{t('enlazarNodoNew')}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.linkMenuButton, {backgroundColor: '#3498db'}]}
        onPress={() => {
          setLinkSource(selectedNodeForMenu);
          setLinkingMode(true);
          setLinkMenuVisible(false);
          Alert.alert(t('modoEnlace'), 
            t('touchNode'));
        }}
      >
        <Ionicons name="navigate" size={20} color="#fff" />
        <Text style={styles.linkMenuButtonText}>{t('enlazarNode')}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.linkMenuButton, styles.cancelButton]}
        onPress={() => setLinkMenuVisible(false)}
      >
        <Text style={styles.linkMenuButtonText}>Cancelar</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>
{linkingMode && (
  <TouchableOpacity
    style={styles.exitLinkingButton}
    onPress={() => {
      setLinkingMode(false);
      setLinkSource(null);
    }}
  >
    <Ionicons name="close-circle" size={24} color="#fff" />
    <Text style={styles.exitLinkingText}>{t('dejarEnlace')}</Text>
  </TouchableOpacity>
)}
    </View>

  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  nodeTypeControls: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    borderRadius: 10,
    padding: 15,
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  nodeTypeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nodeTypeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    padding: 10,
    width: 70,
    height: 70,
  },
  nodeTypeButtonSelected: {
    // El color se aplica dinámicamente
  },
  nodeTypeButtonText: {
    color: '#ffffff',
    fontSize: 12,
    marginTop: 5,
  },
  saveButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    padding: 15,
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerLabel: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 4,
    borderRadius: 4,
    marginTop: 4,
  },
  markerText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  markerType: {
    fontSize: 8,
    color: '#666',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  // modalContent: {
  //   width: '90%',
  //   maxHeight: '80%',
  //   borderRadius: 10,
  //   overflow: 'hidden',
  // },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  // modalBody: {
  //   padding: 15,
  //   maxHeight: '70%',
  // },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
  },
  addressInput: {
    height: 60,
    textAlignVertical: 'top',
  },
  deviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 5,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  deviceCount: {
    fontSize: 12,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonDisabled: {
    // El color se aplica dinámicamente
  },
  quantityText: {
    marginHorizontal: 10,
    fontSize: 16,
    fontWeight: 'bold',
    minWidth: 20,
    textAlign: 'center',
  },
  fiberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 5,
  },
  fiberInfo: {
    flex: 1,
  },
  fiberName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  fiberCount: {
    fontSize: 12,
  },
  noItemsText: {
    fontStyle: 'italic',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  infoText: {
    marginLeft: 10,
    fontSize: 14,
    flex: 1,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderTopWidth: 1,
  },
  footerRightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 5,
    padding: 10,
  },
  deleteButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  cancelButton: {
    padding: 10,
    marginRight: 10,
  },
  cancelButtonText: {
    fontSize: 16,
  },
  saveModalButton: {
    borderRadius: 5,
    padding: 10,
  },
  saveModalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  debugInfo: {
    position: 'absolute',
    top: 100,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 5,
    borderRadius: 5,
  },
  debugText: {
    color: '#ffffff',
    fontSize: 12,
  },
  clearButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    padding: 15,
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  clearButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  // Estilos para modales de configuración
  configModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  configModalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 10,
    overflow: 'hidden',
  },
  configModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
  },
  configModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  configModalBody: {
    padding: 15,
  },
  configSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  configSubtitle: {
    fontSize: 14,
    marginBottom: 15,
  },
  configInfo: {
    fontSize: 12,
    marginBottom: 15,
    fontStyle: 'italic',
  },
  portItem: {
    marginBottom: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
  },
  portLabel: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  portInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 8,
    marginBottom: 5,
  },
  colorItemWithIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
  },
  colorIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  colorLabel: {
    fontWeight: 'bold',
    marginRight: 10,
    minWidth: 80,
  },
  colorInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 8,
    marginLeft: 5,
  },
  saveConfigButton: {
    borderRadius: 5,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  saveConfigButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  configureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  configureButtonText: {
    marginLeft: 5,
    fontSize: 12,
  },
  linkMenuOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.4)',
  justifyContent: 'center',
  alignItems: 'center'
},
linkMenu: {
  backgroundColor: '#fff',
  borderRadius: 12,
  padding: 20,
  width: '75%'
},
linkMenuTitle: {
  fontSize: 16,
  marginBottom: 15,
  textAlign: 'center'
},
linkMenuButton: {
  backgroundColor: '#3498db',
  padding: 12,
  borderRadius: 8,
  marginBottom: 10
},
exitLinkingButton: {
  position: 'absolute',
  bottom: 100,
  alignSelf: 'center',
  flexDirection: 'row',
  backgroundColor: 'rgba(231,76,60,0.9)',
  paddingHorizontal: 16,
  paddingVertical: 10,
  borderRadius: 24,
  alignItems: 'center'
},
exitLinkingText: {
  color: '#fff',
  marginLeft: 6,
  fontWeight: '600'
},
linkMenuOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.4)',
  justifyContent: 'center',
  alignItems: 'center'
},
linkMenu: {
  backgroundColor: '#fff',
  borderRadius: 12,
  padding: 20,
  width: '75%'
},
linkMenuTitle: {
  fontSize: 16,
  marginBottom: 15,
  textAlign: 'center'
},
linkMenuButton: {
  backgroundColor: '#3498db',
  padding: 12,
  borderRadius: 8,
  marginBottom: 10
},
linkMenuButtonText: {
  color: '#fff',
  textAlign: 'center'
},
// cancelButton: {
//   backgroundColor: '#e74c3c'
// },
exitLinkingButton: {
  position: 'absolute',
  bottom: 100,
  alignSelf: 'center',
  flexDirection: 'row',
  backgroundColor: 'rgba(231,76,60,0.9)',
  paddingHorizontal: 16,
  paddingVertical: 10,
  borderRadius: 24,
  alignItems: 'center'
},
exitLinkingText: {
  color: '#fff',
  marginLeft: 6,
  fontWeight: '600'
},
linkMenuSubtitle: {
  fontSize: 14,
  marginBottom: 15,
  textAlign: 'center',
  color: '#666'
},
backButton: {
  position: 'absolute',
  bottom: 90, // Ajustar posición para que no se superponga con otros botones
  right: 20,
  flexDirection: 'row',
  alignItems: 'center',
  borderRadius: 8,
  padding: 15,
  shadowColor: 'black',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
  elevation: 5,
},
backButtonText: {
  color: '#ffffff',
  fontSize: 16,
  fontWeight: 'bold',
  marginLeft: 5,
},
notificationContainer: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    zIndex: 1000,
    alignItems: 'center',
  },
  notification: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    minWidth: '90%',
    maxWidth: '90%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  notificationText: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
    marginRight: 10,
  },
  notificationClose: {
    padding: 5,
  },
  // modalContainer: {
  //   flex: 1,
  //   justifyContent: 'center',
  //   alignItems: 'center',
  //   backgroundColor: 'rgba(0, 0, 0, 0.5)',
  // },
  // modalContent: {
  //   width: '90%',
  //   borderRadius: 10,
  //   overflow: 'hidden',
  // },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  // modalBody: {
  //   padding: 15,
  // },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 15,
    borderTopWidth: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
  },
  cancelButton: {
    padding: 10,
    marginRight: 10,
  },
  cancelButtonText: {
    fontSize: 16,
  },
  saveModalButton: {
    borderRadius: 5,
    padding: 10,
  },
  saveModalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
//   modalContainer: {
//   flex: 1,
//   justifyContent: 'center',
//   alignItems: 'center',
//   backgroundColor: 'rgba(0, 0, 0, 0.5)',
// },
modalContent: {
  width: '90%',
  maxHeight: '90%', // Limitar altura máxima
  borderRadius: 10,
  overflow: 'hidden',
  padding: 15
},
modalBody: {
  maxHeight: '70%', // Limitar altura del cuerpo
},
modalBodyContent: {
  paddingBottom: 20, // Espacio adicional al final
},
// Para secciones con muchos elementos, agregar scroll interno
configSection: {
  maxHeight: 200, // Altura máxima para secciones de configuración
},
});

export default NetworkMap;