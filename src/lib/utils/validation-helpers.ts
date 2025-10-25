// =============================================================================
// VALIDATION HELPERS - Reusable Validation Utilities
// =============================================================================
// Provides reusable validation schema builders and helpers
// Used across multiple modules for consistent validation patterns

import { z } from 'zod';

// =============================================================================
// COLOR VALIDATION
// =============================================================================

/**
 * Standardized color validation patterns
 * Used consistently across all modules for hex color validation
 */
export const COLOR_REGEX = {
  /** 6-digit hex color (e.g., #6c47ff) */
  HEX_6_DIGIT: /^#[A-Fa-f0-9]{6}$/,
  /** 3-digit or 6-digit hex color (e.g., #fff or #6c47ff) */
  HEX_3_OR_6: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
} as const;

/**
 * Create a hex color validation schema with configurable options
 *
 * Provides consistent color validation across the application with
 * support for both full 6-digit and shorthand 3-digit hex formats.
 *
 * @param options - Configuration options
 * @param options.allowShorthand - Allow 3-digit hex colors like #fff (default: false)
 * @param options.fieldName - Name for error messages (default: 'Color')
 *
 * @returns Zod string schema with hex color validation
 *
 * @example
 * ```typescript
 * // 6-digit only (strict)
 * const accentColor = createHexColorSchema({ fieldName: 'Accent color' });
 * accentColor.parse('#6c47ff'); // ✅ Valid
 * accentColor.parse('#fff');    // ❌ Invalid
 *
 * // Allow shorthand
 * const bgColor = createHexColorSchema({
 *   fieldName: 'Background color',
 *   allowShorthand: true
 * });
 * bgColor.parse('#6c47ff'); // ✅ Valid
 * bgColor.parse('#fff');    // ✅ Valid
 * ```
 */
export function createHexColorSchema(options?: {
  allowShorthand?: boolean;
  fieldName?: string;
}) {
  const { allowShorthand = false, fieldName = 'Color' } = options || {};

  const pattern = allowShorthand ? COLOR_REGEX.HEX_3_OR_6 : COLOR_REGEX.HEX_6_DIGIT;
  const formatDescription = allowShorthand ? 'hex' : '6-digit hex';
  const example = allowShorthand ? '#fff or #6c47ff' : '#6c47ff';

  return z.string().regex(pattern, {
    message: `${fieldName} must be a valid ${formatDescription} color (e.g., ${example}).`,
  });
}

/**
 * Validate if a string is a valid hex color
 * Utility function for runtime validation outside of Zod schemas
 *
 * @param color - Color string to validate
 * @param allowShorthand - Allow 3-digit hex colors (default: false)
 * @returns True if valid hex color
 *
 * @example
 * ```typescript
 * isValidHexColor('#6c47ff');          // true
 * isValidHexColor('#fff');             // false
 * isValidHexColor('#fff', true);       // true
 * isValidHexColor('rgb(0, 0, 0)');     // false
 * ```
 */
export function isValidHexColor(color: string, allowShorthand = false): boolean {
  const pattern = allowShorthand ? COLOR_REGEX.HEX_3_OR_6 : COLOR_REGEX.HEX_6_DIGIT;
  return pattern.test(color);
}

/**
 * Normalize a hex color to 6-digit format
 * Converts 3-digit shorthand to full 6-digit format
 *
 * @param color - Hex color string (with or without #)
 * @returns Normalized 6-digit hex color with # prefix
 *
 * @example
 * ```typescript
 * normalizeHexColor('#fff');     // '#ffffff'
 * normalizeHexColor('#6c47ff');  // '#6c47ff'
 * normalizeHexColor('fff');      // '#ffffff'
 * ```
 */
export function normalizeHexColor(color: string): string {
  // Remove # if present
  let hex = color.startsWith('#') ? color.slice(1) : color;

  // Convert 3-digit to 6-digit
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((char) => char + char)
      .join('');
  }

  return `#${hex.toLowerCase()}`;
}

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
 * Create an email validation schema with configurable options
 *
 * Provides consistent email validation across the application with
 * support for custom error messages and optional normalization.
 *
 * @param options - Configuration options
 * @param options.fieldName - Name for error messages (default: 'Email')
 * @param options.normalize - Auto-normalize email (lowercase, trim) (default: true)
 *
 * @returns Zod string schema with email validation
 *
 * @example
 * ```typescript
 * // Basic usage
 * const userEmail = createEmailSchema();
 * userEmail.parse('user@example.com'); // ✅ Valid
 * userEmail.parse('invalid-email');    // ❌ Invalid
 *
 * // Custom field name
 * const inviteEmail = createEmailSchema({ fieldName: 'Invitee email' });
 * inviteEmail.parse('bad-email'); // Error: "Invitee email must be a valid email address"
 *
 * // Disable normalization
 * const rawEmail = createEmailSchema({ normalize: false });
 * rawEmail.parse('User@Example.COM'); // Returns 'User@Example.COM' (not normalized)
 * ```
 */
export function createEmailSchema(options?: {
  fieldName?: string;
  normalize?: boolean;
}) {
  const { fieldName = 'Email', normalize = true } = options || {};

  const schema = z.string().regex(EMAIL_REGEX, {
    message: `${fieldName} must be a valid email address (e.g., user@example.com).`,
  });

  // Apply normalization transform if enabled
  if (normalize) {
    return schema.transform((email) => normalizeEmail(email));
  }

  return schema;
}

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
