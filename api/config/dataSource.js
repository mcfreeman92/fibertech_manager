import { Platform } from 'react-native';
import { restAdapter } from '../adapters/restAdapter';
import { sqliteAdapter, initDatabase as initSQLiteDatabase } from '../adapters/sqliteAdapter';
import { sqliteWebAdapter, initDatabase as initWebDatabase } from '../adapters/sqliteWebAdapter';

// Detectar plataforma automáticamente
// - 'web' → IndexedDB via sqliteWebAdapter
// - 'android', 'ios' → SQLite via sqliteAdapter
const isWebPlatform = Platform.OS === 'web';
export const DATA_SOURCE = isWebPlatform ? 'web' : 'sqlite';

console.log(`🔧 Database platform detected: ${Platform.OS} → Using ${DATA_SOURCE}`);

const BuildHandler = (initFn) => {
  return {
    init: () => initFn()
  }
}

export const AdapterInitializator = () => {

  if (DATA_SOURCE === 'web') {
    return BuildHandler(initWebDatabase);
  } else if (DATA_SOURCE === 'sqlite') {
    return BuildHandler(initSQLiteDatabase);
  }

  return BuildHandler(() => Promise.resolve());
};

export const getAdapter = () => {
  if (DATA_SOURCE === 'web') {
    return sqliteWebAdapter;
  } else if (DATA_SOURCE === 'sqlite') {
    return sqliteAdapter;
  }

  return sqliteAdapter;
};

