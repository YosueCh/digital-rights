import DigitalAsset from '../models/DigitalAsset.js';
import { encryptFile } from '../utils/aesUtils.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../uploads');

// Asegurar que el directorio existe
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Crear nueva obra digital (vendedor)
 */
export async function createAsset(req, res) {
    try {
        const { titulo, descripcion, precio } = req.body;
        const vendedorId = req.user.id;

        // Validar datos
        if (!titulo || !precio) {
            return res.status(400).json({ 
                error: 'Título y precio son requeridos' 
            });
        }

        // Validar que el usuario es vendedor
        if (req.user.rol !== 'vendedor') {
            return res.status(403).json({ 
                error: 'Solo vendedores pueden crear obras' 
            });
        }

        // Verificar que se subió un archivo
        if (!req.file) {
            return res.status(400).json({ 
                error: 'Archivo de obra no proporcionado' 
            });
        }

        console.log('🔐 Cifrando archivo de obra con AES-256...');

        // Leer archivo
        const fileBuffer = fs.readFileSync(req.file.path);

        // Cifrar archivo (CAPA 2: AES-256)
        const { encrypted, iv } = encryptFile(fileBuffer);

        // Guardar archivo cifrado
        const encryptedFileName = `encrypted_${Date.now()}_${req.file.originalname}.enc`;
        const encryptedFilePath = path.join(UPLOAD_DIR, encryptedFileName);
        fs.writeFileSync(encryptedFilePath, encrypted);

        // Eliminar archivo temporal original
        fs.unlinkSync(req.file.path);

        console.log('✅ Archivo cifrado y guardado');

        // Crear registro en base de datos
        const assetId = await DigitalAsset.create({
            titulo,
            descripcion,
            preview_path: `/previews/${titulo.toLowerCase().replace(/ /g, '_')}.jpg`,
            archivo_cifrado: encryptedFileName,
            archivo_iv: iv,
            archivo_original_name: req.file.originalname,
            precio,
            vendedor_id: vendedorId
        });

        res.status(201).json({
            message: 'Obra digital creada exitosamente',
            asset: {
                id: assetId,
                titulo,
                descripcion,
                precio,
                encrypted: true,
                algorithm: 'AES-256-CBC'
            }
        });

    } catch (error) {
        console.error('❌ Error al crear obra:', error);
        res.status(500).json({ 
            error: 'Error al crear obra digital',
            details: error.message 
        });
    }
}

/**
 * Obtener todas las obras disponibles
 */
export async function getAvailableAssets(req, res) {
    try {
        const assets = await DigitalAsset.findAvailable();

        res.json({
            count: assets.length,
            assets: assets.map(asset => ({
                id: asset.id,
                titulo: asset.titulo,
                descripcion: asset.descripcion,
                preview_path: asset.preview_path,
                precio: asset.precio,
                vendedor: {
                    nombre: asset.vendedor_nombre,
                    email: asset.vendedor_email
                },
                created_at: asset.created_at
            }))
        });

    } catch (error) {
        console.error('❌ Error al obtener obras:', error);
        res.status(500).json({ 
            error: 'Error al obtener obras',
            details: error.message 
        });
    }
}

/**
 * Obtener detalles de una obra específica
 */
export async function getAssetById(req, res) {
    try {
        const { id } = req.params;
        const asset = await DigitalAsset.findById(id);

        if (!asset) {
            return res.status(404).json({ 
                error: 'Obra no encontrada' 
            });
        }

        res.json({
            id: asset.id,
            titulo: asset.titulo,
            descripcion: asset.descripcion,
            preview_path: asset.preview_path,
            precio: asset.precio,
            disponible: asset.disponible,
            vendedor: {
                id: asset.vendedor_id,
                nombre: asset.vendedor_nombre,
                email: asset.vendedor_email,
                publicKey: asset.public_key
            },
            created_at: asset.created_at,
            info: {
                encrypted: true,
                algorithm: 'AES-256-CBC',
                originalName: asset.archivo_original_name
            }
        });

    } catch (error) {
        console.error('❌ Error al obtener obra:', error);
        res.status(500).json({ 
            error: 'Error al obtener obra',
            details: error.message 
        });
    }
}

/**
 * Obtener obras del vendedor actual
 */
export async function getMyAssets(req, res) {
    try {
        const vendedorId = req.user.id;
        const assets = await DigitalAsset.findByVendedor(vendedorId);

        res.json({
            count: assets.length,
            assets
        });

    } catch (error) {
        console.error('❌ Error al obtener mis obras:', error);
        res.status(500).json({ 
            error: 'Error al obtener obras',
            details: error.message 
        });
    }
}

export default {
    createAsset,
    getAvailableAssets,
    getAssetById,
    getMyAssets
};