import database from '../config/database.js';
import { hashPassword } from '../utils/bcryptUtils.js';
import { generateKeyPair } from '../utils/rsaUtils.js';
import { encrypt } from '../utils/aesUtils.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seedDatabase() {
    try {
        console.log('🌱 Iniciando seed de la base de datos...');

        // Conectar a la base de datos
        await database.connect();
        
        // Inicializar tablas
        await database.initializeTables();

        // Crear usuarios de prueba
        console.log('👤 Creando usuarios...');

        // 1. Vendedor con llaves RSA
        const vendedorPassword = 'vendedor123';
        const vendedorHash = await hashPassword(vendedorPassword);
        const vendedorKeys = generateKeyPair();
        
        const vendedorId = await database.run(`
            INSERT INTO usuarios (email, password_hash, nombre, rol, public_key, private_key_encrypted)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            'vendedor@digitalrights.com',
            vendedorHash,
            'Carlos Artista',
            'vendedor',
            vendedorKeys.publicKey,
            vendedorKeys.privateKey
        ]);

        // 2. Comprador
        const compradorPassword = 'comprador123';
        const compradorHash = await hashPassword(compradorPassword);
        const compradorKeys = generateKeyPair();
        
        const compradorId = await database.run(`
            INSERT INTO usuarios (email, password_hash, nombre, rol, public_key, private_key_encrypted)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            'comprador@digitalrights.com',
            compradorHash,
            'Ana Coleccionista',
            'comprador',
            compradorKeys.publicKey,
            compradorKeys.privateKey
        ]);

        // 3. Admin
        const adminPassword = 'admin123';
        const adminHash = await hashPassword(adminPassword);
        
        await database.run(`
            INSERT INTO usuarios (email, password_hash, nombre, rol)
            VALUES (?, ?, ?, ?)
        `, [
            'admin@digitalrights.com',
            adminHash,
            'Administrador',
            'admin'
        ]);

        console.log('✅ Usuarios creados');

        // Crear obras digitales de ejemplo
        console.log('🖼️  Creando obras digitales...');

        const obras = [
            {
                titulo: 'Aurora Boreal Digital',
                descripcion: 'Impresionante representación digital de la aurora boreal con colores vibrantes',
                precio: 150.00
            },
            {
                titulo: 'Noche Estrellada Moderna',
                descripcion: 'Reinterpretación digital del clásico con efectos contemporáneos',
                precio: 200.00
            },
            {
                titulo: 'Océano Profundo',
                descripcion: 'Vista submarina con vida marina en alta resolución',
                precio: 175.00
            }
        ];

        for (const obra of obras) {
            await database.run(`
                INSERT INTO obras_digitales 
                (titulo, descripcion, preview_path, archivo_cifrado, archivo_iv, archivo_original_name, precio, vendedor_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                obra.titulo,
                obra.descripcion,
                `/previews/${obra.titulo.toLowerCase().replace(/ /g, '_')}.jpg`,
                `encrypted_${Date.now()}.enc`,
                'iv_placeholder_' + Math.random().toString(36).substring(7),
                `${obra.titulo}.png`,
                obra.precio,
                vendedorId.id
            ]);
        }

        console.log('✅ Obras digitales creadas');

        // Crear datos de comprador cifrados (ejemplo)
        console.log('💳 Creando datos bancarios cifrados...');
        
        const datosBancarios = {
            nombre: 'Ana Coleccionista Martinez',
            tarjeta: '4532-1234-5678-9010',
            cvv: '123',
            expiracion: '12/25'
        };

        const nombreCifrado = encrypt(datosBancarios.nombre);
        const tarjetaCifrada = encrypt(datosBancarios.tarjeta);
        const cvvCifrado = encrypt(datosBancarios.cvv);
        const expiracionCifrada = encrypt(datosBancarios.expiracion);

        await database.run(`
            INSERT INTO compradores 
            (usuario_id, nombre_completo_cifrado, tarjeta_cifrada, cvv_cifrado, expiracion_cifrada, iv)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            compradorId.id,
            nombreCifrado.encrypted,
            tarjetaCifrada.encrypted,
            cvvCifrado.encrypted,
            expiracionCifrada.encrypted,
            nombreCifrado.iv
        ]);

        console.log('✅ Datos bancarios cifrados guardados');

        console.log('\n✅ ¡Seed completado exitosamente!');
        console.log('\n📝 Credenciales de prueba:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Vendedor:');
        console.log('  Email: vendedor@digitalrights.com');
        console.log('  Password: vendedor123');
        console.log('\nComprador:');
        console.log('  Email: comprador@digitalrights.com');
        console.log('  Password: comprador123');
        console.log('\nAdmin:');
        console.log('  Email: admin@digitalrights.com');
        console.log('  Password: admin123');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    } catch (error) {
        console.error('❌ Error durante el seed:', error);
        process.exit(1);
    } finally {
        await database.close();
    }
}

// Ejecutar seed
seedDatabase();