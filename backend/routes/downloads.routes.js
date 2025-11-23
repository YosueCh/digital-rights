import express from 'express';
import { 
    prepareDownload, 
    simulateHybridDecryption,
    getMyDownloads 
} from '../controllers/downloadController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/downloads/prepare/:transferId
 * @desc    Preparar descarga segura con cifrado híbrido (CAPA 4)
 * @access  Private
 */
router.get('/prepare/:transferId', authenticateToken, prepareDownload);

/**
 * @route   POST /api/downloads/decrypt
 * @desc    Simular descifrado de paquete híbrido (demostración)
 * @access  Private
 */
router.post('/decrypt', authenticateToken, simulateHybridDecryption);

/**
 * @route   GET /api/downloads/my-downloads
 * @desc    Obtener historial de descargas del usuario
 * @access  Private
 */
router.get('/my-downloads', authenticateToken, getMyDownloads);

export default router;