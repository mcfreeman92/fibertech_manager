import React from 'react';
import { Platform } from 'react-native';

// Generador de IDs único que funciona en web y React Native
let idCounter = 0;
export const generateId = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  idCounter++;
  return `id_${timestamp}_${random}_${idCounter}`;
};

// Alias para uuidv4 - usa generateId en lugar de UUID
export const uuidv4 = generateId;

const generateHash = (input) => {
  // Convert input to string if it's not already
  const str = typeof input === 'string' ? input : JSON.stringify(input);
  
  // Para web: usar Web Crypto API
  if (Platform.OS === 'web' && typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    
    return crypto.subtle.digest('SHA-256', data)
      .then(hash => {
        // Convert hash to hex string
        const hashArray = Array.from(new Uint8Array(hash));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      });
  }
  
  // Para React Native: simple hash
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Promise.resolve(Math.abs(hash).toString(16));
};

export default generateHash;