import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  RefreshControl,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../hooks/useTranslation';
import { useApp } from '../context/AppContext';
import { useDevice } from '../context/DeviceContext';
import { ProjectService, NetworkMapService, UnitsService, ProjectTypeService, NodeService, FileService } from '../../service/storage';
import { useAdapter } from '@/api/contexts/DatabaseContext';

const DashboardScreen = ({ navigation, theme }) => {
  const { t } = useTranslation();
  const { isDarkMode, logout } = useApp();
  const { insets, isSmall, isTablet, topInset, bottomInset, stylesFull } = useDevice();
  const [existingProjects, setExistingProjects] = useState([]);
  const [existingMaps, setExistingMaps] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const { getProjects } = useAdapter()();

  const loadExistingProjects = async () => {
    try {
      console.log('\ud83d\udccb Loading projects for dashboard...');
      const projects = await getProjects();
      console.log('\ud83d\udccb Projects loaded:', projects.length);
      // Filtrar proyectos no eliminados (por si acaso el adaptador devuelve algunos eliminados)
      const activeProjects = projects.filter(p => p.deleted === 0 || p.deleted === undefined);
      console.log('\ud83d\udccb Active projects:', activeProjects.length);
      setExistingProjects(activeProjects);
    } catch (error) {
      console.log('\u274c Error loading projects:', error);
      Alert.alert(t('error'), t('couldNotLoadProjects'));
    }
  };

  const loadExistingMaps = async () => {
    try {
      const mapas = await NetworkMapService.getAllNetworkMaps();
      setExistingMaps(mapas);
    } catch (error) {
      console.log('Error loading projects:', error);
      Alert.alert(t('error'), t('couldNotLoadProjects'));
    }
  };

  const loadAllData = async () => {
    try {
      setRefreshing(true);
      await Promise.all([
        loadExistingProjects(),
        loadExistingMaps(),
      ]);
    } catch (error) {
      console.log('Error loading all data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      t('confirmLogout'),
      t('confirmLogoutMessage'),
      [
        {
          text: t('cancel'),
          style: "cancel"
        },
        {
          text: t('logout1'),
          onPress: () => {
            try {
              logout();
            } catch (error) {
              console.error('Error during logout:', error);
              Alert.alert(t('error'), t('logoutError'));
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  }, []);

  const menuOptions = [
    {
      id: 1,
      title: t('createProject'),
      icon: 'document-text-outline',
      color: '#3498db',
      onPress: () => navigation.navigate('CreateProject')
    },
    {
      id: 2,
      title: t('listOfProjects'),
      icon: 'list-outline',
      color: '#2ebaccff',
      onPress: () => navigation.navigate('ListaProyectos')
    },
    {
      id: 3,
      title: t('scanQR'),
      icon: 'qr-code-outline',
      color: '#2ecc71',
      onPress: () => navigation.navigate('ScanQr')
    },
    {
      id: 4,
      title: t('createMaintenance'),
      icon: 'construct-outline',
      color: '#e67e22',
      onPress: () => navigation.navigate('CreateMaintenance')
    },
    {
      id: 5,
      title: t('viewOnMap'),
      icon: 'map-outline',
      color: '#e74c3c',
      onPress: () => navigation.navigate('ViewOnMap')
    },
    {
      id: 6,
      title: t('userProfile'),
      icon: 'person-outline',
      color: '#1abc9c',
      onPress: () => navigation.navigate('UserProfile')
    },
    {
      id: 7,
      title: t('settings'),
      icon: 'settings-outline',
      color: '#95a5a6',
      onPress: () => navigation.navigate('Settings')
    },
    {
      id: 8,
      title: t('logout1'),
      icon: 'log-out-outline',
      color: '#7f8c8d',
      onPress: () => handleLogout()
    }
  ];

  return (
    <View style={[stylesFull.screen, isDarkMode && styles.darkContainer, { paddingBottom: bottomInset }]}>
      {/* Header */}
      <View style={[styles.header, isDarkMode && styles.darkContainer, { paddingTop: topInset - 15 }]}>
        <Image
          source={require('../../assets/images/logo2.png')}
          style={[
            styles.logo,
            isSmall && { width: '60%', height: 60 },
            isTablet && { width: '40%', height: 100 }
          ]}
          resizeMode="contain"
        />
      </View>

      {/* Main Content */}
      <ScrollView
        scrollEnabled={true}
        nestedScrollEnabled={Platform.OS !== 'web'}
        removeClippedSubviews={Platform.OS === 'web' ? false : true}
        showsVerticalScrollIndicator={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3498db']}
            tintColor={isDarkMode ? '#ffffff' : '#3498db'}
            title={t('pullToRefresh')}
            titleColor={isDarkMode ? '#ffffff' : '#7f8c8d'}
          />
        }
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        {/* Refresh Indicator */}
        {refreshing && (
          <View style={styles.refreshIndicator}>
            <Ionicons name="refresh" size={20} color="#3498db" />
            <Text style={[styles.refreshText, isDarkMode && styles.darkText]}>
              {t('refreshing')}
            </Text>
          </View>
        )}

        <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
          {t('mainMenu')}
        </Text>

        <View style={styles.gridContainer}>
          {menuOptions.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuCard, { borderLeftColor: item.color }, isDarkMode && styles.darkCard]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, isDarkMode && styles.darkIconContainer]}>
                <Ionicons name={item.icon} size={24} color={item.color} />
              </View>
              <Text style={[styles.menuTitle, isDarkMode && styles.darkText]}>
                {item.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
            {t('quickStats')}
          </Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, isDarkMode && styles.darkCard]}>
              <Ionicons name="document-outline" size={24} color="#3498db" />
              <Text style={[styles.statNumber, isDarkMode && styles.darkText]}>{existingProjects.length}</Text>
              <Text style={styles.statLabel}>{t('activeProjects')}</Text>
            </View>
            <View style={[styles.statCard, isDarkMode && styles.darkCard]}>
              <Ionicons name="checkmark-circle-outline" size={24} color="#2ecc71" />
              <Text style={[styles.statNumber, isDarkMode && styles.darkText]}>{existingProjects.length}</Text>
              <Text style={styles.statLabel}>{t('completed')}</Text>
            </View>
            <View style={[styles.statCard, isDarkMode && styles.darkCard]}>
              <Ionicons name="alert-circle-outline" size={24} color="#e67e22" />
              <Text style={[styles.statNumber, isDarkMode && styles.darkText]}>0</Text>
              <Text style={styles.statLabel}>{t('pending')}</Text>
            </View>
            <View style={[styles.statCard, isDarkMode && styles.darkCard]}>
              <Ionicons name="map-outline" size={24} color="#9b59b6" />
              <Text style={[styles.statNumber, isDarkMode && styles.darkText]}>{existingMaps.length}</Text>
              <Text style={styles.statLabel}>{t('existingMaps')}</Text>
            </View>
          </View>
        </View>

        {/* Last Update Time */}
        <View style={styles.lastUpdateContainer}>
          <Text style={[styles.lastUpdateText, isDarkMode && styles.darkText]}>
            {t('lastUpdate')}: {new Date().toLocaleTimeString()}
          </Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, isDarkMode && styles.darkFooter]}>
        <Text style={[styles.footerText, isDarkMode && styles.darkFooterText]}>
          v1.0 • {t('connected')}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  header: {
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
    boxShadow: '0px 2px 3px rgba(0, 0, 0, 0.05)',
    elevation: 2,
  },
  darkHeader: {
    backgroundColor: '#1e1e1e',
    borderBottomColor: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 5,
    fontWeight: '300',
  },
  darkText: {
    color: '#ffffff',
  },
  refreshIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    marginBottom: 10,
  },
  refreshText: {
    marginLeft: 8,
    color: '#7f8c8d',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16,
    marginLeft: 4,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  menuCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  darkCard: {
    backgroundColor: '#1e1e1e',
    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.3)',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  darkIconContainer: {
    backgroundColor: '#2a2a2a',
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
    marginTop: 4,
  },
  statsContainer: {
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
    elevation: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  lastUpdateContainer: {
    alignItems: 'center',
    marginTop: 16,
    padding: 10,
    marginBottom: 20,
  },
  lastUpdateText: {
    fontSize: 12,
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
  footer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
    alignItems: 'center',
  },
  darkFooter: {
    backgroundColor: '#1e1e1e',
    borderTopColor: '#333',
  },
  footerText: {
    fontSize: 12,
    color: '#bdc3c7',
    fontWeight: '300',
  },
  darkFooterText: {
    color: '#888',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: "80%",
    height: 60,
    top: 1
  },
});

export default DashboardScreen;