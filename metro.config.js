// metro.config.js
const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

// 🔥 Resolver para problemas de módulos
config.resolver.extraNodeModules = {
  'react-native-maps': require.resolve('react-native-maps'),
};

config.transformer.minifierPath = 'metro-minify-terser';
config.transformer.minifierConfig = {
  compress: {
    drop_console: true,
    drop_debugger: true,
    pure_funcs: ['console.log', 'console.info', 'console.warn']
  }
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // 🔥 Para web: reemplazar módulos incompatibles
  if (platform === 'web') {
    if (moduleName === 'react-native-maps') {
      return {
        type: 'empty',
      };
    }
    if (moduleName === 'react-native-vector-icons') {
      return context.resolveRequest(context, '@expo/vector-icons', platform);
    }
  }
  
  // 🔥 Para Android: optimizar módulos problemáticos
  if (platform === 'android') {
    if (moduleName === 'react-native-worklets') {
      return context.resolveRequest(context, moduleName, platform);
    }
  }
  
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;