import Transfer from '../models/Transfer.js';
import DigitalAsset from '../models/DigitalAsset.js';
import User from '../models/User.js';
import { hashDocument, signDocument, verifySignature } from '../utils/rsaUtils.js';

/**
 * Crear y firmar transferencia de derechos (CAPA 3: RSA Firma)
 */
export async function createSignedTransfer(req, res) {
    try {
        const { obraId, compradorId } = req.body;
        const vendedorId = req.user.id;

        // Validar datos
        if (!obraId || !compradorId) {
            return res.status(400).json({ 
                error: 'ID de obra y comprador son requeridos' 
            });
        }

        // Verificar que la obra existe y pertenece al vendedor
        const obra = await DigitalAsset.findById(obraId);
        if (!obra) {
            return res.status(404).json({ error: 'Obra no encontrada' });
        }

        if (obra.vendedor_id !== vendedorId) {
            return res.status(403).json({ 
                error: 'No tienes permiso para transferir esta obra' 
            });
        }

        // Obtener información del comprador y vendedor
        const vendedor = await User.findById(vendedorId);
        const comprador = await User.findById(compradorId);

        if (!comprador) {
            return res.status(404).json({ error: 'Comprador no encontrado' });
        }

        // Verificar que el vendedor tiene llaves RSA
        if (!vendedor.private_key_encrypted) {
            return res.status(400).json({ 
                error: 'El vendedor no tiene llaves RSA configuradas' 
            });
        }

        // Crear documento de transferencia
        const documento = `
CERTIFICADO DE TRANSFERENCIA DE DERECHOS DIGITALES

Por medio del presente documento, yo ${vendedor.nombre} (${vendedor.email}), 
en mi calidad de propietario legítimo de la obra digital titulada 
"${obra.titulo}", manifiesto mi voluntad de transferir todos los derechos 
de propiedad, uso, reproducción y distribución de dicha obra a 
${comprador.nombre} (${comprador.email}).

Esta transferencia es irrevocable y otorga al comprador todos los derechos 
sobre la obra digital mencionada.

Obra: ${obra.titulo}
ID de Obra: ${obraId}
Precio: $${obra.precio} USD
Fecha: ${new Date().toISOString()}
Vendedor: ${vendedor.nombre} (ID: ${vendedorId})
Comprador: ${comprador.nombre} (ID: ${compradorId})
        `.trim();

        console.log('📄 Documento de transferencia creado');
        console.log('🔐 Generando hash SHA-256 del documento...');

        // PASO 1: Generar hash del documento (CAPA 3)
        const documentoHash = hashDocument(documento);

        console.log('✍️  Firmando documento con llave privada RSA...');

        // PASO 2: Firmar el hash con la llave privada del vendedor (CAPA 3)
        const firma = signDocument(documentoHash, vendedor.private_key_encrypted);

        console.log('✅ Documento firmado digitalmente');

        // Guardar transferencia en base de datos
        const transferId = await Transfer.create({
            obra_id: obraId,
            vendedor_id: vendedorId,
            comprador_id: compradorId,
            documento_texto: documento,
            hash_documento: documentoHash,
            firma_digital: firma
        });

        // Marcar obra como no disponible
        await DigitalAsset.markAsUnavailable(obraId);

        res.status(201).json({
            message: 'Transferencia creada y firmada exitosamente',
            transfer: {
                id: transferId,
                obraId,
                documentoHash,
                firma: firma.substring(0, 64) + '...',
                firmaCompleta: firma,
                algorithm: 'RSA-2048 + SHA-256',
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('❌ Error al crear transferencia:', error);
        res.status(500).json({ 
            error: 'Error al crear transferencia',
            details: error.message 
        });
    }
}

/**
 * Verificar firma de una transferencia (CAPA 3: RSA Verificación)
 */
export async function verifyTransfer(req, res) {
    try {
        const { id } = req.params;

        // Obtener transferencia
        const transfer = await Transfer.findById(id);

        if (!transfer) {
            return res.status(404).json({ 
                error: 'Transferencia no encontrada' 
            });
        }

        console.log('🔍 Verificando firma digital...');

        // Verificar firma con la llave pública del vendedor (CAPA 3)
        const isValid = verifySignature(
            transfer.hash_documento,
            transfer.firma_digital,
            transfer.vendedor_public_key
        );

        if (isValid) {
            // Marcar como verificada
            await Transfer.markAsVerified(id);
            console.log('✅ Firma VÁLIDA - Transferencia verificada');
        } else {
            console.log('❌ Firma INVÁLIDA');
        }

        res.json({
            transferId: id,
            valid: isValid,
            message: isValid 
                ? 'La firma es válida. El documento no ha sido alterado.' 
                : 'La firma es inválida. El documento puede haber sido modificado.',
            details: {
                documentHash: transfer.hash_documento,
                signature: transfer.firma_digital.substring(0, 64) + '...',
                vendedor: transfer.vendedor_nombre,
                comprador: transfer.comprador_nombre,
                obra: transfer.obra_titulo,
                timestamp: transfer.timestamp,
                algorithm: 'RSA-2048 + SHA-256'
            }
        });

    } catch (error) {
        console.error('❌ Error al verificar transferencia:', error);
        res.status(500).json({ 
            error: 'Error al verificar transferencia',
            details: error.message 
        });
    }
}

/**
 * Obtener transferencias del usuario actual
 */
export async function getMyTransfers(req, res) {
    try {
        const usuarioId = req.user.id;
        const rol = req.user.rol;

        let transfers;

        if (rol === 'vendedor') {
            transfers = await Transfer.findByVendedor(usuarioId);
        } else {
            transfers = await Transfer.findByComprador(usuarioId);
        }

        res.json({
            count: transfers.length,
            transfers
        });

    } catch (error) {
        console.error('❌ Error al obtener transferencias:', error);
        res.status(500).json({ 
            error: 'Error al obtener transferencias',
            details: error.message 
        });
    }
}

/**
 * Obtener detalles completos de una transferencia
 */
export async function getTransferDetails(req, res) {
    try {
        const { id } = req.params;
        const transfer = await Transfer.findById(id);

        if (!transfer) {
            return res.status(404).json({ 
                error: 'Transferencia no encontrada' 
            });
        }

        // Verificar que el usuario tiene permiso para ver esta transferencia
        if (transfer.vendedor_id !== req.user.id && 
            transfer.comprador_id !== req.user.id && 
            req.user.rol !== 'admin') {
            return res.status(403).json({ 
                error: 'No tienes permiso para ver esta transferencia' 
            });
        }

        res.json({
            id: transfer.id,
            obra: {
                id: transfer.obra_id,
                titulo: transfer.obra_titulo
            },
            vendedor: {
                id: transfer.vendedor_id,
                nombre: transfer.vendedor_nombre,
                email: transfer.vendedor_email
            },
            comprador: {
                id: transfer.comprador_id,
                nombre: transfer.comprador_nombre,
                email: transfer.comprador_email
            },
            documento: transfer.documento_texto,
            hash: transfer.hash_documento,
            firma: transfer.firma_digital,
            timestamp: transfer.timestamp,
            verificado: !!transfer.verificado,
            info: {
                algorithm: 'RSA-2048 + SHA-256',
                hashAlgorithm: 'SHA-256',
                signatureAlgorithm: 'RSA-PSS'
            }
        });

    } catch (error) {
        console.error('❌ Error al obtener detalles:', error);
        res.status(500).json({ 
            error: 'Error al obtener detalles',
            details: error.message 
        });
    }
}

export default {
    createSignedTransfer,
    verifyTransfer,
    getMyTransfers,
    getTransferDetails
};