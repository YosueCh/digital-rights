import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Configurar __dirname para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config();

// Importar base de datos
import database from './config/database.js';

// Importar routes
import authRoutes from './routes/auth.routes.js';
import buyersRoutes from './routes/buyers.routes.js';
import assetsRoutes from './routes/assets.routes.js';
import transfersRoutes from './routes/transfers.routes.js';
import downloadsRoutes from './routes/downloads.routes.js';
import demoRoutes from './routes/demo.routes.js';

// Importar middleware
import { errorHandler } from './middleware/errorHandler.js';

// Crear aplicación Express
const app = express();
const PORT = process.env.PORT || 3000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// ==========================================
// MIDDLEWARE
// ==========================================

// CORS
app.use(cors({
    origin: CLIENT_URL,
    credentials: true
}));

// Body parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logger simple
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Crear directorios necesarios
const directories = [
    './uploads',
    './uploads/temp',
    './keys'
];

directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Directorio creado: ${dir}`);
    }
});

// ==========================================
// ROUTES
// ==========================================

// Health check
app.get('/', (req, res) => {
    res.json({
        message: '🔐 Digital Rights API',
        version: '1.0.0',
        status: 'running',
        security: {
            layers: [
                'CAPA 1: Bcrypt - Hash de contraseñas',
                'CAPA 2: AES-256 - Cifrado simétrico',
                'CAPA 3: RSA - Firma digital',
                'CAPA 4: Híbrido - AES + RSA'
            ]
        },
        endpoints: {
            auth: '/api/auth',
            buyers: '/api/buyers',
            assets: '/api/assets',
            transfers: '/api/transfers',
            downloads: '/api/downloads',
            demo: '/api/demo'
        }
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/buyers', buyersRoutes);
app.use('/api/assets', assetsRoutes);
app.use('/api/transfers', transfersRoutes);
app.use('/api/downloads', downloadsRoutes);
app.use('/api/demo', demoRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint no encontrado',
        path: req.path
    });
});

// Error handler (debe ser el último middleware)
app.use(errorHandler);

// ==========================================
// INICIAR SERVIDOR
// ==========================================

async function startServer() {
    try {
        console.log('\n🚀 Iniciando Digital Rights Backend...\n');

        // Conectar a la base de datos
        await database.connect();
        
        // Inicializar tablas
        await database.initializeTables();

        // Iniciar servidor
        app.listen(PORT, () => {
            console.log('\n✅ Servidor iniciado correctamente\n');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`📡 API: http://localhost:${PORT}`);
            console.log(`🌐 Cliente: ${CLIENT_URL}`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
            console.log('🔐 Capas de seguridad activas:');
            console.log('  ✅ CAPA 1: Bcrypt (Hash de contraseñas)');
            console.log('  ✅ CAPA 2: AES-256 (Cifrado simétrico)');
            console.log('  ✅ CAPA 3: RSA (Firma digital)');
            console.log('  ✅ CAPA 4: Híbrido (AES + RSA)');
            console.log('\n📚 Documentación: /api/demo/security-summary');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        });

    } catch (error) {
        console.error('❌ Error al iniciar servidor:', error);
        process.exit(1);
    }
}

// Manejo de cierre graceful
process.on('SIGINT', async () => {
    console.log('\n\n🛑 Cerrando servidor...');
    await database.close();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n\n🛑 Cerrando servidor...');
    await database.close();
    process.exit(0);
});

// Iniciar
startServer();