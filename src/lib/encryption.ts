import crypto from 'crypto';

// In production, this MUST be set in .env as a long random string.
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default_development_secret_key_32_chars!!!'; 

// Ensure the key is exactly 32 bytes (256 bits) for aes-256-cbc
const normalizedKey = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
const IV_LENGTH = 16; 

export function encrypt(text: string): string {
  if (!text) return text;
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', normalizedKey, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  } catch (e) {
    console.error("Encryption error:", e);
    return text;
  }
}

export function decrypt(text: string): string {
  if (!text || !text.includes(':')) return text;
  try {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', normalizedKey, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (e) {
    console.error("Decryption error:", e);
    return "";
  }
}
