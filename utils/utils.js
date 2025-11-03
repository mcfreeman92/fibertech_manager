import React from 'react';

const generateHash = (input) => {
  // Convert input to string if it's not already
  const str = typeof input === 'string' ? input : JSON.stringify(input);
  
  // Create a hash using the Web Crypto API
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  
  return crypto.subtle.digest('SHA-256', data)
    .then(hash => {
      // Convert hash to hex string
      const hashArray = Array.from(new Uint8Array(hash));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    });
};

export default generateHash;