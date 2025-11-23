import crypto from 'crypto';

// Configuración de AES-256-CBC
const ALGORITHM = 'aes-256-cbc';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16;  // 128 bits

// Llave maestra desde variables de entorno
const MASTER_KEY = Buffer.from(process.env.AES_MASTER_KEY || '', 'hex');

if (MASTER_KEY.length !== KEY_LENGTH) {
    console.warn('⚠️  [AES] MASTER_KEY no tiene 32 bytes. Generando llave temporal...');
    // En producción, esto debería fallar
}

/**
 * CAPA 2: AES-256-CBC - Cifrado Simétrico
 * 
 * Cifra texto usando AES-256-CBC
 * @param {string} text - Texto a cifrar
 * @returns {object} {encrypted: string, iv: string}
 */
export function encrypt(text) {
    try {
        // Generar IV único para esta operación
        const iv = crypto.randomBytes(IV_LENGTH);
        
        // Crear cipher
        const cipher = crypto.createCipheriv(ALGORITHM, MASTER_KEY, iv);
        
        // Cifrar
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        console.log('🔐 [AES-256] Datos cifrados correctamente');
        console.log(`   IV: ${iv.toString('hex').substring(0, 16)}...`);
        console.log(`   Encrypted length: ${encrypted.length} caracteres`);
        
        return {
            encrypted: encrypted,
            iv: iv.toString('hex')
        };
    } catch (error) {
        console.error('❌ [AES-256] Error al cifrar:', error);
        throw new Error('Error al cifrar los datos');
    }
}

/**
 * Descifra texto usando AES-256-CBC
 * @param {string} encryptedText - Texto cifrado (hex)
 * @param {string} ivHex - Vector de inicialización (hex)
 * @returns {string} Texto descifrado
 */
export function decrypt(encryptedText, ivHex) {
    try {
        // Convertir IV de hex a Buffer
        const iv = Buffer.from(ivHex, 'hex');
        
        // Crear decipher
        const decipher = crypto.createDecipheriv(ALGORITHM, MASTER_KEY, iv);
        
        // Descifrar
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        console.log('🔓 [AES-256] Datos descifrados correctamente');
        
        return decrypted;
    } catch (error) {
        console.error('❌ [AES-256] Error al descifrar:', error);
        throw new Error('Error al descifrar los datos');
    }
}

/**
 * Cifra un archivo (buffer)
 * @param {Buffer} fileBuffer - Buffer del archivo
 * @returns {object} {encrypted: Buffer, iv: string}
 */
export function encryptFile(fileBuffer) {
    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, MASTER_KEY, iv);
        
        const encrypted = Buffer.concat([
            cipher.update(fileBuffer),
            cipher.final()
        ]);
        
        console.log('🔐 [AES-256] Archivo cifrado correctamente');
        console.log(`   Tamaño original: ${fileBuffer.length} bytes`);
        console.log(`   Tamaño cifrado: ${encrypted.length} bytes`);
        
        return {
            encrypted: encrypted,
            iv: iv.toString('hex')
        };
    } catch (error) {
        console.error('❌ [AES-256] Error al cifrar archivo:', error);
        throw new Error('Error al cifrar el archivo');
    }
}

/**
 * Descifra un archivo (buffer)
 * @param {Buffer} encryptedBuffer - Buffer cifrado
 * @param {string} ivHex - Vector de inicialización (hex)
 * @returns {Buffer} Buffer descifrado
 */
export function decryptFile(encryptedBuffer, ivHex) {
    try {
        const iv = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, MASTER_KEY, iv);
        
        const decrypted = Buffer.concat([
            decipher.update(encryptedBuffer),
            decipher.final()
        ]);
        
        console.log('🔓 [AES-256] Archivo descifrado correctamente');
        console.log(`   Tamaño descifrado: ${decrypted.length} bytes`);
        
        return decrypted;
    } catch (error) {
        console.error('❌ [AES-256] Error al descifrar archivo:', error);
        throw new Error('Error al descifrar el archivo');
    }
}

/**
 * Genera una llave AES temporal (para cifrado híbrido)
 * @returns {Buffer} Llave AES de 32 bytes
 */
export function generateTemporaryKey() {
    return crypto.randomBytes(KEY_LENGTH);
}

/**
 * Cifra con llave temporal (para cifrado híbrido)
 * @param {string|Buffer} data - Datos a cifrar
 * @param {Buffer} temporaryKey - Llave AES temporal
 * @returns {object} {encrypted, iv}
 */
export function encryptWithTemporaryKey(data, temporaryKey) {
    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, temporaryKey, iv);
        
        const inputBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
        
        const encrypted = Buffer.concat([
            cipher.update(inputBuffer),
            cipher.final()
        ]);
        
        console.log('🔐 [AES-256-TEMP] Cifrado con llave temporal');
        
        return {
            encrypted: encrypted,
            iv: iv.toString('hex')
        };
    } catch (error) {
        console.error('❌ [AES-256-TEMP] Error al cifrar:', error);
        throw new Error('Error al cifrar con llave temporal');
    }
}

/**
 * Descifra con llave temporal (para cifrado híbrido)
 * @param {Buffer} encryptedBuffer - Datos cifrados
 * @param {string} ivHex - IV en hexadecimal
 * @param {Buffer} temporaryKey - Llave AES temporal
 * @returns {Buffer} Datos descifrados
 */
export function decryptWithTemporaryKey(encryptedBuffer, ivHex, temporaryKey) {
    try {
        const iv = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, temporaryKey, iv);
        
        const decrypted = Buffer.concat([
            decipher.update(encryptedBuffer),
            decipher.final()
        ]);
        
        console.log('🔓 [AES-256-TEMP] Descifrado con llave temporal');
        
        return decrypted;
    } catch (error) {
        console.error('❌ [AES-256-TEMP] Error al descifrar:', error);
        throw new Error('Error al descifrar con llave temporal');
    }
}

export default {
    encrypt,
    decrypt,
    encryptFile,
    decryptFile,
    generateTemporaryKey,
    encryptWithTemporaryKey,
    decryptWithTemporaryKey
};