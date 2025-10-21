// =============================================================================
// BRANDING VALIDATION SCHEMAS - Module-Specific
// =============================================================================
// Validation schemas and constants for link branding uploads
// Used by branding actions to validate logo uploads and branding configuration

import { z } from 'zod';

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
 * Maximum file size for branding logos (5MB)
 */
export const MAX_BRANDING_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

/**
 * GCS bucket name for branding assets
 */
export const BRANDING_BUCKET_NAME = process.env.GCS_BRANDING_BUCKET_NAME || '';

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
// ZOD SCHEMAS
// =============================================================================

/**
 * Upload branding logo input schema
 */
export const uploadBrandingLogoSchema = z.object({
  linkId: z.string().uuid({ message: 'Invalid link ID format.' }),
  file: z.object({
    buffer: z.instanceof(Buffer),
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
