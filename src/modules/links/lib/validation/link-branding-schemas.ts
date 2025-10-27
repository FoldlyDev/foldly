// =============================================================================
// BRANDING VALIDATION SCHEMAS - Module-Specific
// =============================================================================
// Validation schemas and constants for link branding
// Includes color validation, logo uploads, and branding configuration
// Single source of truth for all branding-related validation

import { z } from 'zod';

// Import base schemas from global
import { uuidSchema } from '@/lib/validation/base-schemas';

// Import validation helpers from global
import { createHexColorSchema } from '@/lib/utils/validation-helpers';

// Import validation constants from global
import { VALIDATION_LIMITS } from '@/lib/constants/validation';

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Allowed MIME types for branding logo uploads
 */
export const ALLOWED_BRANDING_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
] as const;

export type AllowedBrandingType = (typeof ALLOWED_BRANDING_TYPES)[number];

/**
 * File extension mapping for branding images
 */
export const BRANDING_FILE_EXTENSIONS: Record<AllowedBrandingType, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/webp': 'webp',
} as const;

/**
 * Maximum file size for branding logos
 * Uses global validation limit for consistency
 */
export const MAX_BRANDING_FILE_SIZE = VALIDATION_LIMITS.BRANDING.MAX_FILE_SIZE_BYTES;

/**
 * Storage bucket name for branding assets
 * Automatically selects the correct bucket based on STORAGE_PROVIDER env variable
 */
export const BRANDING_BUCKET_NAME =
  process.env.STORAGE_PROVIDER === 'gcs'
    ? process.env.GCS_BRANDING_BUCKET_NAME || ''
    : process.env.SUPABASE_BRANDING_BUCKET_NAME || '';

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Type guard to check if a MIME type is allowed for branding logos
 *
 * Validates that the provided MIME type is one of the supported image formats
 * for branding logo uploads (PNG, JPEG, WebP).
 *
 * @param mimeType - The MIME type to validate
 * @returns True if the MIME type is allowed, with type narrowed to AllowedBrandingType
 *
 * @example
 * ```typescript
 * if (isAllowedBrandingType('image/png')) {
 *   // mimeType is narrowed to AllowedBrandingType
 *   const ext = getFileExtension(mimeType); // TypeScript knows this is valid
 * }
 * ```
 */
export function isAllowedBrandingType(mimeType: string): mimeType is AllowedBrandingType {
  return ALLOWED_BRANDING_TYPES.includes(mimeType as AllowedBrandingType);
}

/**
 * Validate that a file size is within acceptable limits for branding logos
 *
 * Checks that the file size is positive and does not exceed the maximum
 * allowed size (5MB) for branding logo uploads.
 *
 * @param size - The file size in bytes to validate
 * @returns True if the size is valid (0 < size <= 5MB)
 *
 * @example
 * ```typescript
 * const fileSize = 2 * 1024 * 1024; // 2MB
 * if (isValidBrandingSize(fileSize)) {
 *   console.log('File size is valid for upload');
 * }
 * ```
 */
export function isValidBrandingSize(size: number): boolean {
  return size > 0 && size <= MAX_BRANDING_FILE_SIZE;
}

/**
 * Get the file extension for a given MIME type
 *
 * Maps supported branding image MIME types to their corresponding file extensions.
 *
 * @param mimeType - The MIME type (must be AllowedBrandingType)
 * @returns The file extension without the leading dot (e.g., 'png', 'jpg', 'webp')
 *
 * @example
 * ```typescript
 * const extension = getFileExtension('image/png'); // Returns: 'png'
 * const extension = getFileExtension('image/jpeg'); // Returns: 'jpg'
 * ```
 */
export function getFileExtension(mimeType: AllowedBrandingType): string {
  return BRANDING_FILE_EXTENSIONS[mimeType];
}

/**
 * Generate the GCS storage path for a branding logo
 *
 * Creates a hierarchical path for storing branding logos in Google Cloud Storage,
 * organized by workspace and link ID for easy organization and retrieval.
 *
 * @param workspaceId - The workspace UUID
 * @param linkId - The link UUID
 * @returns GCS path in format: `branding/{workspaceId}/{linkId}`
 *
 * @example
 * ```typescript
 * const path = generateBrandingPath(
 *   'workspace_123',
 *   'link_456'
 * );
 * // Returns: 'branding/workspace_123/link_456'
 * // Full file path: 'branding/workspace_123/link_456/logo-1234567890.png'
 * ```
 */
export function generateBrandingPath(workspaceId: string, linkId: string): string {
  return `branding/${workspaceId}/${linkId}`;
}

// =============================================================================
// FIELD SCHEMAS
// =============================================================================

/**
 * Accent color schema for link branding
 * Uses global color validation helper for consistency
 */
export const accentColorFieldSchema = createHexColorSchema({
  fieldName: 'Accent color',
  allowShorthand: false,
});

/**
 * Background color schema for link branding
 * Uses global color validation helper for consistency
 */
export const backgroundColorFieldSchema = createHexColorSchema({
  fieldName: 'Background color',
  allowShorthand: false,
});

/**
 * Link branding configuration schema
 * Validates the complete branding configuration including logo and colors
 */
export const brandingSchema = z.object({
  enabled: z.boolean().optional(),
  logo: z
    .object({
      url: z.string().url({ message: 'Logo URL must be a valid URL.' }),
      altText: z
        .string()
        .max(VALIDATION_LIMITS.BRANDING.LOGO_ALT_TEXT_MAX_LENGTH, {
          message: `Alt text must be less than ${VALIDATION_LIMITS.BRANDING.LOGO_ALT_TEXT_MAX_LENGTH} characters.`,
        })
        .optional(),
    })
    .nullable()
    .optional(),
  colors: z
    .object({
      accentColor: accentColorFieldSchema,
      backgroundColor: backgroundColorFieldSchema,
    })
    .nullable()
    .optional(),
});

export type BrandingConfig = z.infer<typeof brandingSchema>;

// =============================================================================
// ACTION INPUT SCHEMAS
// =============================================================================

/**
 * Upload branding logo input schema
 */
export const uploadBrandingLogoSchema = z.object({
  linkId: z.string().uuid({ message: 'Invalid link ID format.' }),
  file: z.object({
    // Accept both Uint8Array (from client via serializeFileForUpload) and Buffer (from tests)
    // Use custom validation instead of instanceof to avoid ArrayBuffer type strictness
    buffer: z.custom<Uint8Array | Buffer>(
      (val) => val instanceof Uint8Array || Buffer.isBuffer(val),
      { message: 'Buffer must be a Uint8Array or Buffer' }
    ),
    originalName: z.string(),
    mimeType: z.string().refine(isAllowedBrandingType, {
      message: 'Invalid file type. Only PNG, JPEG, and WebP images are allowed.',
    }),
    size: z.number().refine(isValidBrandingSize, {
      message: `File size must be less than ${MAX_BRANDING_FILE_SIZE / 1024 / 1024}MB.`,
    }),
  }),
});

export type UploadBrandingLogoInput = z.infer<typeof uploadBrandingLogoSchema>;

/**
 * Delete branding logo input schema
 */
export const deleteBrandingLogoSchema = z.object({
  linkId: z.string().uuid({ message: 'Invalid link ID format.' }),
});

export type DeleteBrandingLogoInput = z.infer<typeof deleteBrandingLogoSchema>;

/**
 * Update link branding input schema
 * Validates linkId and complete branding configuration
 */
export const updateLinkBrandingSchema = z.object({
  linkId: uuidSchema,
  branding: brandingSchema,
});

export type UpdateLinkBrandingInput = z.infer<typeof updateLinkBrandingSchema>;
