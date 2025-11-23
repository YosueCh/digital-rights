# 🎨 Digital Rights - Marketplace Seguro de Arte Digital

Marketplace de compra-venta de arte digital que implementa 4 capas fundamentales de seguridad criptográfica para proteger la información sensible de compradores, vendedores y garantizar la autenticidad de las transferencias de derechos digitales.

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Arquitectura](#️-arquitectura)
- [Capas de Seguridad](#-capas-de-seguridad)
- [Stack Tecnológico](#️-stack-tecnológico)
- [Instalación](#-instalación)
- [Uso](#-uso)
- [Demostraciones](#-demostraciones)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Endpoints de la API](#-endpoints-de-la-api)

---

## ✨ Características

✅ **Autenticación segura** con hashing bcrypt  
✅ **Cifrado de datos en reposo** con AES-256-CBC  
✅ **Firma digital RSA** para certificados de propiedad  
✅ **Cifrado híbrido** (RSA + AES) para comunicación segura  
✅ **Base de datos SQLite** con datos sensibles protegidos  
✅ **Interfaz web** moderna y responsive  
✅ **Sistema de sesiones** seguro  
✅ **Defensa en profundidad** - 4 capas de seguridad independientes

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENTE (HTML5 + JS)                     │
│  • Registro e inicio de sesión                              │
│  • Galería de obras digitales                               │
│  • Cifrado híbrido de datos de pago                         │
│  • Descifrado local de archivos                             │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS + Cifrado Híbrido
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  SERVIDOR (Node.js/Express)                 │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         CAPA 1: Autenticación (bcrypt)             │   │
│  │  • Hash de contraseñas (10 rounds)                 │   │
│  │  • Sesiones seguras con express-session            │   │
│  │  • Salt único por usuario                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │     CAPA 2: Cifrado en Reposo (AES-256-CBC)        │   │
│  │  • Cifrado de datos bancarios                      │   │
│  │  • Cifrado de archivos de arte en alta resolución  │   │
│  │  • KEY: Generada con scrypt                        │   │
│  │  • IV: Único por operación (16 bytes)             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │      CAPA 3: Firma Digital (RSA-2048)              │   │
│  │  • Generación de pares de llaves por vendedor      │   │
│  │  • Firma SHA-256 + RSA                             │   │
│  │  • Certificados de propiedad firmados              │   │
│  │  • Verificación de autenticidad                    │   │
│  │  • Garantía de no repudio                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │    CAPA 4: Cifrado Híbrido (RSA-2048 + AES-256)    │   │
│  │  • Cliente: genera llave AES temporal              │   │
│  │  • Cliente: cifra datos con AES                    │   │
│  │  • Cliente: cifra llave AES con RSA público        │   │
│  │  • Servidor: descifra llave con RSA privado        │   │
│  │  • Servidor: descifra datos con llave AES          │   │
│  │  • Bidireccional para descargas seguras            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                 BASE DE DATOS (SQLite)                      │
│                                                             │
│  • users: Contraseñas hasheadas + llaves RSA               │
│  • artworks: Archivos cifrados con AES-256                 │
│  • transactions: Datos bancarios cifrados + firmas RSA     │
│  • Certificados firmados digitalmente                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Capas de Seguridad

### 1️⃣ CAPA 1: Login Seguro (Autenticación con bcrypt)

**Objetivo:** Proteger la confidencialidad de las credenciales de usuario.

**Implementación:**
- **Algoritmo:** bcrypt con 10 rounds
- Las contraseñas **NUNCA** se almacenan en texto plano
- Sesiones seguras con express-session
- Salt único automático por usuario

**Código clave:**

```javascript
// Registro (init-db.js)
const bcrypt = require('bcrypt');
const passwordHash = bcrypt.hashSync('comprador123', 10);

db.run(`INSERT INTO users (username, password_hash, role) 
        VALUES (?, ?, ?)`, ['comprador', passwordHash, 'buyer']);
```

```javascript
// Login (server.js)
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    // Verificar password con bcrypt
    if (!bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }
    
    // Crear sesión segura
    req.session.userId = user.id;
    req.session.username = user.username;
    
    res.json({ success: true });
  });
});
```

**Verificación en BD:**

```bash
sqlite3 marketplace.db
SELECT username, password_hash FROM users;
# comprador|$2b$10$XxXxXxXxXxXxXxXxXxXxXx...
```

✅ **Verificación:** El hash comienza con `$2b$10$` (bcrypt con 10 rounds)

---

### 2️⃣ CAPA 2: Datos en Reposo (Cifrado Simétrico AES-256)

**Objetivo:** Proteger la confidencialidad de datos sensibles almacenados.

**Implementación:**
- **Algoritmo:** AES-256-CBC
- **Llave maestra:** Generada con scrypt (PBKDF)
- **IV:** 16 bytes únicos por operación
- **Datos protegidos:**
  - Información de pago de compradores
  - Archivos de arte de alta resolución

**Gestión de Llaves:**

```javascript
// crypto-utils.js
const crypto = require('crypto');

// Derivar llave maestra de 256 bits con scrypt
const MASTER_KEY = crypto.scryptSync(
  'mi_password_secreto_super_seguro', 
  'salt', 
  32  // 32 bytes = 256 bits
);
const IV_LENGTH = 16;  // 128 bits
```

**Código de Cifrado:**

```javascript
// Cifrar datos sensibles
function encryptSymmetric(text) {
  // Generar IV aleatorio único
  const iv = crypto.randomBytes(IV_LENGTH);
  
  // Crear cipher AES-256-CBC
  const cipher = crypto.createCipheriv('aes-256-cbc', MASTER_KEY, iv);
  
  // Cifrar
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Retornar IV + datos cifrados (el IV no es secreto)
  return iv.toString('hex') + ':' + encrypted;
}
```

**Código de Descifrado:**

```javascript
function decryptSymmetric(encryptedData) {
  // Separar IV y datos
  const parts = encryptedData.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  
  // Crear decipher
  const decipher = crypto.createDecipheriv('aes-256-cbc', MASTER_KEY, iv);
  
  // Descifrar
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

**Uso en el servidor:**

```javascript
// Cifrar información de pago antes de guardar
const encryptedPaymentInfo = crypto.encryptSymmetric(
  JSON.stringify(paymentData)
);

db.run(`INSERT INTO transactions (payment_info_encrypted) VALUES (?)`, 
  [encryptedPaymentInfo]);
```

**Datos cifrados en BD:**

```sql
SELECT payment_info_encrypted FROM transactions;
-- a1b2c3d4e5f6...:U2FsdGVkX19O3...  ← IV:Datos cifrados (ilegible)
```

✅ **Verificación:** Los datos son completamente ilegibles sin la llave maestra

---

### 3️⃣ CAPA 3: Firma Digital (Autenticidad y No Repudio)

**Objetivo:** Garantizar la autenticidad e integridad de los certificados de propiedad.

**Implementación:**
- **Algoritmo asimétrico:** RSA-2048
- **Hash:** SHA-256
- Cada vendedor genera un par de llaves (pública/privada)
- Los certificados de transferencia están firmados digitalmente

**Generación de Llaves RSA:**

```javascript
// Generar par de llaves RSA para cada usuario
function generateKeyPair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });
  return { publicKey, privateKey };
}
```

**Firma de Certificado:**

```javascript
// Firmar certificado de transferencia
function signData(data, privateKey) {
  const sign = crypto.createSign('SHA256');
  sign.update(data);
  sign.end();
  return sign.sign(privateKey, 'hex');
}
```

**Flujo en el servidor:**

```javascript
// Crear certificado de propiedad
const certificate = {
  artwork_id: artwork.id,
  artwork_title: artwork.title,
  buyer: req.session.username,
  seller: artwork.artist,
  price: artwork.price,
  date: new Date().toISOString()
};

const certificateStr = JSON.stringify(certificate);

// Firmar con llave privada del vendedor
const signature = crypto.signData(certificateStr, seller.private_key);

// Guardar certificado + firma
db.run(`INSERT INTO transactions (certificate, signature) VALUES (?, ?)`,
  [certificateStr, signature]);
```

**Verificación de Firma:**

```javascript
function verifySignature(data, signature, publicKey) {
  const verify = crypto.createVerify('SHA256');
  verify.update(data);
  verify.end();
  return verify.verify(publicKey, signature, 'hex');
}

// Verificar certificado
app.post('/api/verify-certificate', (req, res) => {
  const { certificate, signature, artworkId } = req.body;
  
  db.get('SELECT public_key FROM users WHERE id = ?', [sellerId], (err, seller) => {
    const isValid = crypto.verifySignature(
      JSON.stringify(certificate),
      signature,
      seller.public_key
    );
    
    res.json({ 
      valid: isValid,
      message: isValid ? '✓ Firma válida' : '✗ Firma inválida'
    });
  });
});
```

**Estructura del Certificado:**

```json
{
  "artwork_id": 1,
  "artwork_title": "Paisaje Digital Futurista",
  "buyer": "comprador",
  "seller": "Ana Torres",
  "price": 150.00,
  "date": "2025-11-23T12:30:00.000Z"
}
```

✅ **Verificación:** La firma garantiza que el vendedor autorizó la transferencia y no puede negarla (no repudio)

---

### 4️⃣ CAPA 4: Cifrado Híbrido (Defensa en Profundidad)

**Objetivo:** Proteger la comunicación de datos sensibles entre cliente y servidor.

**Implementación:**
- **Cifrado asimétrico:** RSA-2048 (para cifrar la llave simétrica)
- **Cifrado simétrico:** AES-256-CBC (para cifrar los datos)
- Combina la seguridad de RSA con la velocidad de AES
- Llave AES temporal única por operación

**Flujo Cliente → Servidor (Pago):**

```javascript
// CLIENTE: Cifrado híbrido en el navegador
async function hybridEncryptClient(data, recipientPublicKeyPem) {
  // 1. Generar clave simétrica temporal (256 bits)
  const symmetricKey = await window.crypto.subtle.generateKey(
    { name: 'AES-CBC', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  
  // 2. Generar IV aleatorio (128 bits)
  const iv = window.crypto.getRandomValues(new Uint8Array(16));
  
  // 3. Cifrar datos con AES-256-CBC
  const encoder = new TextEncoder();
  const encodedData = encoder.encode(data);
  const encryptedData = await window.crypto.subtle.encrypt(
    { name: 'AES-CBC', iv: iv },
    symmetricKey,
    encodedData
  );
  
  // 4. Exportar clave simétrica a formato raw
  const exportedKey = await window.crypto.subtle.exportKey('raw', symmetricKey);
  
  // 5. Cifrar llave AES con RSA público del servidor
  const publicKey = await importPublicKey(recipientPublicKeyPem);
  const encryptedKey = await window.crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    publicKey,
    exportedKey
  );
  
  // 6. Empaquetar todo
  return {
    encryptedData: arrayBufferToHex(encryptedData),  // Datos cifrados con AES
    encryptedKey: arrayBufferToBase64(encryptedKey), // Llave AES cifrada con RSA
    iv: arrayBufferToHex(iv)                         // IV para descifrar
  };
}
```

```javascript
// SERVIDOR: Descifrado híbrido
function hybridDecrypt(package, privateKey) {
  // 1. Descifrar llave AES con RSA privado
  const symmetricKey = crypto.privateDecrypt(
    {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256'
    },
    Buffer.from(package.encryptedKey, 'base64')
  );
  
  // 2. Descifrar datos con llave AES recuperada
  const iv = Buffer.from(package.iv, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', symmetricKey, iv);
  
  let decrypted = decipher.update(package.encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

**Uso en el servidor:**

```javascript
app.post('/api/purchase', (req, res) => {
  const { artworkId, encryptedPayment } = req.body;
  
  // Obtener llave privada del usuario
  db.get('SELECT private_key FROM users WHERE id = ?', 
    [req.session.userId], (err, user) => {
    
    // Descifrar datos de pago con cifrado híbrido
    const paymentData = crypto.hybridDecrypt(
      encryptedPayment, 
      user.private_key
    );
    
    const payment = JSON.parse(paymentData);
    console.log('💳 Pago descifrado:', payment);
    
    // Procesar pago...
  });
});
```

**Flujo Servidor → Cliente (Descarga):**

```javascript
// SERVIDOR: Preparar archivo para descarga segura
app.get('/api/download/:token', (req, res) => {
  // 1. Obtener y descifrar archivo de la BD (AES)
  const decryptedFile = crypto.decryptFile(transaction.file_encrypted);
  
  // 2. Cifrar con híbrido para transmisión
  db.get('SELECT public_key FROM users WHERE id = ?', 
    [buyerId], (err, buyer) => {
    
    const encryptedPackage = crypto.hybridEncrypt(
      decryptedFile,
      buyer.public_key  // RSA público del comprador
    );
    
    res.json({
      success: true,
      filename: 'artwork_HIGH_RES.jpg',
      encryptedPackage: encryptedPackage
    });
  });
});
```

**Diagrama de Flujo:**

```
CLIENTE                          SERVIDOR
  │                                │
  │  1. Generar KS temporal (AES)  │
  │  2. Generar IV aleatorio       │
  │  3. Cifrar datos con AES       │
  │  4. Cifrar KS con RSA público  │
  │                                │
  │  5. Enviar paquete híbrido     │
  │     {encryptedData,            │
  │      encryptedKey,             │
  │      iv}                       │
  ├──────────────────────────────>│
  │                                │
  │                                │  6. Descifrar KS con RSA privado
  │                                │  7. Descifrar datos con KS (AES)
  │                                │  8. Procesar datos originales
  │                                │
  │  9. Respuesta cifrada          │
  │<──────────────────────────────┤
  │                                │
 10. Descifrar localmente          │
```

✅ **Verificación:** Solo el destinatario puede descifrar con su llave privada RSA

---

## 🛠️ Stack Tecnológico

### Backend
- **Node.js** - Entorno de ejecución JavaScript
- **Express** - Framework web minimalista
- **SQLite3** - Base de datos embebida
- **bcrypt** - Hashing de contraseñas
- **crypto (nativo)** - AES-256, RSA-2048, SHA-256
- **express-session** - Gestión de sesiones
- **body-parser** - Parseo de JSON

### Frontend
- **HTML5** - Estructura
- **CSS3** - Estilos y animaciones
- **JavaScript (Vanilla)** - Lógica del cliente
- **Web Crypto API** - Operaciones criptográficas en el navegador

### Seguridad
- **bcrypt** - Hashing de contraseñas (10 rounds)
- **AES-256-CBC** - Cifrado simétrico
- **RSA-2048** - Cifrado asimétrico y firmas digitales
- **SHA-256** - Función hash criptográfica
- **scrypt** - Derivación de llaves (PBKDF)

---

## 📦 Instalación

### Prerrequisitos
- Node.js 14+ y npm

### Paso 1: Clonar el repositorio

```bash
git clone <tu-repositorio>
cd art-marketplace
```

### Paso 2: Instalar dependencias

```bash
npm install
```

Esto instalará:
- express
- sqlite3
- bcrypt
- body-parser
- express-session
- cors

### Paso 3: Inicializar la base de datos

```bash
npm run init-db
```

Este comando:
- Crea las tablas necesarias
- Genera usuarios de prueba con contraseñas hasheadas
- Genera pares de llaves RSA para cada usuario
- Crea obras de arte con archivos cifrados con AES-256
- Inserta datos de demostración

**Salida esperada:**

```
✅ Conectado a SQLite
✅ Tablas creadas
✅ Usuario comprador creado:
   Usuario: comprador
   Password: comprador123
✅ Obras de arte creadas con archivos cifrados (AES-256)
✅ Inicialización completada. Ejecuta: npm start
```

---

## 🚀 Uso

### Iniciar el servidor

```bash
npm start
```

**Salida esperada:**

```
🚀 Servidor ejecutándose en http://localhost:3000
📁 Base de datos: ./marketplace.db

🔐 SEGURIDAD IMPLEMENTADA:
   ✓ Login con bcrypt (hash de contraseñas)
   ✓ Cifrado Simétrico (AES-256) para datos bancarios y archivos
   ✓ Firma Digital (RSA) para certificados de propiedad
   ✓ Cifrado Híbrido (RSA+AES) para comunicación segura
```

### Acceder a la aplicación

Abre tu navegador y ve a:
```
http://localhost:3000
```

### Usuarios de Prueba

**Comprador:**
```
Usuario: comprador
Password: comprador123
Rol: buyer
```

**Vendedor:**
```
Usuario: vendedor
Password: vendedor123
Rol: seller
```

---

## 🧪 Demostraciones

### 1. Verificar Hashes de Contraseñas (CAPA 1)

**En la terminal:**

```bash
sqlite3 marketplace.db
SELECT username, password_hash FROM users;
```

**Resultado:**

```
<img width="1421" height="415" alt="image" src="https://github.com/user-attachments/assets/182e777a-d806-45f6-822f-f58bff452c63" />

comprador|$2b$10$rZX7GqHkF3qJt9Sw5Lv8XeN...
vendedor|$2b$10$hT9Kp2Lm8Nq1Rr7Ss4Vv9Ww...
```

✅ **Verificación:** 
- El hash comienza con `$2b$10$` (bcrypt con 10 rounds)
- Cada hash es único (diferentes salts)
- Imposible revertir a la contraseña original

---

### 2. Ver Datos Cifrados en BD (CAPA 2)

**En SQLite:**

```sql
SELECT payment_info_encrypted FROM transactions LIMIT 1;
```

**Resultado:**

```
<img width="1364" height="330" alt="image" src="https://github.com/user-attachments/assets/b12c8423-e19b-45b0-ba92-54e384e486a8" />

```

✅ **Verificación:** 
- Formato: `IV:DatosCifrados`
- Completamente ilegible sin la llave maestra
- IV diferente en cada registro

**Ver archivos cifrados:**

```sql
SELECT title, file_encrypted FROM artworks LIMIT 1;
```
<img width="1363" height="461" alt="image" src="https://github.com/user-attachments/assets/70550540-e6eb-49f9-abb5-23e2c35bcd46" />

---

### 3. Verificar Firmas Digitales (CAPA 3)

**Flujo en la aplicación:**

1. Realiza una compra de arte
2. Observa el certificado generado
3. Verifica la firma digital

**En la consola del navegador (F12):**

```javascript
// Después de completar una compra
console.log('Certificado:', currentTransaction.certificate);
console.log('Firma:', currentTransaction.signature);
```

**Verificar firma manualmente:**

```bash
# En Node.js REPL
node
> const crypto = require('./crypto-utils');
> const cert = '{"artwork_id":1,"buyer":"comprador"...}';
> const signature = 'a1b2c3d4...';
> const publicKey = '-----BEGIN PUBLIC KEY-----...';
> crypto.verifySignature(cert, signature, publicKey);
true  // ✓ Firma válida

<img width="833" height="829" alt="Screenshot 2025-11-23 022556" src="https://github.com/user-attachments/assets/3ba7b301-9558-4c27-8094-e0708d4d5a32" />

```

✅ **Verificación:**
- La firma es única para cada certificado
- Solo puede ser generada con la llave privada
- Cualquiera puede verificarla con la llave pública
- Garantiza no repudio

---

### 4. Probar Cifrado Híbrido (CAPA 4)

**Flujo de prueba:**

1. **Inicia sesión** como comprador
2. **Selecciona** una obra de arte
3. **Ingresa** datos de pago
4. **Abre DevTools** (F12) → Console
5. **Click** en "Pagar con Seguridad"

**Salida en Console:**

```
🔐 Cifrando datos de pago con cifrado híbrido...
   1. Generada llave AES temporal: <CryptoKey>
   2. IV aleatorio generado: Uint8Array(16)
   3. Datos cifrados con AES-256-CBC
   4. Llave AES cifrada con RSA público
✅ Datos cifrados. Enviando al servidor...
```

**En el servidor (terminal):**

```
💳 Pago recibido (datos descifrados): {
  cardNumber: '1234 5678 9012 3456',
  expiry: '12/25',
  cvv: '123',
  cardName: 'JUAN PEREZ',
  amount: 150
}
```

**Proceso de descarga:**

6. **Click** en "Descargar Archivo de Alta Resolución"
7. **Observa** la console

```
📦 Archivo recibido con cifrado híbrido
🔓 Descifrado en el navegador:
   1. Llave AES descifrada con RSA privado
   2. Archivo descifrado con llave AES
✅ Archivo original recuperado
```

✅ **Verificación:**
- Los datos viajan cifrados en ambas direcciones
- Solo el destinatario puede descifrar
- Cada operación usa llaves temporales únicas

<img width="926" height="841" alt="Screenshot 2025-11-23 022608" src="https://github.com/user-attachments/assets/f27240ed-627c-4c5b-8432-f7220734a11d" />

---

## 📁 Estructura del Proyecto

```
art-marketplace/
│
├── public/
│   └── index.html              # Frontend completo (HTML + CSS + JS)
│
├── crypto-utils.js             # Módulo de criptografía
│   ├── encryptSymmetric()      # CAPA 2: AES-256
│   ├── decryptSymmetric()
│   ├── generateKeyPair()       # CAPA 3: RSA
│   ├── signData()
│   ├── verifySignature()
│   ├── hybridEncrypt()         # CAPA 4: Híbrido
│   ├── hybridDecrypt()
│   ├── encryptFile()
│   └── decryptFile()
│
├── init-db.js                  # Script de inicialización
│   ├── Crear tablas
│   ├── Generar usuarios
│   ├── Cifrar contraseñas
│   ├── Generar llaves RSA
│   └── Insertar obras cifradas
│
├── server.js                   # Servidor principal
│   ├── /api/login              # CAPA 1: Autenticación
│   ├── /api/artworks           # Listar obras
│   ├── /api/purchase           # CAPA 4: Compra híbrida
│   ├── /api/verify-certificate # CAPA 3: Verificar firma
│   ├── /api/download/:token    # CAPA 4: Descarga híbrida
│   └── /api/logout
│
├── marketplace.db              # Base de datos SQLite
│   ├── users                   # Contraseñas + llaves RSA
│   ├── artworks                # Archivos cifrados
│   └── transactions            # Pagos cifrados + firmas
│
├── package.json                # Dependencias
├── package-lock.json
└── README.md                   # Este archivo
```

---

## 🔑 Endpoints de la API

### Autenticación

#### `POST /api/login`
Autenticar usuario con bcrypt

**Request:**
```json
{
  "username": "comprador",
  "password": "comprador123"
}
```

**Response:**
```json
{
  "success": true,
  "username": "comprador",
  "role": "buyer",
  "publicKey": "-----BEGIN PUBLIC KEY-----\nMIIBIjAN..."
}
```

---

#### `POST /api/logout`
Cerrar sesión

**Response:**
```json
{
  "success": true
}
```

---

### Obras de Arte

#### `GET /api/artworks`
Listar obras disponibles (requiere autenticación)

**Response:**
```json
[
  {
    "id": 1,
    "title": "Paisaje Digital Futurista",
    "artist": "Ana Torres",
    "price": 150.00,
    "description": "Arte digital abstracto...",
    "image_url": "https://picsum.photos/...",
    "available": 1
  }
]
```

---

### Compras

#### `POST /api/purchase`
Realizar compra con cifrado híbrido (requiere autenticación)

**Request:**
```json
{
  "artworkId": 1,
  "encryptedPayment": {
    "encryptedData": "a1b2c3d4...",
    "encryptedKey": "MIIBIjAN...",
    "iv": "0123456789abcdef..."
  }
}
```

**Response:**
```json
{
  "success": true,
  "transactionId": 1,
  "certificate": {
    "artwork_id": 1,
    "artwork_title": "Paisaje Digital Futurista",
    "buyer": "comprador",
    "seller": "Ana Torres",
    "price": 150.00,
    "date": "2025-11-23T12:30:00.000Z"
  },
  "signature": "a1b2c3d4e5f6...",
  "downloadToken": "abc123..."
}
```

---

### Certificados

#### `POST /api/verify-certificate`
Verificar firma digital de un certificado

**Request:**
```json
{
  "certificate": {
    "artwork_id": 1,
    "buyer": "comprador",
    ...
  },
  "signature": "a1b2c3d4...",
  "artworkId": 1
}
```

**Response:**
```json
{
  "valid": true,
  "message": "Certificado válido ✓"
}
```

---

### Descargas

#### `GET /api/download/:token`
Descargar archivo con cifrado híbrido (requiere autenticación)

**Response:**
```json
{
  "success": true,
  "filename": "Paisaje_Digital_HIGH_RES.jpg",
  "encryptedPackage": {
    "encryptedData": "...",
    "encryptedKey": "...",
    "iv": "..."
  }
}
```

---

## 🎓 Conceptos Clave Implementados

### Defensa en Profundidad
- **4 capas independientes** de seguridad
- Si una capa falla, las demás siguen protegiendo
- Cada capa cumple un propósito específico
- Múltiples barreras para atacantes

### No Repudio (Capa 3)
- Las firmas digitales RSA garantizan que el vendedor no puede negar haber firmado
- Los datos no pueden ser alterados sin invalidar la firma
- Prueba legal de la transacción

### Confidencialidad
- **Capa 1:** Contraseñas protegidas con bcrypt
- **Capa 2:** Datos en reposo protegidos con AES-256
- **Capa 4:** Comunicación protegida con híbrido RSA+AES

### Integridad
- **SHA-256:** Hashes de certificados
- **RSA:** Firmas digitales
- Detección automática de modificaciones

---

**🔐 Digital Rights Marketplace - Seguridad Criptográfica Multicapa** © 2025
