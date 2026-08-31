import { randomBytes, scrypt } from 'node:crypto';

const config = {
  N: 16384,
  r: 16,
  p: 1,
  dkLen: 64,
};

function generateKey(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(
      password.normalize('NFKC'),
      salt,
      config.dkLen,
      {
        N: config.N,
        r: config.r,
        p: config.p,
        maxmem: 128 * config.N * config.r * 2,
      },
      (err, key) => {
        if (err) reject(err);
        else resolve(key);
      }
    );
  });
}

/**
 * Hashes a plaintext password into standard Better Auth scrypt format: `<salt>:<derivedKeyHex>`
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const key = await generateKey(password, salt);
  return `${salt}:${key.toString('hex')}`;
}

/**
 * Verifies a plaintext password against a Better Auth scrypt formatted hash.
 */
export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  const [salt, key] = hash.split(':');
  if (!salt || !key) return false;
  const derivedKey = await generateKey(password, salt);
  return derivedKey.toString('hex') === key;
}
