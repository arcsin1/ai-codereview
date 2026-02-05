import * as crypto from 'crypto';

/**
 * Encryption Algorithm Enum
 */
export enum EncryptionAlgorithm {
  AES_256_CBC = 'aes-256-cbc',
  AES_256_GCM = 'aes-256-gcm',
  AES_192_CBC = 'aes-192-cbc',
  AES_128_CBC = 'aes-128-cbc',
}

/**
 * Hash Algorithm Enum
 */
export enum HashAlgorithm {
  SHA256 = 'sha256',
  SHA512 = 'sha512',
  MD5 = 'md5',
  SHA1 = 'sha1',
}

/**
 * Crypto Utility Class
 * Provides encryption, decryption, hashing, and other functions
 */
export class CryptoUtil {
  private static readonly DEFAULT_ALGORITHM = EncryptionAlgorithm.AES_256_CBC;
  private static readonly DEFAULT_HASH_ALGORITHM = HashAlgorithm.SHA256;
  private static readonly IV_LENGTH = 16;
  private static readonly SALT_LENGTH = 32;
  private static readonly AUTH_TAG_LENGTH = 16;

  /**
   * Generate random key
   *
   * @param bytes - Key byte count (default 32 bytes = 256 bits)
   * @returns Key in hex format
   */
  static generateKey(bytes: number = 32): string {
    return crypto.randomBytes(bytes).toString('hex');
  }

  /**
   * Generate random IV (initialization vector)
   *
   * @param length - IV byte count
   * @returns IV in hex format
   */
  static generateIV(length: number = this.IV_LENGTH): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate random salt
   *
   * @param length - Salt byte count
   * @returns Salt in hex format
   */
  static generateSalt(length: number = this.SALT_LENGTH): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Encrypt text
   *
   * @param text - Text to encrypt
   * @param key - Encryption key (hex)
   * @param algorithm - Encryption algorithm (default AES-256-CBC)
   * @returns Object containing IV and encrypted data
   */
  static encrypt(
    text: string,
    key: string,
    algorithm: EncryptionAlgorithm = this.DEFAULT_ALGORITHM,
  ): { iv: string; encrypted: string; authTag?: string } {
    const iv = crypto.randomBytes(this.IV_LENGTH);
    const keyBuffer = Buffer.from(key, 'hex');

    const cipher = crypto.createCipheriv(algorithm, keyBuffer, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const result: { iv: string; encrypted: string; authTag?: string } = {
      iv: iv.toString('hex'),
      encrypted,
    };

    // Extract auth tag for GCM mode
    if (algorithm === EncryptionAlgorithm.AES_256_GCM) {
      const authTag = (cipher as any).getAuthTag();
      result.authTag = authTag.toString('hex');
    }

    return result;
  }

  /**
   * Decrypt text
   *
   * @param encryptedData - Encrypted data object
   * @param key - Decryption key (hex)
   * @param algorithm - Encryption algorithm (default AES-256-CBC)
   * @returns Decrypted text
   */
  static decrypt(
    encryptedData: { iv: string; encrypted: string; authTag?: string },
    key: string,
    algorithm: EncryptionAlgorithm = this.DEFAULT_ALGORITHM,
  ): string {
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const keyBuffer = Buffer.from(key, 'hex');

    const decipher = crypto.createDecipheriv(algorithm, keyBuffer, iv);

    // Set auth tag for GCM mode
    if (algorithm === EncryptionAlgorithm.AES_256_GCM && encryptedData.authTag) {
      const authTag = Buffer.from(encryptedData.authTag, 'hex');
      (decipher as any).setAuthTag(authTag);
    }

    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Calculate hash value
   *
   * @param data - Data to hash
   * @param algorithm - Hash algorithm (default SHA256)
   * @returns Hash value in hex format
   */
  static hash(
    data: string,
    algorithm: HashAlgorithm = this.DEFAULT_HASH_ALGORITHM,
  ): string {
    return crypto.createHash(algorithm).update(data).digest('hex');
  }

  /**
   * Calculate hash with salt
   *
   * @param data - Data to hash
   * @param salt - Salt (hex)
   * @param algorithm - Hash algorithm
   * @returns Hash value in hex format
   */
  static hashWithSalt(
    data: string,
    salt: string,
    algorithm: HashAlgorithm = this.DEFAULT_HASH_ALGORITHM,
  ): string {
    return crypto
      .createHmac(algorithm, salt)
      .update(data)
      .digest('hex');
  }

  /**
   * Calculate file hash value
   *
   * @param filePath - File path
   * @param algorithm - Hash algorithm
   * @returns Promise<Hash value in hex format>
   */
  static async hashFile(
    filePath: string,
    algorithm: HashAlgorithm = this.DEFAULT_HASH_ALGORITHM,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash(algorithm);
      const stream = require('fs').createReadStream(filePath);

      stream.on('data', (data: Buffer) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  /**
   * Compare hash values (timing-safe)
   *
   * @param hash1 - Hash value 1
   * @param hash2 - Hash value 2
   * @returns Whether they match
   */
  static compareHash(hash1: string, hash2: string): boolean {
    return crypto.timingSafeEqual(Buffer.from(hash1), Buffer.from(hash2));
  }

  /**
   * Generate HMAC signature
   *
   * @param data - Data to sign
   * @param secret - Secret key
   * @param algorithm - Hash algorithm (default SHA256)
   * @returns Signature in hex format
   */
  static signHMAC(
    data: string,
    secret: string,
    algorithm: HashAlgorithm = this.DEFAULT_HASH_ALGORITHM,
  ): string {
    return crypto.createHmac(algorithm, secret).update(data).digest('hex');
  }

  /**
   * Verify HMAC signature
   *
   * @param data - Original data
   * @param signature - Signature
   * @param secret - Secret key
   * @param algorithm - Hash algorithm
   * @returns Whether valid
   */
  static verifyHMAC(
    data: string,
    signature: string,
    secret: string,
    algorithm: HashAlgorithm = this.DEFAULT_HASH_ALGORITHM,
  ): boolean {
    const expectedSignature = this.signHMAC(data, secret, algorithm);
    return this.compareHash(expectedSignature, signature);
  }

  /**
   * Generate PBKDF2 key derivation
   *
   * @param password - Password
   * @param salt - Salt
   * @param iterations - Number of iterations
   * @param keyLength - Key length in bytes
   * @param digest - Digest algorithm
   * @returns Promise<Derived key>
   */
  static deriveKeyPBKDF2(
    password: string,
    salt: string,
    iterations: number = 10000,
    keyLength: number = 32,
    digest: string = 'sha256',
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(
        password,
        salt,
        iterations,
        keyLength,
        digest,
        (err, derivedKey) => {
          if (err) reject(err);
          else resolve(derivedKey.toString('hex'));
        },
      );
    });
  }

  /**
   * Generate random string
   *
   * @param length - String length
   * @param charset - Character set (default alphanumeric)
   * @returns Random string
   */
  static randomString(
    length: number = 16,
    charset: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  ): string {
    let result = '';
    const randomValues = crypto.randomBytes(length);

    for (let i = 0; i < length; i++) {
      result += charset.charAt(randomValues[i] % charset.length);
    }

    return result;
  }

  /**
   * Generate UUID v4
   *
   * @returns UUID string
   */
  static generateUUID(): string {
    return crypto.randomBytes(16).toString('hex').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
  }

  /**
   * Base64 encode
   *
   * @param text - Text to encode
   * @returns Base64 encoded string
   */
  static base64Encode(text: string): string {
    return Buffer.from(text).toString('base64');
  }

  /**
   * Base64 decode
   *
   * @param encoded - Base64 encoded string
   * @returns Decoded text
   */
  static base64Decode(encoded: string): string {
    return Buffer.from(encoded, 'base64').toString('utf-8');
  }

  /**
   * URL-safe Base64 encode
   *
   * @param text - Text to encode
   * @returns URL-safe Base64 encoded string
   */
  static base64URLEncode(text: string): string {
    return this.base64Encode(text)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * URL-safe Base64 decode
   *
   * @param encoded - URL-safe Base64 encoded string
   * @returns Decoded text
   */
  static base64URLDecode(encoded: string): string {
    let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');

    // Add padding
    while (base64.length % 4) {
      base64 += '=';
    }

    return this.base64Decode(base64);
  }

  /**
   * Calculate checksum for data
   *
   * @param data - Data
   * @returns Hex checksum
   */
  static checksum(data: string): string {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data.charCodeAt(i);
    }
    return sum.toString(16).padStart(8, '0');
  }

  /**
   * Mask sensitive information
   *
   * @param value - Sensitive information
   * @param visibleChars - Number of visible characters to keep at start and end
   * @param maskChar - Mask character
   * @returns Masked string
   */
  static mask(
    value: string,
    visibleChars: number = 4,
    maskChar: string = '*',
  ): string {
    if (value.length <= visibleChars * 2) {
      return maskChar.repeat(value.length);
    }

    const start = value.substring(0, visibleChars);
    const end = value.substring(value.length - visibleChars);
    const masked = maskChar.repeat(value.length - visibleChars * 2);

    return start + masked + end;
  }

  /**
   * Safely compare two strings (timing-safe)
   *
   * @param a - String 1
   * @param b - String 2
   * @returns Whether equal
   */
  static safeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  }
}

/**
 * Password Utility Class
 * Specifically for password hashing and verification
 */
export class PasswordUtil {
  private static readonly SALT_LENGTH = 32;
  private static readonly ITERATIONS = 10000;
  private static readonly KEY_LENGTH = 64;
  private static readonly DIGEST = 'sha512';

  /**
   * Hash password
   *
   * @param password - Plain text password
   * @returns Promise<Object containing salt and hash>
   */
  static async hashPassword(password: string): Promise<{
    hash: string;
    salt: string;
  }> {
    const salt = CryptoUtil.generateSalt(this.SALT_LENGTH);
    const hash = await CryptoUtil.deriveKeyPBKDF2(
      password,
      salt,
      this.ITERATIONS,
      this.KEY_LENGTH,
      this.DIGEST,
    );

    return { hash, salt };
  }

  /**
   * Verify password
   *
   * @param password - Plain text password
   * @param hash - Stored hash value
   * @param salt - Salt value
   * @returns Promise<Whether match>
   */
  static async verifyPassword(
    password: string,
    hash: string,
    salt: string,
  ): Promise<boolean> {
    const derivedHash = await CryptoUtil.deriveKeyPBKDF2(
      password,
      salt,
      this.ITERATIONS,
      this.KEY_LENGTH,
      this.DIGEST,
    );

    return CryptoUtil.compareHash(derivedHash, hash);
  }

  /**
   * Generate strong password
   *
   * @param length - Password length (default 16)
   * @param options - Options
   * @returns Random strong password
   */
  static generateStrongPassword(
    length: number = 16,
    options: {
      includeUppercase?: boolean;
      includeLowercase?: boolean;
      includeNumbers?: boolean;
      includeSymbols?: boolean;
    } = {},
  ): string {
    const {
      includeUppercase = true,
      includeLowercase = true,
      includeNumbers = true,
      includeSymbols = true,
    } = options;

    let charset = '';
    if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (includeNumbers) charset += '0123456789';
    if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (charset === '') {
      throw new Error('At least one character type must be included');
    }

    return CryptoUtil.randomString(length, charset);
  }

  /**
   * Evaluate password strength
   *
   * @param password - Password
   * @returns Strength score (0-100) and suggestions
   */
  static evaluatePasswordStrength(password: string): {
    score: number;
    strength: 'weak' | 'fair' | 'good' | 'strong';
    suggestions: string[];
  } {
    let score = 0;
    const suggestions: string[] = [];

    // Length check
    if (password.length >= 8) score += 20;
    else suggestions.push('Password should be at least 8 characters long');

    if (password.length >= 12) score += 10;

    // Contains lowercase letters
    if (/[a-z]/.test(password)) score += 15;
    else suggestions.push('Include lowercase letters');

    // Contains uppercase letters
    if (/[A-Z]/.test(password)) score += 15;
    else suggestions.push('Include uppercase letters');

    // Contains numbers
    if (/[0-9]/.test(password)) score += 15;
    else suggestions.push('Include numbers');

    // Contains special characters
    if (/[^a-zA-Z0-9]/.test(password)) score += 15;
    else suggestions.push('Include special characters');

    // Bonus points
    if (password.length >= 16) score += 10;

    // Cap score at 100
    score = Math.min(score, 100);

    // Determine strength level
    let strength: 'weak' | 'fair' | 'good' | 'strong';
    if (score < 40) strength = 'weak';
    else if (score < 60) strength = 'fair';
    else if (score < 80) strength = 'good';
    else strength = 'strong';

    return { score, strength, suggestions };
  }
}
