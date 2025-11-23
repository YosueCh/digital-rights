const crypto = require('crypto');

// === CIFRADO SIMÉTRICO (AES-256-CBC) ===
// Llave maestra y IV seguros (EN PRODUCCIÓN: usar variables de entorno)
const MASTER_KEY = crypto.scryptSync('mi_password_secreto_super_seguro', 'salt', 32);
const IV_LENGTH = 16;

// Cifrar datos sensibles (datos bancarios, archivos)
function encryptSymmetric(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', MASTER_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  // Retornar IV + datos cifrados
  return iv.toString('hex') + ':' + encrypted;
}

// Descifrar datos
function decryptSymmetric(encryptedData) {
  const parts = encryptedData.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const decipher = crypto.createDecipheriv('aes-256-cbc', MASTER_KEY, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// === FIRMA DIGITAL (RSA) ===
// Generar par de llaves RSA para firma digital
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

// Firmar certificado de transferencia
function signData(data, privateKey) {
  const sign = crypto.createSign('SHA256');
  sign.update(data);
  sign.end();
  return sign.sign(privateKey, 'hex');
}

// Verificar firma
function verifySignature(data, signature, publicKey) {
  const verify = crypto.createVerify('SHA256');
  verify.update(data);
  verify.end();
  return verify.verify(publicKey, signature, 'hex');
}

// === CIFRADO HÍBRIDO (RSA + AES) ===
// Cliente: Cifrar mensaje con clave simétrica temporal y cifrar la clave con RSA
function hybridEncrypt(data, recipientPublicKey) {
  // 1. Generar clave simétrica temporal (KS)
  const symmetricKey = crypto.randomBytes(32);
  const iv = crypto.randomBytes(IV_LENGTH);
  
  // 2. Cifrar datos con AES usando KS
  const cipher = crypto.createCipheriv('aes-256-cbc', symmetricKey, iv);
  let encryptedData = cipher.update(data, 'utf8', 'hex');
  encryptedData += cipher.final('hex');
  
  // 3. Cifrar KS con clave pública RSA del receptor
  const encryptedKey = crypto.publicEncrypt(
    {
      key: recipientPublicKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256'
    },
    symmetricKey
  );
  
  // 4. Empaquetar todo
  return {
    encryptedData: encryptedData,
    encryptedKey: encryptedKey.toString('base64'),
    iv: iv.toString('hex')
  };
}

// Servidor: Descifrar paquete híbrido
function hybridDecrypt(package, privateKey) {
  // 1. Descifrar KS con clave privada RSA
  const symmetricKey = crypto.privateDecrypt(
    {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256'
    },
    Buffer.from(package.encryptedKey, 'base64')
  );
  
  // 2. Descifrar datos con KS
  const iv = Buffer.from(package.iv, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', symmetricKey, iv);
  let decrypted = decipher.update(package.encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// Cifrar archivo (simular alta resolución)
function encryptFile(fileContent) {
  return encryptSymmetric(fileContent);
}

// Descifrar archivo
function decryptFile(encryptedFile) {
  return decryptSymmetric(encryptedFile);
}

module.exports = {
  encryptSymmetric,
  decryptSymmetric,
  generateKeyPair,
  signData,
  verifySignature,
  hybridEncrypt,
  hybridDecrypt,
  encryptFile,
  decryptFile
};