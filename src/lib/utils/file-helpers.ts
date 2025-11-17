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

/**
 * Generates a Windows-style unique filename by appending " (N)" before extension
 * Used when uploading duplicate filenames to the same folder
 *
 * Pattern: filename.ext → filename (1).ext → filename (2).ext
 *
 * @param baseFilename - Original filename with extension
 * @param checkExists - Async function to check if filename exists
 * @returns Promise resolving to unique filename
 *
 * @example
 * ```typescript
 * // If "photo.jpg" exists, returns "photo (1).jpg"
 * const uniqueName = await generateUniqueFilename(
 *   'photo.jpg',
 *   (name) => checkFilenameExists(folderId, name)
 * );
 *
 * // If "photo.jpg" and "photo (1).jpg" exist, returns "photo (2).jpg"
 * ```
 */
export async function generateUniqueFilename(
  baseFilename: string,
  checkExists: (filename: string) => Promise<boolean>
): Promise<string> {
  // Check if base filename is available
  const exists = await checkExists(baseFilename);
  if (!exists) {
    return baseFilename;
  }

  // Extract filename and extension
  const lastDotIndex = baseFilename.lastIndexOf('.');
  const hasExtension = lastDotIndex > 0 && lastDotIndex < baseFilename.length - 1;

  const nameWithoutExt = hasExtension
    ? baseFilename.substring(0, lastDotIndex)
    : baseFilename;
  const extension = hasExtension ? baseFilename.substring(lastDotIndex) : '';

  // Try incrementing numbers until we find an available filename
  let counter = 1;
  let candidateFilename: string;

  do {
    candidateFilename = `${nameWithoutExt} (${counter})${extension}`;
    counter++;

    // Safety limit to prevent infinite loop (unlikely but defensive)
    if (counter > 1000) {
      // Fallback: Add timestamp to ensure uniqueness
      const timestamp = Date.now();
      candidateFilename = `${nameWithoutExt} (${timestamp})${extension}`;
      break;
    }
  } while (await checkExists(candidateFilename));

  return candidateFilename;
}

/**
 * Checks if a file can be previewed in the browser
 * Based on MIME type, determines if file supports native preview
 *
 * Supported types:
 * - Images: image/*
 * - Videos: video/*
 * - PDFs: application/pdf
 *
 * @param mimeType - File MIME type (e.g., 'image/png', 'video/mp4')
 * @returns True if file can be previewed
 *
 * @example
 * ```typescript
 * if (isPreviewableFile(file.mimeType)) {
 *   // Show preview option
 * } else {
 *   // Show download-only option
 * }
 * ```
 */
export function isPreviewableFile(mimeType: string): boolean {
  return (
    mimeType.startsWith('image/') ||
    mimeType.startsWith('video/') ||
    mimeType === 'application/pdf'
  );
}

/**
 * Sanitizes filename for safe use in storage paths
 *
 * IMPORTANT: This is ONLY for storage paths. Display names (database `filename` column)
 * should remain unchanged to show users their original filename.
 *
 * Uses URL encoding (encodeURIComponent) to handle:
 * - Emojis (💙, 🎉, etc.)
 * - Special characters (&, =, ?, etc.)
 * - Spaces (already handled by storage providers, but encoded for consistency)
 * - Unicode characters (™, ©, etc.)
 *
 * Industry standard approach (2025): URL encoding preserves all characters,
 * is reversible via decodeURIComponent(), and is universally supported by
 * storage providers (Supabase Storage, GCS, S3, Azure Blob).
 *
 * @param filename - Original filename with extension (may contain emojis/special chars)
 * @returns URL-encoded filename safe for storage paths
 *
 * @example
 * ```typescript
 * // Emoji filename
 * sanitizeFilenameForStorage("💙 Eddy's Notebook.url");
 * // Returns: "%F0%9F%92%99%20Eddy's%20Notebook.url"
 *
 * // Special characters
 * sanitizeFilenameForStorage("Report Q1 2024 (Final).pdf");
 * // Returns: "Report%20Q1%202024%20(Final).pdf"
 *
 * // Usage in storage path construction:
 * const storagePath = `uploads/${workspaceId}/${sanitizeFilenameForStorage(filename)}`;
 * ```
 */
export function sanitizeFilenameForStorage(filename: string): string {
  // URL-encode the entire filename (handles all special characters, emojis, Unicode)
  // This is reversible via decodeURIComponent() for debugging/logging
  return encodeURIComponent(filename);
}

/**
 * Reverses storage path sanitization for debugging/logging purposes
 *
 * Converts URL-encoded storage filename back to human-readable format.
 * Useful for debugging, logging, or displaying storage paths in admin tools.
 *
 * NOTE: User-facing filenames should come from the `filename` database column,
 * NOT from storage paths. This utility is for internal/debugging use only.
 *
 * @param encodedFilename - URL-encoded filename from storage path
 * @returns Original human-readable filename
 *
 * @example
 * ```typescript
 * // Debugging storage paths
 * const storagePath = "uploads/123/%F0%9F%92%99%20Eddy's%20Notebook.url";
 * const filename = storagePath.split('/').pop();
 * console.log(desanitizeFilenameFromStorage(filename));
 * // Logs: "💙 Eddy's Notebook.url"
 * ```
 */
export function desanitizeFilenameFromStorage(encodedFilename: string): string {
  try {
    return decodeURIComponent(encodedFilename);
  } catch (error) {
    // If decoding fails (malformed encoding), return original string
    return encodedFilename;
  }
}
