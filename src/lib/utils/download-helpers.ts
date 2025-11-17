// =============================================================================
// DOWNLOAD HELPERS - File and Folder Download Utilities
// =============================================================================
// Utilities for creating ZIP archives from files and folders

import JSZip from 'jszip';
import { logger } from './logger';

/**
 * File data structure for ZIP creation
 * Contains file metadata and content URL
 */
export interface FileForDownload {
  filename: string;
  signedUrl: string;
  folderPath?: string[]; // Optional folder path for nested ZIP structure
}

/**
 * Creates a ZIP archive from multiple files
 * Fetches files from signed URLs and adds them to ZIP
 *
 * @param files - Array of files with signed URLs
 * @param zipFilename - Name for the ZIP archive (without .zip extension)
 * @returns Buffer containing ZIP archive
 *
 * @example
 * ```typescript
 * const files = [
 *   { filename: 'doc1.pdf', signedUrl: 'https://...' },
 *   { filename: 'doc2.pdf', signedUrl: 'https://...' }
 * ];
 * const zipBuffer = await createZipFromFiles(files, 'my-documents');
 * // Returns Buffer ready for download
 * ```
 */
export async function createZipFromFiles(
  files: FileForDownload[],
  zipFilename: string
): Promise<Buffer> {
  const zip = new JSZip();

  // Add each file to ZIP
  for (const file of files) {
    try {
      // Fetch file content from signed URL
      const response = await fetch(file.signedUrl);
      if (!response.ok) {
        logger.warn('Failed to fetch file for ZIP', {
          filename: file.filename,
          status: response.status,
        });
        continue; // Skip failed files, don't fail entire ZIP
      }

      const fileBlob = await response.blob();
      const fileBuffer = await fileBlob.arrayBuffer();

      // Add file to ZIP (handle folder path if provided)
      if (file.folderPath && file.folderPath.length > 0) {
        const zipPath = `${file.folderPath.join('/')}/${file.filename}`;
        zip.file(zipPath, fileBuffer);
      } else {
        zip.file(file.filename, fileBuffer);
      }

      logger.info('File added to ZIP', {
        filename: file.filename,
        folderPath: file.folderPath,
      });
    } catch (error) {
      logger.error('Error adding file to ZIP', {
        filename: file.filename,
        error,
      });
      // Continue processing other files
    }
  }

  // Generate ZIP buffer
  const zipBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }, // Balanced compression (0-9, higher = more compression but slower)
  });

  logger.info('ZIP archive created', {
    zipFilename,
    fileCount: files.length,
    zipSizeBytes: zipBuffer.length,
  });

  return zipBuffer;
}

/**
 * Creates a ZIP archive from a folder tree
 * Preserves folder hierarchy in ZIP structure
 *
 * @param files - Array of files with folder path information
 * @param folderName - Name of the root folder (becomes ZIP filename)
 * @returns Buffer containing ZIP archive
 *
 * @example
 * ```typescript
 * const files = [
 *   { filename: 'doc.pdf', signedUrl: 'https://...', folderPath: ['Documents'] },
 *   { filename: 'invoice.pdf', signedUrl: 'https://...', folderPath: ['Documents', 'Invoices'] }
 * ];
 * const zipBuffer = await createZipFromFolderTree(files, 'My Folder');
 * // Creates: My Folder.zip with nested folder structure
 * ```
 */
export async function createZipFromFolderTree(
  files: FileForDownload[],
  folderName: string
): Promise<Buffer> {
  // Reuse createZipFromFiles - it already handles folder paths
  return createZipFromFiles(files, folderName);
}

/**
 * Sanitizes a filename for safe use in ZIP archives
 * Removes or replaces characters that might cause issues
 *
 * @param filename - Original filename
 * @returns Sanitized filename safe for ZIP
 *
 * @example
 * ```typescript
 * sanitizeFilenameForZip('my/file:name?.pdf'); // Returns: 'my-file-name.pdf'
 * ```
 */
export function sanitizeFilenameForZip(filename: string): string {
  // Replace problematic characters with dash
  return filename.replace(/[/\\:*?"<>|]/g, '-');
}
