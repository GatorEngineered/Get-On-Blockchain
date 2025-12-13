// src/lib/crypto/encryption.ts
import crypto from 'crypto';

/**
 * Encrypt sensitive data (like private keys) using AES-256-GCM
 *
 * IMPORTANT: Set ENCRYPTION_KEY in environment variables
 * Generate one with: openssl rand -hex 32
 */
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const TAG_POSITION = SALT_LENGTH + IV_LENGTH;
const ENCRYPTED_POSITION = TAG_POSITION + TAG_LENGTH;

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error(
      'ENCRYPTION_KEY not set in environment variables. Generate one with: openssl rand -hex 32'
    );
  }

  return Buffer.from(key, 'hex');
}

/**
 * Encrypt a string (like a private key)
 *
 * @param plaintext - The text to encrypt (e.g., "0x1234...")
 * @returns Encrypted string in hex format
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  return Buffer.concat([salt, iv, tag, encrypted]).toString('hex');
}

/**
 * Decrypt an encrypted string
 *
 * @param ciphertext - The encrypted hex string
 * @returns Decrypted plaintext
 */
export function decrypt(ciphertext: string): string {
  const key = getEncryptionKey();
  const stringValue = Buffer.from(ciphertext, 'hex');

  const salt = stringValue.subarray(0, SALT_LENGTH);
  const iv = stringValue.subarray(SALT_LENGTH, TAG_POSITION);
  const tag = stringValue.subarray(TAG_POSITION, ENCRYPTED_POSITION);
  const encrypted = stringValue.subarray(ENCRYPTED_POSITION);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

/**
 * Hash a value (one-way, for verification only)
 *
 * Useful for storing wallet addresses or checksums
 */
export function hash(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

/**
 * Validate that encryption key is properly formatted
 *
 * @returns true if encryption key is valid, false otherwise
 */
export function validateEncryptionKey(): boolean {
  try {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) return false;

    // Key should be 64 hex characters (32 bytes)
    if (key.length !== 64) return false;

    // Test that it's valid hex
    Buffer.from(key, 'hex');
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely encrypt data with error handling
 *
 * @param plaintext - Text to encrypt
 * @returns Encrypted string or null if encryption fails
 */
export function safeEncrypt(plaintext: string): string | null {
  try {
    if (!validateEncryptionKey()) {
      console.error('Invalid encryption key');
      return null;
    }
    return encrypt(plaintext);
  } catch (error) {
    console.error('Encryption failed:', error);
    return null;
  }
}

/**
 * Safely decrypt data with error handling
 *
 * @param ciphertext - Encrypted text
 * @returns Decrypted string or null if decryption fails
 */
export function safeDecrypt(ciphertext: string): string | null {
  try {
    if (!validateEncryptionKey()) {
      console.error('Invalid encryption key');
      return null;
    }
    return decrypt(ciphertext);
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
}
