import bcrypt from 'bcryptjs';

// Número de rondas de salt (mayor = más seguro pero más lento)
// 12 es el estándar recomendado
const SALT_ROUNDS = 12;

/**
 * CAPA 1: BCRYPT - Hash de Contraseñas
 * 
 * Hashea una contraseña usando bcrypt
 * @param {string} password - Contraseña en texto plano
 * @returns {Promise<string>} Hash de la contraseña
 */
export async function hashPassword(password) {
    try {
        const hash = await bcrypt.hash(password, SALT_ROUNDS);
        console.log('🔐 [BCRYPT] Password hasheado correctamente');
        return hash;
    } catch (error) {
        console.error('❌ [BCRYPT] Error al hashear password:', error);
        throw new Error('Error al procesar la contraseña');
    }
}

/**
 * Verifica una contraseña contra su hash
 * @param {string} password - Contraseña en texto plano
 * @param {string} hash - Hash almacenado en la base de datos
 * @returns {Promise<boolean>} true si coincide, false si no
 */
export async function verifyPassword(password, hash) {
    try {
        const isMatch = await bcrypt.compare(password, hash);
        if (isMatch) {
            console.log('✅ [BCRYPT] Password verificado correctamente');
        } else {
            console.log('❌ [BCRYPT] Password incorrecto');
        }
        return isMatch;
    } catch (error) {
        console.error('❌ [BCRYPT] Error al verificar password:', error);
        throw new Error('Error al verificar la contraseña');
    }
}

/**
 * Obtiene información sobre un hash de bcrypt (para demostración)
 * @param {string} hash - Hash de bcrypt
 * @returns {object} Información del hash
 */
export function getHashInfo(hash) {
    try {
        // Formato de hash bcrypt: $2b$rounds$salt+hash
        const parts = hash.split('$');
        return {
            algorithm: parts[1], // '2b' = bcrypt
            rounds: parseInt(parts[2]), // Número de rondas
            salt: parts[3].substring(0, 22), // Salt (primeros 22 caracteres)
            hashLength: hash.length,
            fullHash: hash
        };
    } catch (error) {
        return { error: 'Hash inválido' };
    }
}

export default {
    hashPassword,
    verifyPassword,
    getHashInfo
};