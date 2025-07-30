/**
 * Storage Path Utilities
 * Shared utilities for generating consistent storage paths
 */

import type { UserId, WorkspaceId, LinkId, FileId, FolderId } from '@/types/ids';

// =============================================================================
// PATH GENERATORS
// =============================================================================

/**
 * Generate storage path for workspace uploads
 */
export function generateWorkspaceStoragePath(
  userId: UserId,
  workspaceId: WorkspaceId,
  folderId: FolderId | null,
  fileName: string
): string {
  const basePath = `workspaces/${userId}/${workspaceId}`;
  
  if (folderId) {
    return `${basePath}/folders/${folderId}/${fileName}`;
  }
  
  return `${basePath}/files/${fileName}`;
}

/**
 * Generate storage path for link uploads
 */
export function generateLinkStoragePath(
  userId: UserId,
  linkId: LinkId,
  uploaderName: string,
  fileName: string
): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  // Sanitize uploader name for path
  const safeUploaderName = sanitizePathSegment(uploaderName);
  
  return `links/${userId}/${linkId}/${year}-${month}-${day}/${safeUploaderName}/${fileName}`;
}

/**
 * Generate temporary upload path
 */
export function generateTempUploadPath(
  fileId: FileId,
  fileName: string
): string {
  return `temp-uploads/${fileId}/${fileName}`;
}

/**
 * Generate thumbnail path
 */
export function generateThumbnailPath(
  originalPath: string,
  size: 'small' | 'medium' | 'large' = 'medium'
): string {
  const pathParts = originalPath.split('/');
  const fileName = pathParts.pop()!;
  const fileNameParts = fileName.split('.');
  const extension = fileNameParts.pop();
  const nameWithoutExt = fileNameParts.join('.');
  
  const thumbnailName = `${nameWithoutExt}_thumb_${size}.${extension}`;
  
  return [...pathParts, 'thumbnails', thumbnailName].join('/');
}

/**
 * Generate public share path
 */
export function generatePublicSharePath(
  fileId: FileId,
  shareToken: string
): string {
  return `public-shares/${shareToken}/${fileId}`;
}

// =============================================================================
// PATH UTILITIES
// =============================================================================

/**
 * Sanitize a path segment to remove invalid characters
 */
export function sanitizePathSegment(segment: string): string {
  return segment
    .replace(/[^a-zA-Z0-9\-_\s]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .toLowerCase()
    .substring(0, 50); // Limit length
}

/**
 * Extract file info from storage path
 */
export interface StoragePathInfo {
  type: 'workspace' | 'link' | 'temp' | 'public';
  userId?: UserId;
  workspaceId?: WorkspaceId;
  linkId?: LinkId;
  folderId?: FolderId;
  fileId?: FileId;
  fileName: string;
  uploaderName?: string;
  date?: string;
}

export function parseStoragePath(path: string): StoragePathInfo | null {
  const segments = path.split('/');
  
  if (segments.length < 2) return null;
  
  const type = segments[0];
  const fileName = segments[segments.length - 1];
  
  switch (type) {
    case 'workspaces':
      if (segments.length >= 5) {
        const isFolder = segments[3] === 'folders';
        return {
          type: 'workspace',
          userId: segments[1] as UserId,
          workspaceId: segments[2] as WorkspaceId,
          folderId: isFolder ? (segments[4] as FolderId) : undefined,
          fileName,
        };
      }
      break;
      
    case 'links':
      if (segments.length >= 6) {
        return {
          type: 'link',
          userId: segments[1] as UserId,
          linkId: segments[2] as LinkId,
          date: segments[3],
          uploaderName: segments[4],
          fileName,
        };
      }
      break;
      
    case 'temp-uploads':
      if (segments.length >= 3) {
        return {
          type: 'temp',
          fileId: segments[1] as FileId,
          fileName,
        };
      }
      break;
      
    case 'public-shares':
      if (segments.length >= 3) {
        return {
          type: 'public',
          fileId: segments[2] as FileId,
          fileName,
        };
      }
      break;
  }
  
  return null;
}

/**
 * Get parent directory from path
 */
export function getParentDirectory(path: string): string {
  const segments = path.split('/');
  segments.pop(); // Remove filename
  return segments.join('/');
}

/**
 * Join path segments safely
 */
export function joinPath(...segments: string[]): string {
  return segments
    .filter(Boolean)
    .join('/')
    .replace(/\/+/g, '/') // Replace multiple slashes with single
    .replace(/\/$/, ''); // Remove trailing slash
}

/**
 * Check if path is valid
 */
export function isValidStoragePath(path: string): boolean {
  // Check for path traversal attempts
  if (path.includes('..') || path.includes('./')) return false;
  
  // Check for absolute paths
  if (path.startsWith('/') || path.match(/^[a-zA-Z]:\\/)) return false;
  
  // Check for valid characters
  if (!/^[a-zA-Z0-9\-_\/\.]+$/.test(path)) return false;
  
  // Check path length
  if (path.length > 500) return false;
  
  return true;
}

/**
 * Get file name from path
 */
export function getFileNameFromPath(path: string): string {
  return path.split('/').pop() || '';
}

/**
 * Get file extension from path
 */
export function getExtensionFromPath(path: string): string {
  const fileName = getFileNameFromPath(path);
  const parts = fileName.split('.');
  return parts.length > 1 ? parts.pop()! : '';
}

/**
 * Build signed URL for file access
 */
export function buildSignedUrl(
  baseUrl: string,
  path: string,
  expiresIn: number = 3600 // 1 hour default
): string {
  const url = new URL(baseUrl);
  url.pathname = joinPath(url.pathname, path);
  
  // Add expiration timestamp
  const expiresAt = Date.now() + (expiresIn * 1000);
  url.searchParams.set('expires', expiresAt.toString());
  
  // In production, you would add a signature here
  // url.searchParams.set('signature', generateSignature(path, expiresAt));
  
  return url.toString();
}