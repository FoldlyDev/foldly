// =============================================================================
// VALIDATION HELPERS - Reusable Validation Utilities
// =============================================================================
// Provides reusable validation schema builders and helpers
// Used across multiple modules for consistent validation patterns

import { z } from 'zod';

// =============================================================================
// EMAIL VALIDATION
// =============================================================================

/**
 * Standardized email validation pattern
 * RFC 5322 compliant email validation with practical constraints
 *
 * Pattern explanation:
 * - Local part: alphanumeric + allowed special chars (!#$%&'*+/=?^_`{|}~-)
 * - @ symbol required
 * - Domain: alphanumeric with hyphens allowed (not at start/end)
 * - TLD: 2+ characters (e.g., .com, .co.uk)
 *
 * @example
 * Valid emails:
 * - user@example.com
 * - first.last@company.co.uk
 * - user+tag@domain.com
 * - user_123@test-domain.com
 *
 * Invalid emails:
 * - user@                    (no domain)
 * - @example.com             (no local part)
 * - user@domain              (no TLD)
 * - user name@example.com    (space in local part)
 */
export const EMAIL_REGEX = /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

/**
 * NOTE: For Zod schema validation, use `emailSchema` from '@/lib/validation/base-schemas'
 * This regex is kept for runtime validation utilities below (isValidEmail, normalizeEmail, isDuplicateEmail)
 */

/**
 * Validate if a string is a valid email address
 * Utility function for runtime validation outside of Zod schemas
 *
 * @param email - Email string to validate
 * @returns True if valid email format
 *
 * @example
 * ```typescript
 * isValidEmail('user@example.com');        // true
 * isValidEmail('invalid-email');           // false
 * isValidEmail('user@domain');             // false (no TLD)
 * isValidEmail('user name@example.com');   // false (space in local part)
 * ```
 */
export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

/**
 * Normalize an email address to standard format
 * Trims whitespace and converts to lowercase for consistent storage
 *
 * @param email - Email string to normalize
 * @returns Normalized email (lowercase, trimmed)
 *
 * @example
 * ```typescript
 * normalizeEmail('  User@Example.COM  '); // 'user@example.com'
 * normalizeEmail('ADMIN@TEST.COM');       // 'admin@test.com'
 * ```
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Check if email is a duplicate in an existing list
 * Case-insensitive comparison with normalization
 *
 * @param email - Email to check
 * @param existingEmails - Array of existing emails
 * @returns True if email already exists in list
 *
 * @example
 * ```typescript
 * const emails = ['user@example.com', 'admin@test.com'];
 *
 * isDuplicateEmail('user@example.com', emails);     // true
 * isDuplicateEmail('User@Example.COM', emails);     // true (case-insensitive)
 * isDuplicateEmail('new@example.com', emails);      // false
 * ```
 */
export function isDuplicateEmail(email: string, existingEmails: string[]): boolean {
  const normalized = normalizeEmail(email);
  return existingEmails.some((existing) => normalizeEmail(existing) === normalized);
}
