/**
 * Utilidades de formateo
 */

/**
 * Formatea un precio en USD
 */
export function formatPrice(price) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(price);
}

/**
 * Formatea una fecha
 */
export function formatDate(date) {
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
}

/**
 * Trunca un texto largo
 */
export function truncate(text, maxLength = 50) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Formatea un hash para mostrar
 */
export function formatHash(hash, length = 16) {
  if (!hash) return '';
  if (hash.length <= length) return hash;
  return `${hash.substring(0, length)}...`;
}

/**
 * Oculta parcialmente un número de tarjeta
 */
export function maskCardNumber(cardNumber) {
  if (!cardNumber) return '';
  const cleaned = cardNumber.replace(/\s/g, '');
  if (cleaned.length < 4) return cardNumber;
  return `****-****-****-${cleaned.slice(-4)}`;
}

/**
 * Formatea bytes a tamaño legible
 */
export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Valida formato de email
 */
export function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Valida formato de número de tarjeta
 */
export function isValidCardNumber(cardNumber) {
  const cleaned = cardNumber.replace(/\s/g, '');
  return /^\d{13,19}$/.test(cleaned);
}

/**
 * Copia texto al portapapeles
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Error al copiar:', err);
    return false;
  }
}

export default {
  formatPrice,
  formatDate,
  truncate,
  formatHash,
  maskCardNumber,
  formatBytes,
  isValidEmail,
  isValidCardNumber,
  copyToClipboard
};