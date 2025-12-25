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
  TextInput,
  Modal,
  Button
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../hooks/useTranslation';
import { useDevice } from '../context/DeviceContext';
import { ProjectService } from '../../service/storage';
import QRGeneratorModal from './QRGeneratorModal';

import { useAdapter } from '@/api/contexts/DatabaseContext';

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
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { getProjects, hardDeleteProject } = useAdapter()();

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
      //const projects = await ProjectService.getProjects();
      const projects = await getProjects();
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

  const openProject = (proyecto) => {
      console.log('🚀 Abriendo proyecto:', proyecto.id, proyecto.name);
      console.log('📊 Estado actual - deleteModalVisible:', deleteModalVisible, 'projectToDelete:', projectToDelete);
      navigation.navigate('CreateProject', {
        projectId: proyecto.id
      });
  };  

  const deleteProyecto = async (proyecto) => {
    console.log('\ud83d\udc40 deleteProyecto called with proyecto:', proyecto);
    console.log('\ud83d\udc40 proyecto.id:', proyecto.id);
    console.log('\ud83d\udc40 proyecto.name:', proyecto.name);
    
    // Abrir modal de confirmación
    setProjectToDelete(proyecto);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!projectToDelete) {
      console.log('⚠️ confirmDelete: No hay proyecto para eliminar');
      return;
    }
    
    try {
      setIsDeleting(true);
      console.log('🗑️ Confirmando eliminación del proyecto:', projectToDelete.id);
      const result = await hardDeleteProject(projectToDelete.id);
      console.log('✅ Proyecto eliminado exitosamente:', result);
      setDeleteModalVisible(false);
      setProjectToDelete(null);
      setIsDeleting(false);
      Alert.alert(t('success') || 'Éxito', 'Proyecto eliminado exitosamente');
      console.log('🔄 Recargando lista de proyectos...');
      await loadProyectos();
    } catch (error) {
      console.error('❌ Error eliminando proyecto:', error);
      Alert.alert(t('error') || 'Error', 'No se pudo eliminar el proyecto: ' + error.message);
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    console.log('🚫 Cancelando eliminación de proyecto');
    setDeleteModalVisible(false);
    setProjectToDelete(null);
    setIsDeleting(false);
  };

  const deleteAllProyectos = async () => {
    if (proyectos.length === 0) {
      Alert.alert(t('info') || 'Información', 'No hay proyectos para eliminar');
      return;
    }

    Alert.alert(
      t('warning') || 'Advertencia',
      `¿Estás seguro de que deseas eliminar TODOS los ${proyectos.length} proyecto(s)? Esta acción no se puede deshacer.`,
      [
        {
          text: t('cancel') || 'Cancelar',
          style: 'cancel'
        },
        {
          text: t('delete') || 'Eliminar todos',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ Deleting all projects...');
              for (const proyecto of proyectos) {
                await hardDeleteProject(proyecto.id);
                console.log('✅ Deleted project:', proyecto.id);
              }
              Alert.alert(t('success') || 'Éxito', 'Todos los proyectos han sido eliminados');
              loadProyectos();
            } catch (error) {
              console.error('❌ Error deleting all projects:', error);
              Alert.alert(t('error') || 'Error', 'No se pudieron eliminar todos los proyectos: ' + error.message);
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

  const renderProyectoItem = ({ item }) => {
    // Manejar tanto item.meta como item directamente (para compatibilidad SQLite)
    const meta = item.meta || item;
    
    return (

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
            onPress={(e) => {
              console.log('📂 Open button pressed');
              if (e && e.stopPropagation) e.stopPropagation();
              openProject(item);
            }}
            style={styles.qrButton}
          >
            <Ionicons name="folder-open" size={20} color="#3498db" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={(e) => {
              console.log('📱 QR button pressed');
              if (e && e.stopPropagation) e.stopPropagation();
              generateQRCode(item);
            }}
            style={styles.qrButton}
          >
            <Ionicons name="qr-code" size={20} color="#3b3f42ff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={(e) => {
              console.log('🗑 Delete button pressed for project:', item.id);
              if (e && e.stopPropagation) {
                e.stopPropagation();
              }
              deleteProyecto(item);
            }}
            style={styles.deleteButton}
          >
            <Ionicons name="trash" size={20} color="#e74c3c" />
          </TouchableOpacity>
        </View>

        {meta && meta.description && (
          <Text style={[styles.proyectoDescription, { color: colors.subText }]}>
            {meta.description}
          </Text>
        )}

        <View style={styles.proyectoItemDetails}>
          <View style={styles.proyectoItemDetail}>
            <Ionicons name="calendar" size={16} color="#7f8c8d" />
            <Text style={[styles.proyectoItemText, { color: colors.subText }]}>
              {formatDate(meta && meta.createdAt)}
            </Text>
          </View>

          {meta && meta.status && (
            <View style={styles.proyectoItemDetail}>
              <Ionicons name="information-circle" size={16} color="#7f8c8d" />
              <Text style={[styles.proyectoItemText, { color: colors.subText }]}>
                {meta.status}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }

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
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }, { paddingTop: topInset - 10 }]}>
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

      {/* Modal de Confirmación de Eliminación */}
      <Modal
        visible={deleteModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelDelete}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t('warning') || 'Advertencia'}
            </Text>
            
            <Text style={[styles.modalMessage, { color: colors.text }]}>
              {projectToDelete && `¿Estás seguro de que deseas eliminar el proyecto "${getProjectDisplayName(projectToDelete)}"? Esta acción no se puede deshacer.`}
            </Text>

            {isDeleting && (
              <ActivityIndicator size="large" color="#3498db" style={{ marginVertical: 20 }} />
            )}

            <View style={styles.modalButtons}>
              <Button
                onPress={cancelDelete}
                title={t('cancel') || 'Cancelar'}
                color="#95a5a6"
                disabled={isDeleting}
              />
              <Button
                onPress={confirmDelete}
                title={t('delete') || 'Eliminar'}
                color="#e74c3c"
                disabled={isDeleting}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#2c3e50',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
});

export default ListaProyectos;