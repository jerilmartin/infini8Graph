import CryptoJS from 'crypto-js';
import dotenv from 'dotenv';

dotenv.config();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY is not defined in environment variables');
}

/**
 * Encrypt a string using AES encryption
 * @param {string} text - The text to encrypt
 * @returns {string} - The encrypted text
 */
export function encrypt(text) {
    if (!text) return null;
    return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
}

/**
 * Decrypt an AES encrypted string
 * @param {string} encryptedText - The encrypted text
 * @returns {string} - The decrypted text
 */
export function decrypt(encryptedText) {
    if (!encryptedText) return null;
    const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
}

export default { encrypt, decrypt };
