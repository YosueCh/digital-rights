import User from '../models/User.js';
import { hashPassword, verifyPassword } from '../utils/bcryptUtils.js';
import { generateKeyPair } from '../utils/rsaUtils.js';
import jwt from 'jsonwebtoken';

/**
 * Registrar nuevo usuario
 */
export async function register(req, res) {
    try {
        const { email, password, nombre, rol } = req.body;

        // Validar datos
        if (!email || !password || !nombre) {
            return res.status(400).json({ 
                error: 'Email, contraseña y nombre son requeridos' 
            });
        }

        // Verificar si el email ya existe
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(409).json({ 
                error: 'El email ya está registrado' 
            });
        }

        // Hashear contraseña con bcrypt (CAPA 1)
        console.log('🔐 Hasheando contraseña con bcrypt...');
        const password_hash = await hashPassword(password);

        // Si es vendedor, generar llaves RSA (CAPA 3)
        let publicKey = null;
        let privateKeyEncrypted = null;

        if (rol === 'vendedor') {
            console.log('🔑 Generando par de llaves RSA para vendedor...');
            const keys = generateKeyPair();
            publicKey = keys.publicKey;
            privateKeyEncrypted = keys.privateKey;
        }

        // Crear usuario
        const userId = await User.create({
            email,
            password_hash,
            nombre,
            rol: rol || 'comprador',
            public_key: publicKey,
            private_key_encrypted: privateKeyEncrypted
        });

        // Generar JWT (leer directamente de process.env)
        const token = jwt.sign(
            { userId, email, rol: rol || 'comprador' },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        console.log(`✅ Usuario registrado: ${email}`);

        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            user: {
                id: userId,
                email,
                nombre,
                rol: rol || 'comprador'
            },
            token
        });

    } catch (error) {
        console.error('❌ Error en registro:', error);
        res.status(500).json({ 
            error: 'Error al registrar usuario',
            details: error.message 
        });
    }
}

/**
 * Iniciar sesión
 */
export async function login(req, res) {
    try {
        const { email, password } = req.body;

        // Validar datos
        if (!email || !password) {
            return res.status(400).json({ 
                error: 'Email y contraseña son requeridos' 
            });
        }

        // Buscar usuario
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({ 
                error: 'Credenciales inválidas' 
            });
        }

        // Verificar contraseña con bcrypt (CAPA 1)
        console.log('🔐 Verificando contraseña...');
        const isValidPassword = await verifyPassword(password, user.password_hash);

        if (!isValidPassword) {
            return res.status(401).json({ 
                error: 'Credenciales inválidas' 
            });
        }

        // Generar JWT (leer directamente de process.env)
        const token = jwt.sign(
            { 
                userId: user.id, 
                email: user.email, 
                rol: user.rol 
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        console.log(`✅ Login exitoso: ${email}`);

        res.json({
            message: 'Login exitoso',
            user: {
                id: user.id,
                email: user.email,
                nombre: user.nombre,
                rol: user.rol,
                hasKeys: !!user.public_key
            },
            token
        });

    } catch (error) {
        console.error('❌ Error en login:', error);
        res.status(500).json({ 
            error: 'Error al iniciar sesión',
            details: error.message 
        });
    }
}

/**
 * Obtener perfil del usuario actual
 */
export async function getProfile(req, res) {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ 
                error: 'Usuario no encontrado' 
            });
        }

        res.json({
            id: user.id,
            email: user.email,
            nombre: user.nombre,
            rol: user.rol,
            hasKeys: !!user.public_key,
            created_at: user.created_at
        });

    } catch (error) {
        console.error('❌ Error al obtener perfil:', error);
        res.status(500).json({ 
            error: 'Error al obtener perfil',
            details: error.message 
        });
    }
}

export default {
    register,
    login,
    getProfile
};