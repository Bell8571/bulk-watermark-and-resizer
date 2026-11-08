import { SUPPORTED_FORMATS, MAX_FILE_SIZE_BYTES } from './constants.js';

export function sanitizeInput(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .trim();
}

window.sanitizeInput = sanitizeInput;

export function isValidImageFile(file) {
  if (!file || !file.type) return false;
  return SUPPORTED_FORMATS.includes(file.type);
}

window.isValidImageFile = isValidImageFile;

export function isLightColor(hex) {
  if (typeof hex !== 'string') return true;
  const m = hex.replace('#', '').toLowerCase();
  if (m.length !== 6) return true;
  try {
    const r = parseInt(m.slice(0, 2), 16);
    const g = parseInt(m.slice(2, 4), 16);
    const b = parseInt(m.slice(4, 6), 16);
    return 0.299 * r + 0.587 * g + 0.114 * b > 150;
  } catch {
    return true;
  }
}

export function validateDimensions(width, height) {
  return width >= 100 && width <= 8000 && height >= 100 && height <= 8000;
}

export function isValidHexColor(hex) {
  return /^#[0-9A-Fa-f]{6}$/.test(hex || '');
}

export function validateFileForImport(file) {
  if (!isValidImageFile(file)) return false;
  if (file.size > MAX_FILE_SIZE_BYTES) return false;
  if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) return false;
  return true;
}
