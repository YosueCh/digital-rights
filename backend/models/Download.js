import database from '../config/database.js';

class Download {
    // Registrar descarga con cifrado híbrido
    static async create({ transferencia_id, comprador_id, aes_key_encrypted, archivo_cifrado_path, iv_cifrado }) {
        const sql = `
            INSERT INTO descargas 
            (transferencia_id, comprador_id, aes_key_encrypted, archivo_cifrado_path, iv_cifrado)
            VALUES (?, ?, ?, ?, ?)
        `;
        const result = await database.run(sql, [
            transferencia_id,
            comprador_id,
            aes_key_encrypted,
            archivo_cifrado_path,
            iv_cifrado
        ]);
        return result.id;
    }

    // Marcar descarga como completada
    static async markAsCompleted(id) {
        const sql = 'UPDATE descargas SET completado = 1 WHERE id = ?';
        return await database.run(sql, [id]);
    }

    // Buscar por transferencia
    static async findByTransfer(transferenciaId) {
        const sql = 'SELECT * FROM descargas WHERE transferencia_id = ? ORDER BY download_timestamp DESC';
        return await database.all(sql, [transferenciaId]);
    }

    // Buscar por comprador
    static async findByComprador(compradorId) {
        const sql = `
            SELECT d.*, t.obra_id, o.titulo as obra_titulo
            FROM descargas d
            JOIN transferencias_derechos t ON d.transferencia_id = t.id
            JOIN obras_digitales o ON t.obra_id = o.id
            WHERE d.comprador_id = ?
            ORDER BY d.download_timestamp DESC
        `;
        return await database.all(sql, [compradorId]);
    }

    // Obtener todas las descargas
    static async findAll() {
        const sql = `
            SELECT d.*, 
                   u.nombre as comprador_nombre,
                   o.titulo as obra_titulo
            FROM descargas d
            JOIN usuarios u ON d.comprador_id = u.id
            JOIN transferencias_derechos t ON d.transferencia_id = t.id
            JOIN obras_digitales o ON t.obra_id = o.id
            ORDER BY d.download_timestamp DESC
        `;
        return await database.all(sql);
    }
}

export default Download;