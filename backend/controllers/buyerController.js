import Buyer from '../models/Buyer.js';
import { encrypt, decrypt } from '../utils/aesUtils.js';

/**
 * Guardar o actualizar datos bancarios cifrados (CAPA 2: AES-256)
 */
export async function saveBankData(req, res) {
    try {
        const { nombreCompleto, numeroTarjeta, cvv, fechaExpiracion } = req.body;
        const usuarioId = req.user.id;

        // Validar datos
        if (!nombreCompleto || !numeroTarjeta || !cvv || !fechaExpiracion) {
            return res.status(400).json({ 
                error: 'Todos los campos son requeridos' 
            });
        }

        console.log('🔐 Cifrando datos bancarios con AES-256...');

        // Cifrar cada campo con AES-256 (CAPA 2)
        const nombreCifrado = encrypt(nombreCompleto);
        const tarjetaCifrada = encrypt(numeroTarjeta);
        const cvvCifrado = encrypt(cvv);
        const expiracionCifrada = encrypt(fechaExpiracion);

        // Guardar en base de datos (todos los campos usan el mismo IV para este registro)
        const buyerId = await Buyer.createOrUpdate({
            usuario_id: usuarioId,
            nombre_completo_cifrado: nombreCifrado.encrypted,
            tarjeta_cifrada: tarjetaCifrada.encrypted,
            cvv_cifrado: cvvCifrado.encrypted,
            expiracion_cifrada: expiracionCifrada.encrypted,
            iv: nombreCifrado.iv // Usamos el mismo IV para todos los campos del registro
        });

        console.log('✅ Datos bancarios guardados cifrados');

        res.json({
            message: 'Datos bancarios guardados de forma segura',
            buyerId,
            info: {
                algorithm: 'AES-256-CBC',
                ivLength: '16 bytes',
                encrypted: true
            }
        });

    } catch (error) {
        console.error('❌ Error al guardar datos bancarios:', error);
        res.status(500).json({ 
            error: 'Error al guardar datos bancarios',
            details: error.message 
        });
    }
}

/**
 * Obtener datos bancarios descifrados (solo para el usuario propietario)
 */
export async function getBankData(req, res) {
    try {
        const usuarioId = req.user.id;

        // Buscar datos cifrados
        const buyer = await Buyer.findByUserId(usuarioId);

        if (!buyer) {
            return res.status(404).json({ 
                error: 'No se encontraron datos bancarios' 
            });
        }

        console.log('🔓 Descifrando datos bancarios...');

        // Descifrar datos con AES-256 (CAPA 2)
        const nombreCompleto = decrypt(buyer.nombre_completo_cifrado, buyer.iv);
        const numeroTarjeta = decrypt(buyer.tarjeta_cifrada, buyer.iv);
        const cvv = decrypt(buyer.cvv_cifrado, buyer.iv);
        const fechaExpiracion = decrypt(buyer.expiracion_cifrada, buyer.iv);

        console.log('✅ Datos bancarios descifrados');

        res.json({
            nombreCompleto,
            numeroTarjeta,
            cvv,
            fechaExpiracion,
            info: {
                encrypted: false,
                decryptedWith: 'AES-256-CBC'
            }
        });

    } catch (error) {
        console.error('❌ Error al obtener datos bancarios:', error);
        res.status(500).json({ 
            error: 'Error al obtener datos bancarios',
            details: error.message 
        });
    }
}

/**
 * Ver datos cifrados (para demostración)
 */
export async function viewEncryptedData(req, res) {
    try {
        const usuarioId = req.user.id;

        const buyer = await Buyer.findByUserId(usuarioId);

        if (!buyer) {
            return res.status(404).json({ 
                error: 'No se encontraron datos bancarios' 
            });
        }

        console.log('👁️  Mostrando datos cifrados (demostración)');

        res.json({
            message: 'Datos tal como se almacenan en la base de datos',
            encrypted: {
                nombre: buyer.nombre_completo_cifrado,
                tarjeta: buyer.tarjeta_cifrada,
                cvv: buyer.cvv_cifrado,
                expiracion: buyer.expiracion_cifrada,
                iv: buyer.iv
            },
            info: {
                algorithm: 'AES-256-CBC',
                keySize: '256 bits',
                ivSize: '128 bits',
                note: 'Estos datos son completamente ilegibles sin la llave maestra'
            }
        });

    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ 
            error: 'Error al obtener datos',
            details: error.message 
        });
    }
}

export default {
    saveBankData,
    getBankData,
    viewEncryptedData
};