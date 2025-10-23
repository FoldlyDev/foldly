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
