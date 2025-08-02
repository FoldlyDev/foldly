// =============================================================================
// SECURITY UTILITIES
// =============================================================================
// Security helper functions following OWASP best practices
// For path traversal prevention, IP validation, and input sanitization

import path from 'path';
import { logger } from '@/lib/services/logging/logger';

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
      logger.logSecurityEvent(
        'Path traversal attempt detected',
        'high',
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
    logger.logSecurityEvent(
      'User ID sanitization required',
      'medium',
      { original: userId, sanitized }
    );
  }
  
  // Ensure reasonable length
  if (sanitized.length > 128) {
    logger.logSecurityEvent(
      'User ID too long',
      'medium',
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
    logger.logSecurityEvent(
      'Invalid folder ID detected',
      'high',
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