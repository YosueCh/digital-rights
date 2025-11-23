import express from 'express';
import { saveBankData, getBankData, viewEncryptedData } from '../controllers/buyerController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   POST /api/buyers/bank-data
 * @desc    Guardar datos bancarios cifrados (CAPA 2: AES-256)
 * @access  Private
 */
router.post('/bank-data', authenticateToken, saveBankData);

/**
 * @route   GET /api/buyers/bank-data
 * @desc    Obtener datos bancarios descifrados
 * @access  Private
 */
router.get('/bank-data', authenticateToken, getBankData);

/**
 * @route   GET /api/buyers/bank-data/encrypted
 * @desc    Ver datos cifrados en BD (demostración)
 * @access  Private
 */
router.get('/bank-data/encrypted', authenticateToken, viewEncryptedData);

export default router;