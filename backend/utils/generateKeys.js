import { generateKeyPair } from './rsaUtils.js';
import crypto from 'crypto';

console.log('🔑 GENERADOR DE LLAVES PARA DIGITAL RIGHTS\n');
console.log('═══════════════════════════════════════════\n');

// Generar par de llaves RSA
console.log('Generando par de llaves RSA-2048...');
const { publicKey, privateKey } = generateKeyPair();

console.log('\n✅ LLAVES RSA GENERADAS\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\n📌 LLAVE PÚBLICA (compártela):');
console.log(publicKey);
console.log('\n📌 LLAVE PRIVADA (manténla SECRETA):');
console.log(privateKey);
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Generar llave AES master
console.log('Generando llave maestra AES-256...');
const aesKey = crypto.randomBytes(32).toString('hex');

console.log('\n✅ LLAVE AES-256 GENERADA\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\n📌 LLAVE MAESTRA (para archivo .env):');
console.log(`AES_MASTER_KEY=${aesKey}`);
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Generar JWT secret
console.log('Generando secreto JWT...');
const jwtSecret = crypto.randomBytes(32).toString('hex');

console.log('\n✅ JWT SECRET GENERADO\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\n📌 SECRETO JWT (para archivo .env):');
console.log(`JWT_SECRET=${jwtSecret}`);
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('⚠️  IMPORTANTE: Copia estas llaves a tu archivo .env');
console.log('⚠️  NUNCA subas estas llaves a GitHub\n');