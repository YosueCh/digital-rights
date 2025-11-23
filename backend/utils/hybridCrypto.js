/**
 * CAPA 4: CIFRADO HÍBRIDO (Backend/Servidor)
 * 
 * Implementación del lado del servidor para cifrado híbrido
 * Combina AES (rápido) con RSA (seguro)
 */

import crypto from 'crypto';

/**
 * Genera una llave AES temporal (256 bits)
 */
function generateTemporaryAESKey() {
    return crypto.randomBytes(32); // 256 bits
}

/**
 * Genera IV aleatorio para AES
 */
function generateIV() {
    return crypto.randomBytes(16); // 128 bits
}

/**
 * Cifra datos con AES-256-CBC
 */
function encryptWithAES(data, key, iv) {
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    return Buffer.concat([cipher.update(data), cipher.final()]);
}

/**
 * Descifra datos con AES-256-CBC
 */
function decryptWithAES(encryptedData, key, iv) {
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    return Buffer.concat([decipher.update(encryptedData), decipher.final()]);
}

/**
 * Cifra llave AES con RSA público
 */
function encryptKeyWithRSA(aesKey, publicKeyPEM) {
    return crypto.publicEncrypt(
        {
            key: publicKeyPEM,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: 'sha256'
        },
        aesKey
    );
}

/**
 * Descifra llave AES con RSA privado
 */
function decryptKeyWithRSA(encryptedKey, privateKeyPEM) {
    return crypto.privateDecrypt(
        {
            key: privateKeyPEM,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: 'sha256'
        },
        encryptedKey
    );
}

/**
 * SERVIDOR: Prepara descarga segura con cifrado híbrido
 * 
 * Este es el flujo completo de cifrado híbrido:
 * 1. Genera llave AES temporal
 * 2. Cifra datos con AES (rápido)
 * 3. Cifra llave AES con RSA público del comprador (seguro)
 * 
 * @param {Buffer} fileBuffer - Archivo a cifrar
 * @param {string} recipientPublicKeyPEM - Llave pública RSA del destinatario
 * @returns {object} { encryptedData, encryptedKey, iv }
 */
export function prepareSecureDownload(fileBuffer, recipientPublicKeyPEM) {
    try {
        console.log('🔐 [SERVIDOR] Iniciando cifrado híbrido...');

        // PASO 1: Generar llave AES temporal y IV
        const temporaryAESKey = generateTemporaryAESKey();
        const iv = generateIV();
        console.log('   ✅ Llave AES temporal generada (256 bits)');

        // PASO 2: Cifrar archivo con AES-256-CBC
        const encryptedData = encryptWithAES(fileBuffer, temporaryAESKey, iv);
        console.log('   ✅ Datos cifrados con AES-256-CBC');

        // PASO 3: Cifrar llave AES con RSA público del destinatario
        const encryptedKey = encryptKeyWithRSA(temporaryAESKey, recipientPublicKeyPEM);
        console.log('   ✅ Llave AES cifrada con RSA-2048-OAEP');

        console.log('✅ [SERVIDOR] Paquete híbrido preparado');

        return {
            encryptedData: encryptedData.toString('base64'),
            encryptedKey: encryptedKey.toString('base64'),
            iv: iv.toString('hex')
        };

    } catch (error) {
        console.error('❌ [SERVIDOR] Error en prepareSecureDownload:', error);
        throw new Error('Error al preparar descarga segura: ' + error.message);
    }
}

/**
 * SERVIDOR: Desempaqueta paquete híbrido
 * 
 * Este es el flujo de descifrado:
 * 1. Descifra llave AES con RSA privado
 * 2. Descifra datos con llave AES
 * 
 * @param {object} hybridPackage - { encryptedData, encryptedKey, iv }
 * @param {string} recipientPrivateKeyPEM - Llave privada RSA del destinatario
 * @returns {Buffer} Datos descifrados
 */
export function unpackageHybrid(hybridPackage, recipientPrivateKeyPEM) {
    try {
        console.log('📦 [SERVIDOR] Desempaquetando paquete híbrido...');

        const { encryptedData, encryptedKey, iv } = hybridPackage;

        // Convertir de base64/hex a buffers
        const encryptedDataBuffer = Buffer.from(encryptedData, 'base64');
        const encryptedKeyBuffer = Buffer.from(encryptedKey, 'base64');
        const ivBuffer = Buffer.from(iv, 'hex');

        // PASO 1: Descifrar llave AES con RSA privado
        const aesKey = decryptKeyWithRSA(encryptedKeyBuffer, recipientPrivateKeyPEM);
        console.log('   ✅ Llave AES descifrada con RSA privado');

        // PASO 2: Descifrar datos con AES
        const decryptedData = decryptWithAES(encryptedDataBuffer, aesKey, ivBuffer);
        console.log('   ✅ Datos descifrados con AES-256');

        console.log('✅ [SERVIDOR] Paquete desempaquetado exitosamente');

        return decryptedData;

    } catch (error) {
        console.error('❌ [SERVIDOR] Error en unpackageHybrid:', error);
        throw new Error('Error al desempaquetar: ' + error.message);
    }
}

/**
 * Valida que un paquete híbrido tenga la estructura correcta
 * 
 * @param {object} package - Paquete a validar
 * @returns {boolean} true si es válido
 */
export function validateHybridPackage(pkg) {
    if (!pkg || typeof pkg !== 'object') {
        console.log('❌ Paquete inválido: no es un objeto');
        return false;
    }

    if (!pkg.encryptedData || typeof pkg.encryptedData !== 'string') {
        console.log('❌ Paquete inválido: encryptedData faltante o inválido');
        return false;
    }

    if (!pkg.encryptedKey || typeof pkg.encryptedKey !== 'string') {
        console.log('❌ Paquete inválido: encryptedKey faltante o inválido');
        return false;
    }

    if (!pkg.iv || typeof pkg.iv !== 'string') {
        console.log('❌ Paquete inválido: iv faltante o inválido');
        return false;
    }

    // Validar que los datos base64 sean válidos
    try {
        Buffer.from(pkg.encryptedData, 'base64');
        Buffer.from(pkg.encryptedKey, 'base64');
        Buffer.from(pkg.iv, 'hex');
    } catch (error) {
        console.log('❌ Paquete inválido: formato de codificación incorrecto');
        return false;
    }

    console.log('✅ Paquete híbrido válido');
    return true;
}

/**
 * Genera un resumen de seguridad del cifrado híbrido
 */
export function getHybridSecuritySummary() {
    return {
        algorithm: 'Hybrid Encryption',
        components: {
            symmetric: {
                algorithm: 'AES-256-CBC',
                keySize: 256,
                blockSize: 128,
                purpose: 'Cifrado rápido de datos grandes'
            },
            asymmetric: {
                algorithm: 'RSA-2048-OAEP',
                keySize: 2048,
                padding: 'OAEP',
                hash: 'SHA-256',
                purpose: 'Protección de la llave AES'
            }
        },
        flow: {
            encryption: [
                '1. Genera llave AES temporal (256 bits)',
                '2. Genera IV aleatorio (128 bits)',
                '3. Cifra datos con AES-256-CBC',
                '4. Cifra llave AES con RSA-2048-OAEP',
                '5. Envía: datos cifrados + llave cifrada + IV'
            ],
            decryption: [
                '1. Descifra llave AES con RSA privado',
                '2. Descifra datos con llave AES recuperada',
                '3. Recupera datos originales'
            ]
        },
        benefits: [
            'Velocidad de AES para datos grandes',
            'Seguridad de RSA para intercambio de llaves',
            'No requiere intercambio previo de llaves',
            'Cada descarga usa llave AES única'
        ]
    };
}

export default {
    prepareSecureDownload,
    unpackageHybrid,
    validateHybridPackage,
    getHybridSecuritySummary
};