import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Middleware para verificar JWT
 */
export async function authenticateToken(req, res, next) {
    try {
        // Obtener token del header
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({ 
                error: 'Acceso denegado. Token no proporcionado.' 
            });
        }

        // Verificar token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Obtener usuario de la base de datos
        const user = await User.findById(decoded.userId);
        
        if (!user) {
            return res.status(401).json({ 
                error: 'Usuario no encontrado.' 
            });
        }

        // Agregar usuario al request
        req.user = {
            id: user.id,
            email: user.email,
            nombre: user.nombre,
            rol: user.rol
        };

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                error: 'Token expirado. Por favor inicia sesión nuevamente.' 
            });
        }
        
        return res.status(403).json({ 
            error: 'Token inválido.' 
        });
    }
}

/**
 * Middleware para verificar rol de vendedor
 */
export function requireVendedor(req, res, next) {
    if (req.user.rol !== 'vendedor' && req.user.rol !== 'admin') {
        return res.status(403).json({ 
            error: 'Acceso denegado. Solo vendedores pueden realizar esta acción.' 
        });
    }
    next();
}

/**
 * Middleware para verificar rol de admin
 */
export function requireAdmin(req, res, next) {
    if (req.user.rol !== 'admin') {
        return res.status(403).json({ 
            error: 'Acceso denegado. Solo administradores pueden realizar esta acción.' 
        });
    }
    next();
}

export default {
    authenticateToken,
    requireVendedor,
    requireAdmin
};