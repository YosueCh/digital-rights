-- ===========================================
-- DIGITAL RIGHTS - ESQUEMA DE BASE DE DATOS
-- ===========================================

-- TABLA 1: USUARIOS (CAPA 1: Bcrypt)
-- Almacena usuarios con contraseñas hasheadas y llaves RSA
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,  -- Hash bcrypt de la contraseña
    nombre TEXT NOT NULL,
    rol TEXT DEFAULT 'comprador' CHECK(rol IN ('comprador', 'vendedor', 'admin')),
    public_key TEXT,  -- Llave pública RSA (PEM format)
    private_key_encrypted TEXT,  -- Llave privada cifrada con password del usuario
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- TABLA 2: OBRAS DIGITALES
-- Almacena información de las obras con archivos cifrados
CREATE TABLE IF NOT EXISTS obras_digitales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    descripcion TEXT,
    preview_path TEXT,  -- Ruta a imagen de baja resolución (pública)
    archivo_cifrado TEXT,  -- Nombre del archivo HD cifrado con AES
    archivo_iv TEXT,  -- IV usado para cifrar el archivo
    archivo_original_name TEXT,  -- Nombre original del archivo
    precio DECIMAL(10,2) NOT NULL,
    vendedor_id INTEGER NOT NULL,
    disponible BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vendedor_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- TABLA 3: COMPRADORES (CAPA 2: AES-256)
-- Almacena datos bancarios cifrados simétricamente
CREATE TABLE IF NOT EXISTS compradores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL UNIQUE,
    nombre_completo_cifrado TEXT NOT NULL,  -- Cifrado con AES-256
    tarjeta_cifrada TEXT NOT NULL,  -- Número de tarjeta cifrado
    cvv_cifrado TEXT NOT NULL,  -- CVV cifrado
    expiracion_cifrada TEXT NOT NULL,  -- Fecha de expiración cifrada
    iv TEXT NOT NULL,  -- IV único para este registro (16 bytes hex)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- TABLA 4: TRANSFERENCIAS DE DERECHOS (CAPA 3: RSA Firma)
-- Almacena certificados de transferencia firmados digitalmente
CREATE TABLE IF NOT EXISTS transferencias_derechos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    obra_id INTEGER NOT NULL,
    vendedor_id INTEGER NOT NULL,
    comprador_id INTEGER NOT NULL,
    documento_texto TEXT NOT NULL,  -- Certificado de transferencia en texto plano
    hash_documento TEXT NOT NULL,  -- SHA-256 del documento
    firma_digital TEXT NOT NULL,  -- Firma RSA del hash (hex)
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    verificado BOOLEAN DEFAULT 0,  -- Si la firma fue verificada
    FOREIGN KEY (obra_id) REFERENCES obras_digitales(id) ON DELETE CASCADE,
    FOREIGN KEY (vendedor_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (comprador_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- TABLA 5: DESCARGAS (CAPA 4: Log de Cifrado Híbrido)
-- Registra las descargas con cifrado híbrido
CREATE TABLE IF NOT EXISTS descargas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transferencia_id INTEGER NOT NULL,
    comprador_id INTEGER NOT NULL,
    aes_key_encrypted TEXT NOT NULL,  -- Llave AES temporal cifrada con RSA público
    archivo_cifrado_path TEXT NOT NULL,  -- Ruta al archivo cifrado
    iv_cifrado TEXT NOT NULL,  -- IV usado para cifrar el archivo
    download_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    completado BOOLEAN DEFAULT 0,
    FOREIGN KEY (transferencia_id) REFERENCES transferencias_derechos(id) ON DELETE CASCADE,
    FOREIGN KEY (comprador_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- ÍNDICES para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_obras_vendedor ON obras_digitales(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_obras_disponible ON obras_digitales(disponible);
CREATE INDEX IF NOT EXISTS idx_transferencias_comprador ON transferencias_derechos(comprador_id);
CREATE INDEX IF NOT EXISTS idx_transferencias_vendedor ON transferencias_derechos(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_descargas_comprador ON descargas(comprador_id);