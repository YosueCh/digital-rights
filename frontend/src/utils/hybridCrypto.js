/**
 * CAPA 4: CIFRADO HÍBRIDO (Cliente)
 * 
 * Implementación del lado del cliente para cifrado híbrido
 * Combina AES (rápido) con RSA (seguro)
 */

/**
 * Convierte ArrayBuffer a string Base64
 */
function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Convierte string Base64 a ArrayBuffer
 */
function base64ToArrayBuffer(base64) {
  const binary = window.atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Convierte ArrayBuffer a string hexadecimal
 */
function arrayBufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Importa llave pública RSA desde PEM
 */
async function importPublicKey(pemKey) {
  // Remover headers y espacios
  const pemContents = pemKey
    .replace('-----BEGIN PUBLIC KEY-----', '')
    .replace('-----END PUBLIC KEY-----', '')
    .replace(/\s/g, '');
  
  // Convertir a ArrayBuffer
  const binaryDer = base64ToArrayBuffer(pemContents);
  
  // Importar llave
  return await window.crypto.subtle.importKey(
    'spki',
    binaryDer,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256'
    },
    true,
    ['encrypt']
  );
}

/**
 * Importa llave privada RSA desde PEM
 */
async function importPrivateKey(pemKey) {
  // Remover headers y espacios
  const pemContents = pemKey
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');
  
  // Convertir a ArrayBuffer
  const binaryDer = base64ToArrayBuffer(pemContents);
  
  // Importar llave
  return await window.crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256'
    },
    true,
    ['decrypt']
  );
}

/**
 * Genera una llave AES temporal
 */
async function generateTemporaryAESKey() {
  return await window.crypto.subtle.generateKey(
    {
      name: 'AES-CBC',
      length: 256
    },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * CLIENTE: Empaqueta datos con cifrado híbrido
 * 
 * @param {string|ArrayBuffer} data - Datos a cifrar
 * @param {string} recipientPublicKeyPEM - Llave pública del destinatario (PEM)
 * @returns {Promise<object>} {encryptedData, encryptedKey, iv}
 */
export async function packageHybrid(data, recipientPublicKeyPEM) {
  try {
    console.log('📦 [CLIENTE] Empaquetando con cifrado híbrido...');

    // PASO 1: Generar llave AES temporal
    const temporaryAESKey = await generateTemporaryAESKey();
    console.log('   ✅ Llave AES temporal generada');

    // PASO 2: Cifrar datos con AES
    const iv = window.crypto.getRandomValues(new Uint8Array(16));
    
    // Convertir datos a ArrayBuffer si es string
    const dataBuffer = typeof data === 'string' 
      ? new TextEncoder().encode(data)
      : data;

    const encryptedData = await window.crypto.subtle.encrypt(
      {
        name: 'AES-CBC',
        iv: iv
      },
      temporaryAESKey,
      dataBuffer
    );
    console.log('   ✅ Datos cifrados con AES-256');

    // PASO 3: Exportar llave AES a raw
    const rawAESKey = await window.crypto.subtle.exportKey('raw', temporaryAESKey);

    // PASO 4: Importar llave pública RSA
    const publicKey = await importPublicKey(recipientPublicKeyPEM);

    // PASO 5: Cifrar llave AES con RSA
    const encryptedKey = await window.crypto.subtle.encrypt(
      {
        name: 'RSA-OAEP'
      },
      publicKey,
      rawAESKey
    );
    console.log('   ✅ Llave AES cifrada con RSA público');

    console.log('✅ [CLIENTE] Paquete híbrido creado');

    return {
      encryptedData: arrayBufferToBase64(encryptedData),
      encryptedKey: arrayBufferToBase64(encryptedKey),
      iv: arrayBufferToHex(iv)
    };

  } catch (error) {
    console.error('❌ [CLIENTE] Error al empaquetar:', error);
    throw new Error('Error en cifrado híbrido: ' + error.message);
  }
}

/**
 * CLIENTE: Desempaqueta datos con cifrado híbrido
 * 
 * @param {object} hybridPackage - {encryptedData, encryptedKey, iv}
 * @param {string} recipientPrivateKeyPEM - Llave privada del destinatario (PEM)
 * @returns {Promise<ArrayBuffer>} Datos descifrados
 */
export async function unpackageHybrid(hybridPackage, recipientPrivateKeyPEM) {
  try {
    console.log('📦 [CLIENTE] Desempaquetando cifrado híbrido...');

    const { encryptedData, encryptedKey, iv } = hybridPackage;

    // PASO 1: Importar llave privada RSA
    const privateKey = await importPrivateKey(recipientPrivateKeyPEM);

    // PASO 2: Descifrar llave AES con RSA
    const encryptedKeyBuffer = base64ToArrayBuffer(encryptedKey);
    const rawAESKey = await window.crypto.subtle.decrypt(
      {
        name: 'RSA-OAEP'
      },
      privateKey,
      encryptedKeyBuffer
    );
    console.log('   ✅ Llave AES descifrada con RSA privado');

    // PASO 3: Importar llave AES
    const aesKey = await window.crypto.subtle.importKey(
      'raw',
      rawAESKey,
      {
        name: 'AES-CBC',
        length: 256
      },
      false,
      ['decrypt']
    );

    // PASO 4: Descifrar datos con AES
    const encryptedDataBuffer = base64ToArrayBuffer(encryptedData);
    const ivBuffer = new Uint8Array(
      iv.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
    );

    const decryptedData = await window.crypto.subtle.decrypt(
      {
        name: 'AES-CBC',
        iv: ivBuffer
      },
      aesKey,
      encryptedDataBuffer
    );
    console.log('   ✅ Datos descifrados con AES-256');

    console.log('✅ [CLIENTE] Paquete desempaquetado');

    return decryptedData;

  } catch (error) {
    console.error('❌ [CLIENTE] Error al desempaquetar:', error);
    throw new Error('Error al descifrar paquete híbrido: ' + error.message);
  }
}

/**
 * Descarga archivo desde ArrayBuffer
 */
export function downloadFile(arrayBuffer, filename, mimeType = 'application/octet-stream') {
  const blob = new Blob([arrayBuffer], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export default {
  packageHybrid,
  unpackageHybrid,
  downloadFile
};