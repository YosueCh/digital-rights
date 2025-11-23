import database from '../config/database.js';

class Transfer {
    // Crear nueva transferencia de derechos
    static async create({ obra_id, vendedor_id, comprador_id, documento_texto, hash_documento, firma_digital }) {
        const sql = `
            INSERT INTO transferencias_derechos 
            (obra_id, vendedor_id, comprador_id, documento_texto, hash_documento, firma_digital)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const result = await database.run(sql, [
            obra_id,
            vendedor_id,
            comprador_id,
            documento_texto,
            hash_documento,
            firma_digital
        ]);
        return result.id;
    }

    // Buscar por ID
    static async findById(id) {
        const sql = `
            SELECT t.*,
                   o.titulo as obra_titulo,
                   v.nombre as vendedor_nombre, v.email as vendedor_email, v.public_key as vendedor_public_key,
                   c.nombre as comprador_nombre, c.email as comprador_email
            FROM transferencias_derechos t
            JOIN obras_digitales o ON t.obra_id = o.id
            JOIN usuarios v ON t.vendedor_id = v.id
            JOIN usuarios c ON t.comprador_id = c.id
            WHERE t.id = ?
        `;
        return await database.get(sql, [id]);
    }

    // Obtener transferencias de un comprador
    static async findByComprador(compradorId) {
        const sql = `
            SELECT t.*,
                   o.titulo as obra_titulo, o.preview_path,
                   v.nombre as vendedor_nombre
            FROM transferencias_derechos t
            JOIN obras_digitales o ON t.obra_id = o.id
            JOIN usuarios v ON t.vendedor_id = v.id
            WHERE t.comprador_id = ?
            ORDER BY t.timestamp DESC
        `;
        return await database.all(sql, [compradorId]);
    }

    // Obtener transferencias de un vendedor
    static async findByVendedor(vendedorId) {
        const sql = `
            SELECT t.*,
                   o.titulo as obra_titulo, o.preview_path,
                   c.nombre as comprador_nombre
            FROM transferencias_derechos t
            JOIN obras_digitales o ON t.obra_id = o.id
            JOIN usuarios c ON t.comprador_id = c.id
            WHERE t.vendedor_id = ?
            ORDER BY t.timestamp DESC
        `;
        return await database.all(sql, [vendedorId]);
    }

    // Marcar como verificada
    static async markAsVerified(id) {
        const sql = 'UPDATE transferencias_derechos SET verificado = 1 WHERE id = ?';
        return await database.run(sql, [id]);
    }

    // Obtener todas las transferencias
    static async findAll() {
        const sql = `
            SELECT t.*,
                   o.titulo as obra_titulo,
                   v.nombre as vendedor_nombre,
                   c.nombre as comprador_nombre
            FROM transferencias_derechos t
            JOIN obras_digitales o ON t.obra_id = o.id
            JOIN usuarios v ON t.vendedor_id = v.id
            JOIN usuarios c ON t.comprador_id = c.id
            ORDER BY t.timestamp DESC
        `;
        return await database.all(sql);
    }
}

export default Transfer;