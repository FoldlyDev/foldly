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
 * Validate branding file type
 */
export function isAllowedBrandingType(mimeType: string): mimeType is AllowedBrandingType {
  return ALLOWED_BRANDING_TYPES.includes(mimeType as AllowedBrandingType);
}

/**
 * Validate branding file size
 */
export function isValidBrandingSize(size: number): boolean {
  return size > 0 && size <= MAX_BRANDING_FILE_SIZE;
}

/**
 * Get file extension from MIME type
 */
export function getFileExtension(mimeType: AllowedBrandingType): string {
  return BRANDING_FILE_EXTENSIONS[mimeType];
}

/**
 * Generate GCS path for branding logo
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
