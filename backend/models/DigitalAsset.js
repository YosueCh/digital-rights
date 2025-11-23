import database from '../config/database.js';

class DigitalAsset {
    // Crear nueva obra digital
    static async create({ titulo, descripcion, preview_path, archivo_cifrado, archivo_iv, archivo_original_name, precio, vendedor_id }) {
        const sql = `
            INSERT INTO obras_digitales 
            (titulo, descripcion, preview_path, archivo_cifrado, archivo_iv, archivo_original_name, precio, vendedor_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const result = await database.run(sql, [
            titulo, 
            descripcion, 
            preview_path, 
            archivo_cifrado, 
            archivo_iv, 
            archivo_original_name, 
            precio, 
            vendedor_id
        ]);
        return result.id;
    }

    // Obtener todas las obras disponibles
    static async findAvailable() {
        const sql = `
            SELECT o.*, u.nombre as vendedor_nombre, u.email as vendedor_email
            FROM obras_digitales o
            JOIN usuarios u ON o.vendedor_id = u.id
            WHERE o.disponible = 1
            ORDER BY o.created_at DESC
        `;
        return await database.all(sql);
    }

    // Obtener obra por ID
    static async findById(id) {
        const sql = `
            SELECT o.*, u.nombre as vendedor_nombre, u.email as vendedor_email, u.public_key
            FROM obras_digitales o
            JOIN usuarios u ON o.vendedor_id = u.id
            WHERE o.id = ?
        `;
        return await database.get(sql, [id]);
    }

    // Obtener obras de un vendedor
    static async findByVendedor(vendedorId) {
        const sql = `
            SELECT * FROM obras_digitales
            WHERE vendedor_id = ?
            ORDER BY created_at DESC
        `;
        return await database.all(sql, [vendedorId]);
    }

    // Marcar obra como no disponible
    static async markAsUnavailable(id) {
        const sql = 'UPDATE obras_digitales SET disponible = 0 WHERE id = ?';
        return await database.run(sql, [id]);
    }

    // Actualizar obra
    static async update(id, { titulo, descripcion, precio }) {
        const sql = `
            UPDATE obras_digitales 
            SET titulo = ?, descripcion = ?, precio = ?
            WHERE id = ?
        `;
        return await database.run(sql, [titulo, descripcion, precio, id]);
    }

    // Eliminar obra
    static async delete(id) {
        const sql = 'DELETE FROM obras_digitales WHERE id = ?';
        return await database.run(sql, [id]);
    }
}

export default DigitalAsset;