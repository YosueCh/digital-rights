import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración RSA
const KEY_SIZE = 2048; // bits
const KEYS_DIR = process.env.KEYS_DIR || path.join(__dirname, '../keys');

// Asegurar que el directorio de llaves existe
if (!fs.existsSync(KEYS_DIR)) {
    fs.mkdirSync(KEYS_DIR, { recursive: true });
}

/**
 * CAPA 3: RSA - Firma Digital Asimétrica
 * 
 * Genera un par de llaves RSA (pública y privada)
 * @param {number} userId - ID del usuario (opcional, para nombrar archivos)
 * @returns {object} {publicKey: string, privateKey: string}
 */
export function generateKeyPair(userId = null) {
    try {
        const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: KEY_SIZE,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem'
            }
        });
        
        console.log('🔑 [RSA] Par de llaves generado correctamente');
        console.log(`   Tamaño: ${KEY_SIZE} bits`);
        
        // Opcionalmente guardar en archivos (para respaldo)
        if (userId) {
            const publicKeyPath = path.join(KEYS_DIR, `user_${userId}_public.pem`);
            const privateKeyPath = path.join(KEYS_DIR, `user_${userId}_private.pem`);
            
            fs.writeFileSync(publicKeyPath, publicKey);
            fs.writeFileSync(privateKeyPath, privateKey);
            
            console.log(`   ✅ Llaves guardadas en: ${KEYS_DIR}`);
        }
        
        return { publicKey, privateKey };
    } catch (error) {
        console.error('❌ [RSA] Error al generar par de llaves:', error);
        throw new Error('Error al generar llaves RSA');
    }
}

/**
 * Genera hash SHA-256 de un documento
 * @param {string} text - Texto del documento
 * @returns {string} Hash en hexadecimal
 */
export function hashDocument(text) {
    try {
        const hash = crypto.createHash('sha256').update(text).digest('hex');
        console.log('🔐 [SHA-256] Documento hasheado');
        console.log(`   Hash: ${hash.substring(0, 32)}...`);
        return hash;
    } catch (error) {
        console.error('❌ [SHA-256] Error al hashear documento:', error);
        throw new Error('Error al generar hash del documento');
    }
}

/**
 * Firma un documento usando la llave privada RSA
 * @param {string} documentHash - Hash SHA-256 del documento
 * @param {string} privateKeyPem - Llave privada en formato PEM
 * @returns {string} Firma digital en hexadecimal
 */
export function signDocument(documentHash, privateKeyPem) {
    try {
        const sign = crypto.createSign('SHA256');
        sign.update(documentHash);
        sign.end();
        
        const signature = sign.sign(privateKeyPem, 'hex');
        
        console.log('✍️  [RSA-SIGN] Documento firmado correctamente');
        console.log(`   Firma (primeros 32 chars): ${signature.substring(0, 32)}...`);
        console.log(`   Longitud de firma: ${signature.length} caracteres`);
        
        return signature;
    } catch (error) {
        console.error('❌ [RSA-SIGN] Error al firmar documento:', error);
        throw new Error('Error al firmar el documento');
    }
}

/**
 * Verifica la firma de un documento
 * @param {string} documentHash - Hash SHA-256 del documento original
 * @param {string} signature - Firma digital (hex)
 * @param {string} publicKeyPem - Llave pública en formato PEM
 * @returns {boolean} true si la firma es válida
 */
export function verifySignature(documentHash, signature, publicKeyPem) {
    try {
        const verify = crypto.createVerify('SHA256');
        verify.update(documentHash);
        verify.end();
        
        const isValid = verify.verify(publicKeyPem, signature, 'hex');
        
        if (isValid) {
            console.log('✅ [RSA-VERIFY] Firma VÁLIDA');
        } else {
            console.log('❌ [RSA-VERIFY] Firma INVÁLIDA');
        }
        
        return isValid;
    } catch (error) {
        console.error('❌ [RSA-VERIFY] Error al verificar firma:', error);
        return false;
    }
}

/**
 * Cifra datos con llave pública RSA (para cifrado híbrido)
 * @param {Buffer} data - Datos a cifrar (típicamente una llave AES)
 * @param {string} publicKeyPem - Llave pública en formato PEM
 * @returns {string} Datos cifrados en base64
 */
export function encryptWithPublicKey(data, publicKeyPem) {
    try {
        const encrypted = crypto.publicEncrypt(
            {
                key: publicKeyPem,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: 'sha256'
            },
            data
        );
        
        console.log('🔐 [RSA-ENCRYPT] Datos cifrados con llave pública');
        
        return encrypted.toString('base64');
    } catch (error) {
        console.error('❌ [RSA-ENCRYPT] Error al cifrar:', error);
        throw new Error('Error al cifrar con llave pública');
    }
}

/**
 * Descifra datos con llave privada RSA (para cifrado híbrido)
 * @param {string} encryptedData - Datos cifrados en base64
 * @param {string} privateKeyPem - Llave privada en formato PEM
 * @returns {Buffer} Datos descifrados
 */
export function decryptWithPrivateKey(encryptedData, privateKeyPem) {
    try {
        const buffer = Buffer.from(encryptedData, 'base64');
        
        const decrypted = crypto.privateDecrypt(
            {
                key: privateKeyPem,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: 'sha256'
            },
            buffer
        );
        
        console.log('🔓 [RSA-DECRYPT] Datos descifrados con llave privada');
        
        return decrypted;
    } catch (error) {
        console.error('❌ [RSA-DECRYPT] Error al descifrar:', error);
        throw new Error('Error al descifrar con llave privada');
    }
}

/**
 * Carga llaves desde archivos (utilidad)
 * @param {number} userId - ID del usuario
 * @returns {object} {publicKey: string, privateKey: string}
 */
export function loadKeysFromFile(userId) {
    try {
        const publicKeyPath = path.join(KEYS_DIR, `user_${userId}_public.pem`);
        const privateKeyPath = path.join(KEYS_DIR, `user_${userId}_private.pem`);
        
        if (!fs.existsSync(publicKeyPath) || !fs.existsSync(privateKeyPath)) {
            throw new Error('Archivos de llaves no encontrados');
        }
        
        const publicKey = fs.readFileSync(publicKeyPath, 'utf8');
        const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
        
        console.log(`🔑 [RSA] Llaves cargadas desde archivos para usuario ${userId}`);
        
        return { publicKey, privateKey };
    } catch (error) {
        console.error('❌ [RSA] Error al cargar llaves desde archivo:', error);
        throw error;
    }
}

export default {
    generateKeyPair,
    hashDocument,
    signDocument,
    verifySignature,
    encryptWithPublicKey,
    decryptWithPrivateKey,
    loadKeysFromFile
};