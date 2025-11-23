import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import User from '../models/User.js';
import Buyer from '../models/Buyer.js';
import Transfer from '../models/Transfer.js';
import Download from '../models/Download.js';
import { getHashInfo } from '../utils/bcryptUtils.js';

const router = express.Router();

/**
 * @route   GET /api/demo/bcrypt-hashes
 * @desc    Obtener hashes bcrypt de todos los usuarios (demostración CAPA 1)
 * @access  Private
 */
router.get('/bcrypt-hashes', authenticateToken, async (req, res) => {
    try {
        const users = await User.findAll();
        
        const hashes = users.map(user => ({
            email: user.email,
            nombre: user.nombre,
            passwordHash: user.password_hash,
            hashInfo: getHashInfo(user.password_hash)
        }));

        res.json({
            message: 'Hashes bcrypt de todos los usuarios',
            count: hashes.length,
            hashes,
            info: {
                algorithm: 'bcrypt',
                rounds: 12,
                note: 'Los hashes bcrypt incluyen el salt automáticamente'
            }
        });

    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route   GET /api/demo/encrypted-data
 * @desc    Obtener datos cifrados de todos los compradores (demostración CAPA 2)
 * @access  Private
 */
router.get('/encrypted-data', authenticateToken, async (req, res) => {
    try {
        const buyers = await Buyer.findAll();

        const encryptedData = buyers.map(buyer => ({
            usuario: {
                nombre: buyer.usuario_nombre,
                email: buyer.email
            },
            datosEncriptados: {
                nombreCompleto: buyer.nombre_completo_cifrado,
                tarjeta: buyer.tarjeta_cifrada,
                cvv: buyer.cvv_cifrado,
                expiracion: buyer.expiracion_cifrada,
                iv: buyer.iv
            },
            info: {
                visible: 'Completamente ilegible sin la llave maestra',
                algorithm: 'AES-256-CBC'
            }
        }));

        res.json({
            message: 'Datos cifrados tal como se almacenan en BD',
            count: encryptedData.length,
            data: encryptedData,
            security: {
                algorithm: 'AES-256-CBC',
                keySize: '256 bits',
                ivSize: '128 bits',
                note: 'Cada registro tiene su propio IV único'
            }
        });

    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route   GET /api/demo/signatures
 * @desc    Obtener todas las firmas digitales (demostración CAPA 3)
 * @access  Private
 */
router.get('/signatures', authenticateToken, async (req, res) => {
    try {
        const transfers = await Transfer.findAll();

        const signatures = transfers.map(transfer => ({
            id: transfer.id,
            obra: transfer.obra_titulo,
            vendedor: transfer.vendedor_nombre,
            comprador: transfer.comprador_nombre,
            hashDocumento: transfer.hash_documento,
            firmaDigital: transfer.firma_digital,
            verificado: !!transfer.verificado,
            timestamp: transfer.timestamp
        }));

        res.json({
            message: 'Firmas digitales de todas las transferencias',
            count: signatures.length,
            signatures,
            info: {
                algorithm: 'RSA-2048 + SHA-256',
                hashAlgorithm: 'SHA-256',
                signatureAlgorithm: 'RSA-PSS',
                note: 'Cada firma garantiza autenticidad y no repudio'
            }
        });

    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route   GET /api/demo/hybrid-packages
 * @desc    Obtener información de paquetes híbridos (demostración CAPA 4)
 * @access  Private
 */
router.get('/hybrid-packages', authenticateToken, async (req, res) => {
    try {
        const downloads = await Download.findAll();

        const packages = downloads.map(download => ({
            id: download.id,
            obra: download.obra_titulo,
            comprador: download.comprador_nombre,
            llaveAESCifrada: download.aes_key_encrypted.substring(0, 64) + '...',
            ivCifrado: download.iv_cifrado,
            timestamp: download.download_timestamp,
            completado: !!download.completado
        }));

        res.json({
            message: 'Paquetes de cifrado híbrido',
            count: packages.length,
            packages,
            info: {
                dataEncryption: 'AES-256-CBC (llave temporal)',
                keyEncryption: 'RSA-2048-OAEP',
                process: [
                    '1. Archivo cifrado con AES-256 (llave temporal)',
                    '2. Llave AES cifrada con RSA público del comprador',
                    '3. Solo el comprador puede descifrar con su RSA privado'
                ]
            }
        });

    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route   GET /api/demo/security-summary
 * @desc    Resumen de todas las capas de seguridad
 * @access  Private
 */
router.get('/security-summary', authenticateToken, async (req, res) => {
    try {
        const usersCount = (await User.findAll()).length;
        const buyersCount = (await Buyer.findAll()).length;
        const transfersCount = (await Transfer.findAll()).length;
        const downloadsCount = (await Download.findAll()).length;

        res.json({
            message: 'Resumen de seguridad del sistema',
            statistics: {
                usuarios: usersCount,
                datosEncriptados: buyersCount,
                firmasDigitales: transfersCount,
                descargasHibridas: downloadsCount
            },
            securityLayers: {
                capa1: {
                    name: 'Bcrypt - Hash de Contraseñas',
                    algorithm: 'bcrypt',
                    rounds: 12,
                    usage: 'Autenticación de usuarios',
                    implemented: usersCount > 0
                },
                capa2: {
                    name: 'AES-256 - Cifrado Simétrico',
                    algorithm: 'AES-256-CBC',
                    keySize: '256 bits',
                    usage: 'Datos bancarios y archivos',
                    implemented: buyersCount > 0
                },
                capa3: {
                    name: 'RSA - Firma Digital',
                    algorithm: 'RSA-2048 + SHA-256',
                    keySize: '2048 bits',
                    usage: 'Certificados de transferencia',
                    implemented: transfersCount > 0
                },
                capa4: {
                    name: 'Híbrido - AES + RSA',
                    dataAlgorithm: 'AES-256-CBC',
                    keyAlgorithm: 'RSA-2048-OAEP',
                    usage: 'Descarga segura de archivos',
                    implemented: downloadsCount > 0
                }
            }
        });

    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;