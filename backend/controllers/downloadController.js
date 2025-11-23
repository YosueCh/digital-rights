import Download from '../models/Download.js';
import Transfer from '../models/Transfer.js';
import DigitalAsset from '../models/DigitalAsset.js';
import User from '../models/User.js';
import { prepareSecureDownload, unpackageHybrid, validateHybridPackage } from '../utils/hybridCrypto.js';
import { decryptFile } from '../utils/aesUtils.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../uploads');

/**
 * Preparar descarga segura con cifrado híbrido (CAPA 4)
 */
export async function prepareDownload(req, res) {
    try {
        const { transferId } = req.params;
        const compradorId = req.user.id;

        // Verificar que la transferencia existe y pertenece al comprador
        const transfer = await Transfer.findById(transferId);

        if (!transfer) {
            return res.status(404).json({ 
                error: 'Transferencia no encontrada' 
            });
        }

        if (transfer.comprador_id !== compradorId) {
            return res.status(403).json({ 
                error: 'No tienes permiso para descargar esta obra' 
            });
        }

        // Obtener información de la obra
        const obra = await DigitalAsset.findById(transfer.obra_id);
        if (!obra) {
            return res.status(404).json({ error: 'Obra no encontrada' });
        }

        // Obtener llave pública del comprador
        const comprador = await User.findById(compradorId);
        if (!comprador.public_key) {
            return res.status(400).json({ 
                error: 'El comprador no tiene llaves RSA configuradas' 
            });
        }

        console.log('📥 Preparando descarga segura con cifrado híbrido...');

        // Leer archivo cifrado de la obra
        const encryptedFilePath = path.join(UPLOAD_DIR, obra.archivo_cifrado);
        
        if (!fs.existsSync(encryptedFilePath)) {
            return res.status(404).json({ 
                error: 'Archivo de obra no encontrado' 
            });
        }

        const encryptedFileBuffer = fs.readFileSync(encryptedFilePath);

        console.log('🔓 Descifrando archivo con AES...');

        // Descifrar archivo con AES (usando la llave maestra y el IV almacenado)
        const decryptedFileBuffer = decryptFile(encryptedFileBuffer, obra.archivo_iv);

        console.log('🔐 Aplicando cifrado híbrido...');

        // CAPA 4: Preparar paquete con cifrado híbrido (AES temporal + RSA)
        const hybridPackage = prepareSecureDownload(
            decryptedFileBuffer, 
            comprador.public_key
        );

        console.log('✅ Paquete híbrido preparado');

        // Registrar descarga
        const downloadId = await Download.create({
            transferencia_id: transferId,
            comprador_id: compradorId,
            aes_key_encrypted: hybridPackage.encryptedKey,
            archivo_cifrado_path: obra.archivo_cifrado,
            iv_cifrado: hybridPackage.iv
        });

        res.json({
            message: 'Descarga preparada con cifrado híbrido',
            downloadId,
            package: {
                encryptedData: hybridPackage.encryptedData,
                encryptedKey: hybridPackage.encryptedKey,
                iv: hybridPackage.iv
            },
            fileInfo: {
                originalName: obra.archivo_original_name,
                titulo: obra.titulo,
                size: Buffer.from(hybridPackage.encryptedData, 'base64').length
            },
            security: {
                dataEncryption: 'AES-256-CBC (temporal)',
                keyEncryption: 'RSA-2048-OAEP',
                hashAlgorithm: 'SHA-256',
                steps: [
                    '1. Archivo descifrado con AES-256 (llave maestra)',
                    '2. Llave AES temporal generada',
                    '3. Archivo cifrado con llave temporal',
                    '4. Llave temporal cifrada con RSA público del comprador'
                ]
            }
        });

    } catch (error) {
        console.error('❌ Error al preparar descarga:', error);
        res.status(500).json({ 
            error: 'Error al preparar descarga',
            details: error.message 
        });
    }
}

/**
 * Simular recepción y descifrado de paquete híbrido (para demostración)
 */
export async function simulateHybridDecryption(req, res) {
    try {
        const { encryptedData, encryptedKey, iv } = req.body;
        const usuarioId = req.user.id;

        // Validar paquete
        if (!validateHybridPackage({ encryptedData, encryptedKey, iv })) {
            return res.status(400).json({ 
                error: 'Paquete híbrido inválido' 
            });
        }

        // Obtener llave privada del usuario
        const usuario = await User.findById(usuarioId);
        if (!usuario.private_key_encrypted) {
            return res.status(400).json({ 
                error: 'Usuario no tiene llaves RSA configuradas' 
            });
        }

        console.log('📦 Desempaquetando paquete híbrido...');

        // CAPA 4: Desempaquetar con cifrado híbrido
        const decryptedBuffer = unpackageHybrid(
            { encryptedData, encryptedKey, iv },
            usuario.private_key_encrypted
        );

        console.log('✅ Paquete descifrado exitosamente');

        // En una aplicación real, aquí se enviaría el archivo
        // Por ahora, solo confirmamos que se descifró correctamente

        res.json({
            message: 'Paquete descifrado exitosamente',
            fileSize: decryptedBuffer.length,
            preview: decryptedBuffer.toString('utf8', 0, Math.min(100, decryptedBuffer.length)),
            security: {
                steps: [
                    '1. Llave AES descifrada con RSA privado',
                    '2. Datos descifrados con llave AES',
                    '3. Archivo original recuperado'
                ],
                verified: true
            }
        });

    } catch (error) {
        console.error('❌ Error al descifrar paquete:', error);
        res.status(500).json({ 
            error: 'Error al descifrar paquete híbrido',
            details: error.message 
        });
    }
}

/**
 * Obtener historial de descargas del usuario
 */
export async function getMyDownloads(req, res) {
    try {
        const compradorId = req.user.id;
        const downloads = await Download.findByComprador(compradorId);

        res.json({
            count: downloads.length,
            downloads
        });

    } catch (error) {
        console.error('❌ Error al obtener descargas:', error);
        res.status(500).json({ 
            error: 'Error al obtener descargas',
            details: error.message 
        });
    }
}

export default {
    prepareDownload,
    simulateHybridDecryption,
    getMyDownloads
};