import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform, ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import { AdapterInitializator, getAdapter } from '../config/dataSource';

const DatabaseContext = createContext();

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#d32f2f',
  },
  errorText: {
    fontSize: 14,
    marginBottom: 10,
    color: '#666',
    textAlign: 'center',
  },
  errorHelp: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  platformText: {
    marginTop: 5,
    fontSize: 12,
    color: '#666',
  },
});

export const DatabaseProvider = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const setupDatabase = async () => {
      try {
        console.log(`🔧 Initializing database for platform: ${Platform.OS}`);
        const Initializator = AdapterInitializator();
        await Initializator.init();
        console.log('✅ Database initialized successfully');
        setIsReady(true);
      } catch (err) {
        console.error('❌ Database initialization error:', err);
        setError(err.message);
      }
    };

    setupDatabase();
  }, []);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorTitle}>Error de Base de Datos</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.errorHelp}>
          Por favor, recarga la aplicación
        </Text>
      </View>
    );
  }

//   if (!isReady) {
//     return (
//       <View style={styles.container}>
//         <ActivityIndicator size="large" color="#007AFF" />
//         <Text style={styles.loadingText}>
//           Inicializando base de datos...
//         </Text>
//         <Text style={styles.platformText}>
//           Plataforma: {Platform.OS}
//         </Text>
//       </View>
//     );
//   }

  return (
    <DatabaseContext.Provider value={{ isReady, platform: Platform.OS }}>
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase debe usarse dentro de DatabaseProvider');
  }
  return context;
};

export const useAdapter = () =>{
  return getAdapter;
}