import express from 'express';
import multer from 'multer';
import { 
    createAsset, 
    getAvailableAssets, 
    getAssetById, 
    getMyAssets 
} from '../controllers/assetController.js';
import { authenticateToken, requireVendedor } from '../middleware/auth.js';
import path from 'path';

const router = express.Router();

// Configurar multer para subida de archivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/temp/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE || 52428800) // 50MB por defecto
    },
    fileFilter: (req, file, cb) => {
        // Aceptar solo imágenes y archivos comunes
        const allowedTypes = /jpeg|jpg|png|gif|pdf|zip/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Tipo de archivo no permitido'));
        }
    }
});

/**
 * @route   POST /api/assets
 * @desc    Crear nueva obra digital (vendedor)
 * @access  Private (Vendedor)
 */
router.post('/', authenticateToken, requireVendedor, upload.single('archivo'), createAsset);

/**
 * @route   GET /api/assets
 * @desc    Obtener todas las obras disponibles
 * @access  Public
 */
router.get('/', getAvailableAssets);

/**
 * @route   GET /api/assets/my-assets
 * @desc    Obtener obras del vendedor actual
 * @access  Private (Vendedor)
 */
router.get('/my-assets', authenticateToken, requireVendedor, getMyAssets);

/**
 * @route   GET /api/assets/:id
 * @desc    Obtener detalles de una obra específica
 * @access  Public
 */
router.get('/:id', getAssetById);

export default router;