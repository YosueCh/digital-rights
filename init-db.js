const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const crypto = require('./crypto-utils');

const db = new sqlite3.Database('./marketplace.db', (err) => {
  if (err) {
    console.error('❌ Error al conectar a la BD:', err);
  } else {
    console.log('✅ Conectado a SQLite');
  }
});

// Crear tablas
db.serialize(() => {
  // Tabla de usuarios
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    public_key TEXT,
    private_key TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Tabla de obras de arte
  db.run(`CREATE TABLE IF NOT EXISTS artworks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    price REAL NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    file_encrypted TEXT,
    available INTEGER DEFAULT 1,
    seller_id INTEGER,
    FOREIGN KEY (seller_id) REFERENCES users(id)
  )`);

  // Tabla de transacciones
  db.run(`CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    buyer_id INTEGER NOT NULL,
    artwork_id INTEGER NOT NULL,
    payment_info_encrypted TEXT NOT NULL,
    certificate TEXT,
    signature TEXT,
    download_token TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (buyer_id) REFERENCES users(id),
    FOREIGN KEY (artwork_id) REFERENCES artworks(id)
  )`);

  console.log('✅ Tablas creadas');

  // Crear usuario comprador de prueba
  const passwordHash = bcrypt.hashSync('comprador123', 10);
  
  // Generar llaves RSA para el comprador
  const buyerKeys = crypto.generateKeyPair();
  
  db.run(`INSERT OR IGNORE INTO users (username, password_hash, role, public_key, private_key) 
          VALUES (?, ?, ?, ?, ?)`,
    ['comprador', passwordHash, 'buyer', buyerKeys.publicKey, buyerKeys.privateKey],
    (err) => {
      if (err) {
        console.error('Error al crear usuario:', err);
      } else {
        console.log('✅ Usuario comprador creado:');
        console.log('   Usuario: comprador');
        console.log('   Password: comprador123');
      }
    });

  // Crear usuario vendedor
  const sellerKeys = crypto.generateKeyPair();
  db.run(`INSERT OR IGNORE INTO users (username, password_hash, role, public_key, private_key) 
          VALUES (?, ?, ?, ?, ?)`,
    ['vendedor', bcrypt.hashSync('vendedor123', 10), 'seller', sellerKeys.publicKey, sellerKeys.privateKey]);

  // Insertar obras de arte de ejemplo
  const artworks = [
    {
      title: 'Paisaje Digital Futurista',
      artist: 'Ana Torres',
      price: 150.00,
      description: 'Arte digital abstracto con temática futurista',
      image_url: 'https://picsum.photos/seed/art1/400/300',
      file: 'ARCHIVO_ALTA_RESOLUCION_PAISAJE_4K_ORIGINAL_CONTENT...'
    },
    {
      title: 'Retrato Cyberpunk',
      artist: 'Carlos Mendoza',
      price: 200.00,
      description: 'Retrato digital estilo cyberpunk con neones',
      image_url: 'https://picsum.photos/seed/art2/400/300',
      file: 'ARCHIVO_ALTA_RESOLUCION_RETRATO_8K_ORIGINAL_CONTENT...'
    },
    {
      title: 'Abstracto Geométrico',
      artist: 'María López',
      price: 100.00,
      description: 'Composición geométrica minimalista',
      image_url: 'https://picsum.photos/seed/art3/400/300',
      file: 'ARCHIVO_ALTA_RESOLUCION_ABSTRACTO_4K_ORIGINAL_CONTENT...'
    }
  ];

  db.get(`SELECT id FROM users WHERE username = ?`, ['vendedor'], (err, seller) => {
    if (seller) {
      let completed = 0;
      const total = artworks.length;
      
      artworks.forEach(art => {
        // Cifrar archivo de alta resolución (SIMÉTRICO)
        const encryptedFile = crypto.encryptFile(art.file);
        
        db.run(`INSERT OR IGNORE INTO artworks (title, artist, price, description, image_url, file_encrypted, seller_id) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [art.title, art.artist, art.price, art.description, art.image_url, encryptedFile, seller.id],
          (err) => {
            completed++;
            if (completed === total) {
              console.log('✅ Obras de arte creadas con archivos cifrados (AES-256)');
              console.log('✅ Inicialización completada. Ejecuta: npm start');
              db.close();
            }
          });
      });
    } else {
      console.log('✅ Inicialización completada. Ejecuta: npm start');
      db.close();
    }
  });
});