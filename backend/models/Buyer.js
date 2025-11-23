import database from '../config/database.js';

class Buyer {
    // Crear o actualizar información de comprador (datos bancarios cifrados)
    static async createOrUpdate({ usuario_id, nombre_completo_cifrado, tarjeta_cifrada, cvv_cifrado, expiracion_cifrada, iv }) {
        // Verificar si ya existe
        const existing = await this.findByUserId(usuario_id);
        
        if (existing) {
            // Actualizar
            const sql = `
                UPDATE compradores 
                SET nombre_completo_cifrado = ?, 
                    tarjeta_cifrada = ?, 
                    cvv_cifrado = ?,
                    expiracion_cifrada = ?,
                    iv = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE usuario_id = ?
            `;
            await database.run(sql, [
                nombre_completo_cifrado,
                tarjeta_cifrada,
                cvv_cifrado,
                expiracion_cifrada,
                iv,
                usuario_id
            ]);
            return existing.id;
        } else {
            // Crear nuevo
            const sql = `
                INSERT INTO compradores 
                (usuario_id, nombre_completo_cifrado, tarjeta_cifrada, cvv_cifrado, expiracion_cifrada, iv)
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            const result = await database.run(sql, [
                usuario_id,
                nombre_completo_cifrado,
                tarjeta_cifrada,
                cvv_cifrado,
                expiracion_cifrada,
                iv
            ]);
            return result.id;
        }
    }

    // Buscar por usuario_id
    static async findByUserId(usuarioId) {
        const sql = 'SELECT * FROM compradores WHERE usuario_id = ?';
        return await database.get(sql, [usuarioId]);
    }

    // Obtener todos los compradores (para admin/demo)
    static async findAll() {
        const sql = `
            SELECT c.*, u.email, u.nombre as usuario_nombre
            FROM compradores c
            JOIN usuarios u ON c.usuario_id = u.id
            ORDER BY c.created_at DESC
        `;
        return await database.all(sql);
    }
}

export default Buyer;