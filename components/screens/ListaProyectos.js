// components/ListaProyectos.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../hooks/useTranslation';
import { useDevice } from '../context/DeviceContext';
import { ProjectService } from '../../service/storage';
import QRGeneratorModal from './QRGeneratorModal';

import { useDatabase } from '@/api/contexts/DatabaseContext';

const ListaProyectos = ({ navigation }) => {
  const { topInset, bottomInset, stylesFull } = useDevice();
  const { isDarkMode } = useApp();
  const { t } = useTranslation();
  
  const [proyectos, setProyectos] = useState([]);
  const [filteredProyectos, setFilteredProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  const colors = {
    background: isDarkMode ? '#121212' : '#ffffff',
    card: isDarkMode ? '#1e1e1e' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#2c3e50',
    subText: isDarkMode ? '#b0b0b0' : '#7f8c8d',
    border: isDarkMode ? '#333' : '#ecf0f1',
    input: isDarkMode ? '#2a2a2a' : '#ffffff',
  };

  useEffect(() => {
    loadProyectos();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = proyectos.filter(proyecto =>
        (proyecto.name && proyecto.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (proyecto.id && proyecto.id.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (proyecto.createdAt && proyecto.createdAt.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredProyectos(filtered);
    } else {
      setFilteredProyectos(proyectos);
    }
  }, [searchQuery, proyectos]);

  const loadProyectos = async () => {
    try {
      setLoading(true);
      const projects = await ProjectService.getProjects();
      setProyectos(projects);
      setFilteredProyectos(projects);
    } catch (error) {
      console.error('Error loading projects:', error);
      Alert.alert(t('error'), t('couldNotLoadProjects'));
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = (proyecto) => {
    setSelectedProject(proyecto);
    setQrModalVisible(true);
  };

  const deleteProyecto = async (proyecto) => {
    Alert.alert(
      t('confirmDelete'),
      t('confirmDeleteProjectMessage', { name: getProjectDisplayName(proyecto) }),
      [
        {
          text: t('cancel'),
          style: 'cancel'
        },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await ProjectService.deleteProject(proyecto.id);
              Alert.alert(t('success'), t('projectDeletedSuccessfully'));
              loadProyectos();
            } catch (error) {
              console.error('Error deleting project:', error);
              Alert.alert(t('error'), t('couldNotDeleteProject'));
            }
          }
        }
      ]
    );
  };

  const deleteAllProyectos = async () => {
    if (proyectos.length === 0) {
      Alert.alert(t('info'), t('noProjectsToDelete'));
      return;
    }

    Alert.alert(
      t('confirmDeleteAll'),
      t('confirmDeleteAllProjectsMessage', { count: proyectos.length }),
      [
        {
          text: t('cancel'),
          style: 'cancel'
        },
        {
          text: t('deleteAll'),
          style: 'destructive',
          onPress: async () => {
            try {
              for (const proyecto of proyectos) {
                await ProjectService.deleteProject(proyecto.id);
              }
              Alert.alert(t('success'), t('allProjectsDeletedSuccessfully'));
              loadProyectos();
            } catch (error) {
              console.error('Error deleting all projects:', error);
              Alert.alert(t('error'), t('couldNotDeleteAllProjects'));
            }
          }
        }
      ]
    );
  };

  const getProjectDisplayName = (proyecto) => {
    return proyecto.name || proyecto.id || t('unnamedProject');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const viewProjectDetails = (proyecto) => {
    // Navegar a una pantalla de detalles del proyecto o mostrar modal
    // console.log('Viewing details for project:', proyecto);
    navigation.navigate('DetallesProyecto', { proyecto });
    // Alert.alert(
    //   getProjectDisplayName(proyecto),
    //   `ID: ${proyecto.id}\n` +
    //   `Nombre: ${proyecto.name || 'No especificado'}\n` +
    //   `Descripción: ${proyecto.description || 'No especificada'}\n` +
    //   `Creado: ${formatDate(proyecto.createdAt)}\n` +
    //   `Actualizado: ${formatDate(proyecto.updatedAt || proyecto.createdAt)}`,
    //   [
    //     {
    //       text: 'OK',
    //       style: 'default'
    //     },
    //     {
    //       text: 'Ver en Mapa',
    //       onPress: () => navigation.navigate('ViewOnMap', { selectedProject: proyecto })
    //     }
    //   ]
    // );
  };

  const renderProyectoItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.proyectoItem, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => viewProjectDetails(item)}
    >
      <View style={styles.proyectoItemHeader}>
        <Ionicons name="business" size={24} color="#3498db" />
        <Text style={[styles.proyectoItemTitle, { color: colors.text }]}>
          {getProjectDisplayName(item)}
        </Text>
        <TouchableOpacity 
            onPress={() => generateQRCode(item)}
            style={styles.qrButton}
          >
            <Ionicons name="qr-code" size={20} color="#3498db" />
          </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => deleteProyecto(item)}
          style={styles.deleteButton}
        >
          <Ionicons name="trash" size={20} color="#e74c3c" />
        </TouchableOpacity>
      </View>
      
      {item.description && (
        <Text style={[styles.proyectoDescription, { color: colors.subText }]}>
          {item.description}
        </Text>
      )}
      
      <View style={styles.proyectoItemDetails}>
        <View style={styles.proyectoItemDetail}>
          <Ionicons name="calendar" size={16} color="#7f8c8d" />
          <Text style={[styles.proyectoItemText, { color: colors.subText }]}>
            {formatDate(item.createdAt)}
          </Text>
        </View>
        
        {item.status && (
          <View style={styles.proyectoItemDetail}>
            <Ionicons name="information-circle" size={16} color="#7f8c8d" />
            <Text style={[styles.proyectoItemText, { color: colors.subText }]}>
              {item.status}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={[styles.loadingText, { color: colors.subText }]}>
          {t('loadingProjects')}
        </Text>
      </View>
    );
  }

  return (
    <View style={[stylesFull.screen, { backgroundColor: colors.background }, { paddingBottom: bottomInset }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border}, {paddingTop: topInset - 10}]}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#2c3e50" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t('projectsList')}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={deleteAllProyectos} style={styles.deleteAllButton}>
            <Ionicons name="trash" size={24} color="#e74c3c" />
          </TouchableOpacity>
          <TouchableOpacity onPress={loadProyectos} style={styles.refreshButton}>
            <Ionicons name="refresh" size={24} color="#3498db" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <Ionicons name="search" size={20} color="#7f8c8d" style={styles.searchIcon} />
        <TextInput
          placeholder={t('searchProjectsPlaceholder')}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.subText}
          style={[styles.searchInput, { backgroundColor: colors.input, color: colors.text }]}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#7f8c8d" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Projects List */}
      {filteredProyectos.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="folder-open" size={64} color="#bdc3c7" />
          <Text style={[styles.emptyStateText, { color: colors.text }]}>
            {t('noProjects')}
          </Text>
          <Text style={[styles.emptyStateSubtext, { color: colors.subText }]}>
            {t('createProjectsToSeeHere')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredProyectos}
          renderItem={renderProyectoItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

       {/* Modal de Generación de QR */}
      <QRGeneratorModal
        visible={qrModalVisible}
        onClose={() => setQrModalVisible(false)}
        project={selectedProject}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7f8c8d',
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
  deleteAllButton: {
    padding: 4,
    marginRight: 12,
  },
  refreshButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    margin: 16,
    marginTop: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dce4ec',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
    color: '#7f8c8d',
  },
  searchInput: {
    flex: 1,
    color: '#2c3e50',
    fontSize: 16,
  },
  listContainer: {
    padding: 16,
  },
  proyectoItem: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  proyectoItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    justifyContent: 'space-between',
  },
  proyectoItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 12,
    flex: 1,
  },
  proyectoDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  deleteButton: {
    padding: 4,
  },
  proyectoItemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  proyectoItemDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  proyectoItemText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginLeft: 6,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#7f8c8d',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#bdc3c7',
    textAlign: 'center',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qrButton: {
    padding: 4,
    marginRight: 8,
  },
  deleteButton: {
    padding: 4,
  },
});

export default ListaProyectos;