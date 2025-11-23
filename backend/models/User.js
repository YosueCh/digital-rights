import database from '../config/database.js';

class User {
    // Crear nuevo usuario
    static async create({ email, password_hash, nombre, rol = 'comprador', public_key = null, private_key_encrypted = null }) {
        const sql = `
            INSERT INTO usuarios (email, password_hash, nombre, rol, public_key, private_key_encrypted)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const result = await database.run(sql, [email, password_hash, nombre, rol, public_key, private_key_encrypted]);
        return result.id;
    }

    // Buscar por email
    static async findByEmail(email) {
        const sql = 'SELECT * FROM usuarios WHERE email = ?';
        return await database.get(sql, [email]);
    }

    // Buscar por ID
    static async findById(id) {
        const sql = 'SELECT * FROM usuarios WHERE id = ?';
        return await database.get(sql, [id]);
    }

    // Obtener todos los usuarios
    static async findAll() {
        const sql = 'SELECT id, email, nombre, rol, created_at FROM usuarios';
        return await database.all(sql);
    }

    // Actualizar llaves RSA
    static async updateKeys(userId, publicKey, privateKeyEncrypted) {
        const sql = `
            UPDATE usuarios 
            SET public_key = ?, private_key_encrypted = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        return await database.run(sql, [publicKey, privateKeyEncrypted, userId]);
    }

    // Verificar si el email ya existe
    static async emailExists(email) {
        const user = await this.findByEmail(email);
        return !!user;
    }

    // Obtener vendedores
    static async findVendedores() {
        const sql = 'SELECT id, email, nombre, created_at FROM usuarios WHERE rol = ?';
        return await database.all(sql, ['vendedor']);
    }
}

export default User;