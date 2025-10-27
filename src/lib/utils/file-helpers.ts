// =============================================================================
// FILE UPLOAD UTILITIES - Client-to-Server File Transfer Helpers
// =============================================================================
// These utilities handle the conversion of browser File objects into formats
// suitable for Next.js server actions. All functions assume browser context.

/**
 * Serializes a File object into a format suitable for server action transmission.
 *
 * Converts File → Uint8Array (browser-compatible) which Next.js can serialize.
 * Server actions must convert Uint8Array → Buffer before passing to storage layer.
 *
 * @param file - Browser File object from input[type="file"] or drag-drop
 * @returns Serializable file data with Uint8Array buffer
 *
 * @example
 * ```typescript
 * const fileData = await serializeFileForUpload(logoFile);
 * await uploadLogoAction({ linkId, file: fileData });
 * ```
 */
export async function serializeFileForUpload(file: File): Promise<{
  buffer: Uint8Array;
  originalName: string;
  mimeType: string;
  size: number;
}> {
  const arrayBuffer = await file.arrayBuffer();
  return {
    buffer: new Uint8Array(arrayBuffer),
    originalName: file.name,
    mimeType: file.type,
    size: file.size,
  };
}

/**
 * Validates file size against a maximum limit.
 *
 * @param file - File to validate
 * @param maxSizeBytes - Maximum allowed size in bytes
 * @returns True if file is within limit
 *
 * @example
 * ```typescript
 * if (!isFileSizeValid(logoFile, 5 * 1024 * 1024)) {
 *   throw new Error('File exceeds 5MB limit');
 * }
 * ```
 */
export function isFileSizeValid(file: File, maxSizeBytes: number): boolean {
  return file.size <= maxSizeBytes;
}

/**
 * Validates file MIME type against allowed types.
 *
 * @param file - File to validate
 * @param allowedTypes - Array of allowed MIME types (e.g., ['image/png', 'image/jpeg'])
 * @returns True if file type is allowed
 *
 * @example
 * ```typescript
 * if (!isFileTypeValid(logoFile, ['image/png', 'image/jpeg', 'image/webp'])) {
 *   throw new Error('Invalid file type');
 * }
 * ```
 */
export function isFileTypeValid(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

/**
 * Type guard: Checks if a value is a File object.
 *
 * @param value - Value to check
 * @returns True if value is a File
 *
 * @example
 * ```typescript
 * if (isFile(unknownValue)) {
 *   // TypeScript knows unknownValue is a File
 *   const fileData = await serializeFileForUpload(unknownValue);
 * }
 * ```
 */
export function isFile(value: unknown): value is File {
  return value instanceof File;
}
