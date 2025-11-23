const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const session = require('express-session');
const bodyParser = require('body-parser');
const crypto = require('./crypto-utils');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Verificar que existe la base de datos
if (!fs.existsSync('./marketplace.db')) {
  console.error('❌ Error: Base de datos no encontrada.');
  console.log('📝 Por favor ejecuta primero: node init-db.js');
  process.exit(1);
}

// Base de datos
const db = new sqlite3.Database('./marketplace.db');

// Middleware
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static('public'));
app.use(session({
  secret: 'mi_secreto_super_seguro_de_sesion',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // En producción: true con HTTPS
}));

// === ENDPOINTS ===

// Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err || !user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }
    
    // Verificar password con bcrypt
    if (!bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }
    
    // Crear sesión
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.role = user.role;
    
    res.json({ 
      success: true, 
      username: user.username,
      role: user.role,
      publicKey: user.public_key
    });
  });
});

// Obtener obras de arte
app.get('/api/artworks', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  
  db.all('SELECT id, title, artist, price, description, image_url, available FROM artworks WHERE available = 1', 
    (err, artworks) => {
      if (err) {
        return res.status(500).json({ error: 'Error al obtener obras' });
      }
      res.json(artworks);
    });
});

// Procesar pago (CIFRADO HÍBRIDO)
app.post('/api/purchase', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  
  const { artworkId, encryptedPayment } = req.body;
  
  // Obtener clave privada del servidor para descifrar
  db.get('SELECT private_key FROM users WHERE id = ?', [req.session.userId], (err, user) => {
    if (err || !user) {
      return res.status(500).json({ error: 'Error al obtener usuario' });
    }
    
    try {
      // Descifrar datos de pago usando CIFRADO HÍBRIDO
      const paymentData = crypto.hybridDecrypt(encryptedPayment, user.private_key);
      const payment = JSON.parse(paymentData);
      
      console.log('💳 Pago recibido (datos descifrados):', payment);
      
      // Cifrar datos bancarios para almacenar (SIMÉTRICO)
      const encryptedPaymentInfo = crypto.encryptSymmetric(JSON.stringify(payment));
      
      // Obtener obra de arte
      db.get('SELECT * FROM artworks WHERE id = ?', [artworkId], (err, artwork) => {
        if (err || !artwork) {
          return res.status(404).json({ error: 'Obra no encontrada' });
        }
        
        // Obtener vendedor para firmar certificado
        db.get('SELECT private_key FROM users WHERE id = ?', [artwork.seller_id], (err, seller) => {
          if (err || !seller) {
            return res.status(500).json({ error: 'Error al obtener vendedor' });
          }
          
          // Crear certificado de transferencia
          const certificate = {
            artwork_id: artwork.id,
            artwork_title: artwork.title,
            buyer: req.session.username,
            seller: artwork.artist,
            price: artwork.price,
            date: new Date().toISOString()
          };
          
          const certificateStr = JSON.stringify(certificate);
          
          // FIRMAR DIGITALMENTE el certificado (RSA)
          const signature = crypto.signData(certificateStr, seller.private_key);
          
          // Generar token de descarga único
          const downloadToken = require('crypto').randomBytes(32).toString('hex');
          
          // Guardar transacción
          db.run(`INSERT INTO transactions (buyer_id, artwork_id, payment_info_encrypted, certificate, signature, download_token)
                  VALUES (?, ?, ?, ?, ?, ?)`,
            [req.session.userId, artworkId, encryptedPaymentInfo, certificateStr, signature, downloadToken],
            function(err) {
              if (err) {
                return res.status(500).json({ error: 'Error al procesar compra' });
              }
              
              // Marcar obra como vendida
              db.run('UPDATE artworks SET available = 0 WHERE id = ?', [artworkId]);
              
              res.json({
                success: true,
                transactionId: this.lastID,
                certificate: certificate,
                signature: signature,
                downloadToken: downloadToken
              });
            });
        });
      });
    } catch (error) {
      console.error('Error al descifrar pago:', error);
      res.status(400).json({ error: 'Error al procesar pago cifrado' });
    }
  });
});

// Verificar certificado
app.post('/api/verify-certificate', (req, res) => {
  const { certificate, signature, artworkId } = req.body;
  
  db.get(`SELECT a.*, u.public_key FROM artworks a 
          JOIN users u ON a.seller_id = u.id 
          WHERE a.id = ?`, [artworkId], (err, artwork) => {
    if (err || !artwork) {
      return res.status(404).json({ error: 'Obra no encontrada' });
    }
    
    // Verificar firma digital
    const isValid = crypto.verifySignature(
      JSON.stringify(certificate), 
      signature, 
      artwork.public_key
    );
    
    res.json({ 
      valid: isValid,
      message: isValid ? 'Certificado válido ✓' : 'Certificado inválido ✗'
    });
  });
});

// Descargar archivo (CIFRADO HÍBRIDO en respuesta)
app.get('/api/download/:token', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  
  const { token } = req.params;
  
  db.get(`SELECT t.*, a.file_encrypted, a.title FROM transactions t
          JOIN artworks a ON t.artwork_id = a.id
          WHERE t.download_token = ? AND t.buyer_id = ?`,
    [token, req.session.userId], (err, transaction) => {
      if (err || !transaction) {
        return res.status(404).json({ error: 'Token inválido o transacción no encontrada' });
      }
      
      // Descifrar archivo (SIMÉTRICO)
      const decryptedFile = crypto.decryptFile(transaction.file_encrypted);
      
      // Obtener clave pública del comprador para cifrado híbrido
      db.get('SELECT public_key FROM users WHERE id = ?', [req.session.userId], (err, user) => {
        if (err || !user) {
          return res.status(500).json({ error: 'Error al obtener usuario' });
        }
        
        // Cifrar archivo con CIFRADO HÍBRIDO para transmisión segura
        const encryptedPackage = crypto.hybridEncrypt(decryptedFile, user.public_key);
        
        res.json({
          success: true,
          filename: `${transaction.title}_HIGH_RES.jpg`,
          encryptedPackage: encryptedPackage
        });
      });
    });
});

// Logout
app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Servir frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
  console.log(`📁 Base de datos: ./marketplace.db`);
  console.log(`\n🔐 SEGURIDAD IMPLEMENTADA:`);
  console.log(`   ✓ Login con bcrypt (hash de contraseñas)`);
  console.log(`   ✓ Cifrado Simétrico (AES-256) para datos bancarios y archivos`);
  console.log(`   ✓ Firma Digital (RSA) para certificados de propiedad`);
  console.log(`   ✓ Cifrado Híbrido (RSA+AES) para comunicación segura`);
});