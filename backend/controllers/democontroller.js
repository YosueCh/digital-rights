/**
 * CONTROLADOR DE DEMOS
 * 
 * Endpoints para demostrar las 4 capas de seguridad
 */

import User from '../models/User.js';
import Buyer from '../models/Buyer.js';
import DigitalAsset from '../models/DigitalAsset.js';
import Transfer from '../models/Transfer.js';
import database from '../config/database.js';
import { verifyPassword } from '../utils/bcryptUtils.js';
import { verifySignature } from '../utils/rsaUtils.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * DEMO CAPA 1: Mostrar hash bcrypt en BD
 * GET /api/demo/bcrypt
 */
export async function demoBcrypt(req, res) {
    try {
        console.log('\n📊 DEMO CAPA 1: Bcrypt - Hash de Contraseñas');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        // Obtener todos los usuarios con sus hashes
        const result = await database.db.all(
            'SELECT id, email, nombre, password_hash, rol, created_at FROM users LIMIT 10'
        );

        const demos = result.map(user => ({
            id: user.id,
            email: user.email,
            nombre: user.nombre,
            rol: user.rol,
            password_hash: user.password_hash,
            hash_info: {
                algoritmo: 'bcrypt',
                formato: user.password_hash?.substring(0, 7), // $2b$10$
                costo: user.password_hash?.substring(4, 6), // Factor de trabajo
                longitud: user.password_hash?.length,
                es_reversible: false
            }
        }));

        console.log(`✅ ${demos.length} usuarios encontrados`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        res.json({
            capa: 'CAPA 1: Autenticación Segura',
            algoritmo: 'bcrypt',
            proposito: 'Las contraseñas NUNCA se guardan en texto plano',
            caracteristicas: [
                'Hash unidireccional (no reversible)',
                'Salt único por contraseña',
                'Factor de trabajo configurable (costo computacional)',
                'Resistente a ataques de fuerza bruta'
            ],
            usuarios: demos,
            ejemplo_verificacion: {
                descripcion: 'Para verificar, usa POST /api/demo/bcrypt/verify',
                body: {
                    email: 'comprador@digitalrights.com',
                    password: 'comprador123'
                }
            }
        });

    } catch (error) {
        console.error('❌ Error en demo bcrypt:', error);
        res.status(500).json({ 
            error: 'Error en demo bcrypt',
            details: error.message 
        });
    }
}

/**
 * DEMO CAPA 1: Verificar contraseña
 * POST /api/demo/bcrypt/verify
 */
export async function verifyBcryptDemo(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                error: 'Email y password son requeridos' 
            });
        }

        console.log(`\n🔐 Verificando contraseña para: ${email}`);

        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const isValid = await verifyPassword(password, user.password_hash);

        console.log(`${isValid ? '✅' : '❌'} Contraseña ${isValid ? 'VÁLIDA' : 'INVÁLIDA'}`);

        res.json({
            email: user.email,
            password_ingresado: password,
            hash_almacenado: user.password_hash,
            resultado: isValid ? 'VÁLIDO ✅' : 'INVÁLIDO ❌',
            explicacion: isValid 
                ? 'bcrypt verificó que la contraseña coincide con el hash'
                : 'bcrypt determinó que la contraseña NO coincide'
        });

    } catch (error) {
        console.error('❌ Error en verificación:', error);
        res.status(500).json({ 
            error: 'Error en verificación',
            details: error.message 
        });
    }
}

/**
 * DEMO CAPA 2: Mostrar datos cifrados con AES en BD
 * GET /api/demo/aes
 */
export async function demoAES(req, res) {
    try {
        console.log('\n📊 DEMO CAPA 2: AES-256 - Cifrado Simétrico');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        // Obtener compradores con datos bancarios cifrados
        const buyers = await database.db.all(
            'SELECT id, user_id, bank_data_encrypted, bank_data_iv, created_at FROM buyers LIMIT 10'
        );

        // Obtener obras con archivos cifrados
        const assets = await database.db.all(
            'SELECT id, titulo, archivo_cifrado, archivo_iv, archivo_original_name FROM digital_assets LIMIT 10'
        );

        console.log(`✅ ${buyers.length} compradores y ${assets.length} obras con datos cifrados`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        res.json({
            capa: 'CAPA 2: Datos en Reposo',
            algoritmo: 'AES-256-CBC',
            proposito: 'Proteger datos sensibles almacenados en la BD',
            caracteristicas: [
                'Cifrado simétrico (misma llave para cifrar/descifrar)',
                'Llave de 256 bits (muy segura)',
                'IV (Vector de Inicialización) único por registro',
                'Los datos son ilegibles sin la llave maestra'
            ],
            datos_cifrados: {
                compradores: buyers.map(b => ({
                    id: b.id,
                    datos_bancarios_cifrados: b.bank_data_encrypted?.substring(0, 100) + '...',
                    iv: b.bank_data_iv,
                    longitud: b.bank_data_encrypted?.length,
                    nota: 'Texto completamente ilegible sin la llave AES'
                })),
                obras_digitales: assets.map(a => ({
                    id: a.id,
                    titulo: a.titulo,
                    archivo_original: a.archivo_original_name,
                    archivo_cifrado: a.archivo_cifrado,
                    iv: a.archivo_iv,
                    nota: 'El archivo está cifrado y no puede ser leído sin la llave'
                }))
            },
            seguridad: {
                llave_aes: process.env.AES_KEY ? 'CONFIGURADA (oculta por seguridad)' : 'NO CONFIGURADA ⚠️',
                ubicacion_llave: 'Variable de entorno (AES_KEY)',
                acceso: 'Solo el servidor backend tiene acceso a la llave'
            }
        });

    } catch (error) {
        console.error('❌ Error en demo AES:', error);
        res.status(500).json({ 
            error: 'Error en demo AES',
            details: error.message 
        });
    }
}

/**
 * DEMO CAPA 3: Mostrar firma digital RSA
 * GET /api/demo/signature
 */
export async function demoSignature(req, res) {
    try {
        console.log('\n📊 DEMO CAPA 3: RSA - Firma Digital');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        // Obtener transferencias con firmas
        const transfers = await database.db.all(`
            SELECT 
                t.id,
                t.comprador_id,
                t.obra_id,
                t.firma_digital,
                t.created_at,
                u.nombre as vendedor_nombre,
                u.public_key as vendedor_public_key,
                da.titulo as obra_titulo
            FROM transfers t
            JOIN digital_assets da ON t.obra_id = da.id
            JOIN users u ON da.vendedor_id = u.id
            WHERE t.firma_digital IS NOT NULL
            LIMIT 10
        `);

        const demosWithVerification = [];

        for (const transfer of transfers) {
            // Datos que se firmaron
            const dataToSign = JSON.stringify({
                transferencia_id: transfer.id,
                comprador_id: transfer.comprador_id,
                obra_id: transfer.obra_id
            });

            // Verificar firma
            let isValid = false;
            try {
                isValid = verifySignature(
                    dataToSign,
                    transfer.firma_digital,
                    transfer.vendedor_public_key
                );
            } catch (err) {
                console.log(`⚠️ Error al verificar firma ${transfer.id}:`, err.message);
            }

            demosWithVerification.push({
                transferencia_id: transfer.id,
                obra: transfer.obra_titulo,
                vendedor: transfer.vendedor_nombre,
                comprador_id: transfer.comprador_id,
                fecha: transfer.created_at,
                firma_digital: {
                    valor: transfer.firma_digital?.substring(0, 100) + '...',
                    longitud: transfer.firma_digital?.length,
                    algoritmo: 'RSA-2048 con SHA-256'
                },
                verificacion: {
                    resultado: isValid ? 'FIRMA VÁLIDA ✅' : 'FIRMA INVÁLIDA ❌',
                    datos_firmados: dataToSign,
                    llave_publica_usada: transfer.vendedor_public_key?.substring(0, 100) + '...'
                }
            });
        }

        console.log(`✅ ${transfers.length} transferencias con firmas digitales`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        res.json({
            capa: 'CAPA 3: Autenticidad y No Repudio',
            algoritmo: 'RSA-2048 + SHA-256',
            proposito: 'Garantizar que el vendedor firmó la transferencia de derechos',
            caracteristicas: [
                'Firma digital con llave privada del vendedor',
                'Verificación con llave pública',
                'No repudio: el vendedor no puede negar la firma',
                'Integridad: detecta cualquier modificación'
            ],
            transferencias_firmadas: demosWithVerification,
            explicacion: {
                proceso_firma: [
                    '1. Vendedor firma datos con su llave privada RSA',
                    '2. Firma se almacena en la BD',
                    '3. Cualquiera puede verificar con llave pública del vendedor',
                    '4. Si la firma es válida, garantiza autoría e integridad'
                ]
            }
        });

    } catch (error) {
        console.error('❌ Error en demo signature:', error);
        res.status(500).json({ 
            error: 'Error en demo signature',
            details: error.message 
        });
    }
}

/**
 * DEMO CAPA 4: Simular descarga con cifrado híbrido
 * GET /api/demo/hybrid
 */
export async function demoHybrid(req, res) {
    try {
        console.log('\n📊 DEMO CAPA 4: Cifrado Híbrido (AES + RSA)');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        res.json({
            capa: 'CAPA 4: Defensa en Profundidad',
            algoritmo: 'Híbrido: AES-256 + RSA-2048',
            proposito: 'Comunicación segura extremo a extremo para descarga de archivos',
            caracteristicas: [
                'Combina velocidad de AES con seguridad de RSA',
                'Llave AES temporal única por descarga',
                'Llave AES protegida con RSA público del comprador',
                'Solo el comprador puede descifrar con su llave privada'
            ],
            flujo_completo: {
                servidor: [
                    '1. Descifra archivo de la BD con AES-256 (llave maestra)',
                    '2. Genera llave AES temporal (256 bits)',
                    '3. Cifra archivo con llave temporal',
                    '4. Cifra llave temporal con RSA público del comprador',
                    '5. Envía paquete: {datos_cifrados, llave_cifrada, iv}'
                ],
                cliente: [
                    '1. Recibe paquete cifrado',
                    '2. Descifra llave AES con su RSA privado',
                    '3. Descifra datos con llave AES recuperada',
                    '4. Obtiene archivo original'
                ]
            },
            seguridad: {
                nivel: 'MÁXIMO',
                capas: 4,
                beneficios: [
                    'Defensa en profundidad (múltiples capas)',
                    'Llave única por transacción',
                    'Protección extremo a extremo',
                    'Independiente de HTTPS'
                ]
            },
            demo_real: {
                descripcion: 'Para ver demo real, primero compra una obra',
                pasos: [
                    '1. Inicia sesión como comprador',
                    '2. Compra una obra digital',
                    '3. Ve a "Mis Compras"',
                    '4. Click en "Descargar (Cifrado Híbrido)"',
                    '5. Verás el proceso completo en la consola'
                ],
                endpoints: {
                    preparar_descarga: 'POST /api/downloads/prepare/:transferId',
                    simular_descifrado: 'POST /api/downloads/simulate-decrypt'
                }
            },
            ejemplo_visual: {
                mensaje: 'Ejemplo simplificado de cifrado híbrido',
                nota: 'En una descarga real, el archivo completo se cifra así',
                simulacion: {
                    datos_originales: 'Contenido del archivo de alta resolución...',
                    paso1_cifrado_aes: 'X7k9mP2zQ...[datos ilegibles]...nR4vB8jL',
                    paso2_llave_aes: 'f3a7b9c2d4e6...[32 bytes aleatorios]',
                    paso3_llave_cifrada_rsa: 'MIIBIjANBgkq...[256 bytes cifrados con RSA]',
                    paquete_final: {
                        encryptedData: 'X7k9mP2zQ...',
                        encryptedKey: 'MIIBIjANBgkq...',
                        iv: 'a1b2c3d4e5f6...'
                    }
                }
            }
        });

        console.log('✅ Demo híbrido preparada');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    } catch (error) {
        console.error('❌ Error en demo hybrid:', error);
        res.status(500).json({ 
            error: 'Error en demo hybrid',
            details: error.message 
        });
    }
}

/**
 * Resumen de seguridad completo
 * GET /api/demo/security-summary
 */
export async function securitySummary(req, res) {
    try {
        res.json({
            proyecto: 'Digital Rights - Plataforma de Arte Digital',
            capas_de_seguridad: {
                capa1: {
                    nombre: 'Autenticación Segura',
                    algoritmo: 'bcrypt',
                    implementacion: 'Hash de contraseñas',
                    endpoint_demo: '/api/demo/bcrypt'
                },
                capa2: {
                    nombre: 'Datos en Reposo',
                    algoritmo: 'AES-256-CBC',
                    implementacion: 'Cifrado de datos sensibles en BD',
                    endpoint_demo: '/api/demo/aes'
                },
                capa3: {
                    nombre: 'Autenticidad y No Repudio',
                    algoritmo: 'RSA-2048 + SHA-256',
                    implementacion: 'Firma digital de transferencias',
                    endpoint_demo: '/api/demo/signature'
                },
                capa4: {
                    nombre: 'Defensa en Profundidad',
                    algoritmo: 'Híbrido (AES + RSA)',
                    implementacion: 'Comunicación segura para descargas',
                    endpoint_demo: '/api/demo/hybrid'
                }
            },
            endpoints_disponibles: {
                bcrypt: {
                    ver_hashes: 'GET /api/demo/bcrypt',
                    verificar: 'POST /api/demo/bcrypt/verify'
                },
                aes: {
                    ver_datos_cifrados: 'GET /api/demo/aes'
                },
                firma: {
                    ver_firmas: 'GET /api/demo/signature'
                },
                hibrido: {
                    explicacion: 'GET /api/demo/hybrid',
                    preparar: 'POST /api/downloads/prepare/:transferId'
                }
            }
        });

    } catch (error) {
        console.error('❌ Error en security summary:', error);
        res.status(500).json({ 
            error: 'Error en security summary',
            details: error.message 
        });
    }
}

export default {
    demoBcrypt,
    verifyBcryptDemo,
    demoAES,
    demoSignature,
    demoHybrid,
    securitySummary
};