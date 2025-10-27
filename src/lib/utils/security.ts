// =============================================================================
// SECURITY UTILITIES
// =============================================================================
// Security helper functions following OWASP best practices
// For path traversal prevention, IP validation, input sanitization, and password hashing

import path from 'path';
import { randomInt, randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import { logger } from '@/lib/utils/logger';

/**
 * Sanitizes file paths to prevent directory traversal attacks
 * @param filePath - The file path to sanitize
 * @param basePath - The base path that files should be contained within
 * @returns Sanitized path or null if path is invalid
 */
export function sanitizePath(filePath: string, basePath: string): string | null {
  try {
    // Normalize the paths to resolve any '..' or '.' segments
    const normalizedBase = path.normalize(basePath);
    const normalizedPath = path.normalize(filePath);
    
    // Resolve to absolute paths
    const absoluteBase = path.resolve(normalizedBase);
    const absolutePath = path.resolve(normalizedBase, normalizedPath);
    
    // Check if the resolved path is within the base path
    if (!absolutePath.startsWith(absoluteBase)) {
      logger.error(
        '[SECURITY] Path traversal attempt detected',
        { attemptedPath: filePath, basePath }
      );
      return null;
    }
    
    // Return the relative path from the base
    return path.relative(absoluteBase, absolutePath);
  } catch (error) {
    logger.error('Path sanitization error', error, { filePath, basePath });
    return null;
  }
}

/**
 * Validates and extracts client IP from request headers
 * @param headers - Request headers object
 * @returns Validated IP address or null if invalid
 */
export function validateClientIP(headers: Headers | Record<string, string | string[] | undefined>): string | null {
  try {
    // Priority order for IP headers
    const ipHeaders = [
      'x-real-ip',
      'x-forwarded-for',
      'x-client-ip',
      'x-cluster-client-ip',
      'cf-connecting-ip', // Cloudflare
      'fastly-client-ip', // Fastly
      'true-client-ip', // Akamai and Cloudflare Enterprise
      'x-forwarded',
      'forwarded-for',
      'forwarded',
    ];

    let clientIp: string | null = null;

    // Check headers in priority order
    for (const header of ipHeaders) {
      const value = headers instanceof Headers 
        ? headers.get(header)
        : headers[header];
      
      if (value) {
        // Handle comma-separated IPs (common in x-forwarded-for)
        const ip = Array.isArray(value) 
          ? value[0] 
          : value.split(',')[0]?.trim();
        
        if (ip && isValidIP(ip)) {
          clientIp = ip;
          break;
        }
      }
    }

    // If no valid IP found, log warning
    if (!clientIp) {
      logger.warn('No valid client IP found in headers');
      return null;
    }

    return clientIp;
  } catch (error) {
    logger.error('IP validation error', error);
    return null;
  }
}

/**
 * Validates if a string is a valid IP address (IPv4 or IPv6)
 * @param ip - IP address to validate
 * @returns True if valid IP, false otherwise
 */
export function isValidIP(ip: string): boolean {
  if (!ip) return false;

  // IPv4 regex
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  
  // IPv6 regex (simplified)
  const ipv6Regex = /^([\da-fA-F]{1,4}:){7}[\da-fA-F]{1,4}$/;
  
  // Check IPv4
  if (ipv4Regex.test(ip)) {
    const parts = ip.split('.');
    return parts.every(part => {
      const num = parseInt(part, 10);
      return num >= 0 && num <= 255;
    });
  }
  
  // Check IPv6 (basic validation)
  return ipv6Regex.test(ip) || isValidIPv6(ip);
}

/**
 * More comprehensive IPv6 validation
 * @param ip - IP address to validate
 * @returns True if valid IPv6, false otherwise
 */
function isValidIPv6(ip: string): boolean {
  // Handle compressed IPv6 addresses
  if (ip.includes('::')) {
    // Only one :: is allowed
    if ((ip.match(/::/g) || []).length > 1) return false;
    
    // Expand the :: to the appropriate number of zero groups
    const parts = ip.split('::');
    if (parts.length > 2) return false;
    
    const leftParts = parts[0] ? parts[0].split(':') : [];
    const rightParts = parts[1] ? parts[1].split(':') : [];
    const totalParts = leftParts.length + rightParts.length;
    
    // IPv6 should have 8 groups
    if (totalParts > 7) return false;
    
    // Validate each part
    const allParts = [...leftParts, ...rightParts];
    return allParts.every(part => /^[\da-fA-F]{1,4}$/.test(part));
  }
  
  // Standard IPv6 format
  const parts = ip.split(':');
  if (parts.length !== 8) return false;
  
  return parts.every(part => /^[\da-fA-F]{1,4}$/.test(part));
}

/**
 * Sanitizes user ID to prevent injection attacks
 * @param userId - User ID to sanitize
 * @returns Sanitized user ID or null if invalid
 */
export function sanitizeUserId(userId: string | null | undefined): string | null {
  if (!userId) return null;
  
  // Allow alphanumeric, hyphens, and underscores only
  const sanitized = userId.replace(/[^a-zA-Z0-9_-]/g, '');
  
  // Check if sanitization changed the ID
  if (sanitized !== userId) {
    logger.warn(
      '[SECURITY] User ID sanitization required',
      { original: userId, sanitized }
    );
  }
  
  // Ensure reasonable length
  if (sanitized.length > 128) {
    logger.warn(
      '[SECURITY] User ID too long',
      { userId: sanitized.substring(0, 50) + '...' }
    );
    return null;
  }
  
  return sanitized;
}

/**
 * Validates folder ID format and prevents path traversal
 * @param folderId - Folder ID to validate
 * @returns True if valid, false otherwise
 */
export function isValidFolderId(folderId: string | null | undefined): boolean {
  if (!folderId) return true; // Null/undefined is valid (root folder)
  
  // Check for path traversal attempts
  if (folderId.includes('..') || folderId.includes('/') || folderId.includes('\\')) {
    logger.error(
      '[SECURITY] Invalid folder ID detected',
      { folderId }
    );
    return false;
  }
  
  // Validate UUID format (assuming UUID v4)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(folderId);
}

/**
 * Creates a secure hash of sensitive data for logging
 * @param data - Sensitive data to hash
 * @returns Hashed representation safe for logging
 */
export function hashForLogging(data: string): string {
  if (!data) return '[empty]';

  // For logging purposes, we'll use a simple obfuscation
  // In production, consider using a proper hashing algorithm
  const length = data.length;
  const prefix = data.substring(0, 3);
  const suffix = data.substring(Math.max(0, length - 3));

  return `${prefix}***${suffix} (${length} chars)`;
}

// =============================================================================
// INPUT SANITIZATION
// =============================================================================
// Sanitization functions for user inputs to prevent injection and XSS attacks

/**
 * Sanitizes username to prevent injection attacks
 * @param username - Username to sanitize
 * @returns Sanitized username safe for storage and display (preserves case)
 */
export function sanitizeUsername(username: string | null | undefined): string {
  if (!username) return '';

  // Trim whitespace but preserve case for display
  const trimmed = username.trim();

  // Remove all characters except alphanumeric (both cases), hyphens, and underscores
  const sanitized = trimmed.replace(/[^a-zA-Z0-9_-]/g, '');

  // Enforce maximum length of 50 characters
  const limited = sanitized.slice(0, 50);

  // Log warning if sanitization changed the input significantly
  if (limited !== trimmed) {
    logger.warn(
      '[SECURITY] Username sanitization applied',
      { original: hashForLogging(trimmed), sanitized: hashForLogging(limited) }
    );
  }

  return limited;
}

/**
 * Sanitizes email address to prevent injection attacks
 * @param email - Email address to sanitize
 * @returns Sanitized email or empty string if invalid
 */
export function sanitizeEmail(email: string | null | undefined): string {
  if (!email) return '';

  // Trim whitespace
  const trimmed = email.trim().toLowerCase();

  // Basic email format validation (RFC 5322 simplified)
  const emailRegex = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i;

  if (!emailRegex.test(trimmed)) {
    logger.warn(
      '[SECURITY] Invalid email format detected',
      { email: hashForLogging(trimmed) }
    );
    return '';
  }

  // Enforce maximum length (RFC 5321: 320 characters)
  if (trimmed.length > 320) {
    logger.warn(
      '[SECURITY] Email exceeds maximum length',
      { length: trimmed.length }
    );
    return '';
  }

  return trimmed;
}

/**
 * Escapes HTML special characters to prevent XSS attacks
 * @param text - Text to escape
 * @returns HTML-escaped text safe for rendering
 */
export function escapeHtml(text: string | null | undefined): string {
  if (!text) return '';

  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return text.replace(/[&<>"'/]/g, (char) => htmlEscapeMap[char] || char);
}

/**
 * Sanitizes folder/file name to prevent path traversal and injection
 * @param name - Folder or file name to sanitize
 * @returns Sanitized name safe for filesystem operations
 */
export function sanitizeFileName(name: string | null | undefined): string {
  if (!name) return '';

  // Trim whitespace
  const trimmed = name.trim();

  // Remove path separators and special characters
  let sanitized = trimmed
    .replace(/[/\\]/g, '') // Remove path separators
    .replace(/\.\./g, '')   // Remove parent directory references
    .replace(/[<>:"|?*]/g, ''); // Remove Windows-invalid characters

  // Ensure filename doesn't start with a dot (hidden file)
  if (sanitized.startsWith('.')) {
    sanitized = sanitized.substring(1);
  }

  // Enforce maximum length (255 for most filesystems)
  sanitized = sanitized.slice(0, 255);

  // Log if significant changes were made
  if (sanitized !== trimmed) {
    logger.warn(
      '[SECURITY] Filename sanitization applied',
      { original: hashForLogging(trimmed), sanitized: hashForLogging(sanitized) }
    );
  }

  // Return sanitized name or fallback to 'untitled'
  return sanitized || 'untitled';
}

/**
 * Sanitizes link slug to prevent injection and ensure URL compatibility
 * @param slug - Slug to sanitize
 * @returns Sanitized slug safe for URLs (lowercase, alphanumeric, hyphens only)
 */
export function sanitizeSlug(slug: string | null | undefined): string {
  if (!slug) return '';

  // Trim whitespace and convert to lowercase
  const trimmed = slug.trim().toLowerCase();

  // Allow only lowercase alphanumeric characters and hyphens
  const sanitized = trimmed.replace(/[^a-z0-9-]/g, '');

  // Enforce maximum length (100 chars to match schema)
  const limited = sanitized.slice(0, 100);

  // Log warning if sanitization changed the input significantly
  if (limited !== trimmed) {
    logger.warn(
      '[SECURITY] Slug sanitization applied',
      { original: hashForLogging(trimmed), sanitized: hashForLogging(limited) }
    );
  }

  return limited;
}

// =============================================================================
// OTP (ONE-TIME PASSWORD) UTILITIES
// =============================================================================
// Cryptographically secure OTP generation and validation

/**
 * Generates a cryptographically secure 6-digit OTP code
 * Uses Node.js built-in crypto.randomInt() for secure random number generation
 *
 * @returns 6-digit OTP code as string (e.g., "123456", "007823")
 *
 * @example
 * ```typescript
 * const otp = generateSecureOTP();
 * console.log(otp); // "456789"
 *
 * // Store with expiration
 * const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
 * await storeOTP(userId, otp, expiresAt);
 * ```
 */
export function generateSecureOTP(): string {
  // Generate random integer between 100000 and 999999 (inclusive)
  const otp = randomInt(100_000, 1_000_000);

  // Pad with leading zeros if needed (though randomInt guarantees 6 digits in this range)
  return otp.toString().padStart(6, '0');
}

/**
 * Validates OTP format
 * Checks if OTP is exactly 6 digits
 *
 * @param otp - OTP code to validate
 * @returns True if valid format, false otherwise
 *
 * @example
 * ```typescript
 * isValidOTPFormat("123456"); // true
 * isValidOTPFormat("12345");  // false (too short)
 * isValidOTPFormat("abc123"); // false (contains non-digits)
 * ```
 */
export function isValidOTPFormat(otp: string | null | undefined): boolean {
  if (!otp) return false;

  // Must be exactly 6 digits
  const otpRegex = /^\d{6}$/;
  return otpRegex.test(otp);
}

/**
 * Calculates OTP expiration timestamp
 *
 * @param expiryMinutes - Number of minutes until expiration (default: 10)
 * @returns Date object representing expiration time
 *
 * @example
 * ```typescript
 * const expiresAt = getOTPExpiration(10); // Expires in 10 minutes
 * const expiresAt = getOTPExpiration(5);  // Expires in 5 minutes
 * ```
 */
export function getOTPExpiration(expiryMinutes: number = 10): Date {
  return new Date(Date.now() + expiryMinutes * 60 * 1000);
}

/**
 * Checks if OTP has expired
 *
 * @param expiresAt - Expiration timestamp
 * @returns True if expired, false if still valid
 *
 * @example
 * ```typescript
 * const expiresAt = new Date('2025-10-13T12:00:00Z');
 * if (isOTPExpired(expiresAt)) {
 *   console.log('OTP has expired');
 * }
 * ```
 */
export function isOTPExpired(expiresAt: Date): boolean {
  return Date.now() > expiresAt.getTime();
}

// =============================================================================
// PASSWORD ENCRYPTION UTILITIES (AES-256-GCM)
// =============================================================================
// Two-way encryption for link passwords so owners can view/share them
// Link passwords are NOT user authentication - they're access codes that owners share

/**
 * Gets the encryption key from environment variable
 * Must be 32 bytes (64 hex characters) for AES-256
 */
function getEncryptionKey(): Buffer {
  const key = process.env.LINK_PASSWORD_ENCRYPTION_KEY;

  if (!key) {
    throw new Error('LINK_PASSWORD_ENCRYPTION_KEY environment variable is not set');
  }

  // Convert hex string to buffer
  if (key.length !== 64) {
    throw new Error('LINK_PASSWORD_ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
  }

  return Buffer.from(key, 'hex');
}

/**
 * Encrypts a plaintext password using AES-256-GCM
 * Returns format: iv:authTag:encryptedData (all hex encoded)
 *
 * @param password - The plaintext password to encrypt
 * @returns Encrypted password string in format "iv:authTag:ciphertext"
 *
 * @example
 * ```typescript
 * const encrypted = encryptPassword('mySecurePassword123');
 * // Returns: "a1b2c3d4...:e5f6g7h8...:i9j0k1l2..." (hex encoded)
 * ```
 */
export function encryptPassword(password: string): string {
  if (!password) {
    throw new Error('Password is required for encryption');
  }

  try {
    const key = getEncryptionKey();

    // Generate random 12-byte IV (recommended for GCM)
    const iv = randomBytes(12);

    // Create cipher
    const cipher = createCipheriv('aes-256-gcm', key, iv);

    // Encrypt the password
    let encrypted = cipher.update(password, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Get authentication tag (ensures integrity)
    const authTag = cipher.getAuthTag();

    // Return iv:authTag:encrypted (all hex encoded, colon separated)
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    logger.error('Password encryption failed', error);
    throw new Error('Failed to encrypt password');
  }
}

/**
 * Decrypts an encrypted password using AES-256-GCM
 *
 * @param encryptedPassword - The encrypted password in format "iv:authTag:ciphertext"
 * @returns Decrypted plaintext password
 *
 * @example
 * ```typescript
 * const decrypted = decryptPassword(encryptedPassword);
 * // Returns: "mySecurePassword123"
 * ```
 */
export function decryptPassword(encryptedPassword: string): string {
  if (!encryptedPassword) {
    throw new Error('Encrypted password is required for decryption');
  }

  try {
    const key = getEncryptionKey();

    // Split the encrypted string into parts
    const parts = encryptedPassword.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted password format');
    }

    const [ivHex, authTagHex, encryptedHex] = parts;

    // Convert hex strings back to buffers
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');

    // Create decipher
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    // Decrypt the password
    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    logger.error('Password decryption failed', error);
    throw new Error('Failed to decrypt password');
  }
}

/**
 * Checks if a string is an encrypted password (has the correct format)
 * Format: iv:authTag:ciphertext (3 parts separated by colons, all hex)
 *
 * @param value - The string to check
 * @returns True if the string appears to be an encrypted password
 *
 * @example
 * ```typescript
 * isEncryptedPassword('a1b2c3:d4e5f6:g7h8i9'); // true
 * isEncryptedPassword('plaintext'); // false
 * isEncryptedPassword(null); // false
 * ```
 */
export function isEncryptedPassword(value: string | null | undefined): boolean {
  if (!value) return false;

  // Check format: iv:authTag:ciphertext (3 hex parts)
  const parts = value.split(':');
  if (parts.length !== 3) return false;

  // IV should be 12 bytes (24 hex chars)
  // Auth tag should be 16 bytes (32 hex chars)
  // Ciphertext varies based on password length
  const [ivHex, authTagHex, cipherHex] = parts;

  const hexRegex = /^[0-9a-f]+$/i;
  return (
    ivHex.length === 24 &&
    authTagHex.length === 32 &&
    cipherHex.length > 0 &&
    hexRegex.test(ivHex) &&
    hexRegex.test(authTagHex) &&
    hexRegex.test(cipherHex)
  );
}