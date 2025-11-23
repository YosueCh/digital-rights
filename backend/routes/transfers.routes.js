import express from 'express';
import { 
    createSignedTransfer, 
    verifyTransfer, 
    getMyTransfers,
    getTransferDetails 
} from '../controllers/transferController.js';
import { authenticateToken, requireVendedor } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   POST /api/transfers
 * @desc    Crear y firmar transferencia de derechos (CAPA 3: RSA)
 * @access  Private (Vendedor)
 */
router.post('/', authenticateToken, requireVendedor, createSignedTransfer);

/**
 * @route   GET /api/transfers/verify/:id
 * @desc    Verificar firma de una transferencia
 * @access  Private
 */
router.get('/verify/:id', authenticateToken, verifyTransfer);

/**
 * @route   GET /api/transfers/my-transfers
 * @desc    Obtener transferencias del usuario actual
 * @access  Private
 */
router.get('/my-transfers', authenticateToken, getMyTransfers);

/**
 * @route   GET /api/transfers/:id
 * @desc    Obtener detalles completos de una transferencia
 * @access  Private
 */
router.get('/:id', authenticateToken, getTransferDetails);

export default router;