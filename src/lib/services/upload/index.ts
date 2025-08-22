/**
 * Upload Service Public API
 * Centralized export point for upload functionality
 */

// =============================================================================
// MAIN EXPORTS
// =============================================================================

// Upload Manager (singleton)
export { 
  UploadManager, 
  uploadManager,
  uploadFile,
  cancelUpload,
} from './upload-manager';

// =============================================================================
// TYPE EXPORTS
// =============================================================================

// Core types
export type {
  // Context types
  UploadContext,
  WorkspaceUploadContext,
  LinkUploadContext,
  
  // Status types
  UploadStatus,
  BatchStatus,
  
  // Handle types
  UploadHandle,
  
  // Result types
  UploadResult,
  BatchUploadResult,
  
  // Progress types
  UploadProgressEvent,
  UploadStateEvent,
  
  // Option types
  UploadOptions,
  BatchUploadOptions,
  
  // Configuration types
  UploadConfig,
  
  // Validation types
  FileValidationResult,
  ValidationError,
  ValidationWarning,
  
  // Metrics types
  UploadMetrics,
  UploadStatistics,
  
  // Storage types
  StorageValidationResult,
  StorageQuota,
} from './types';

// Error types
export { 
  UploadError,
  UploadErrorCode,
} from './types';

// Type guards
export {
  isWorkspaceContext,
  isLinkContext,
  isUploadError,
} from './types';

// =============================================================================
// USAGE EXAMPLES
// =============================================================================

/**
 * Example: Upload to workspace
 * ```typescript
 * import { uploadManager } from '@/lib/services/upload';
 * 
 * const uploadId = await uploadManager.upload(file, {
 *   type: 'workspace',
 *   workspaceId: 'workspace-123',
 *   folderId: 'folder-456',
 *   userId: 'user-789'
 * }, {
 *   onProgress: (event) => {
 *     console.log(`Progress: ${event.progress}%`);
 *   },
 *   onComplete: (result) => {
 *     console.log('Upload complete:', result);
 *   }
 * });
 * ```
 */

/**
 * Example: Upload to link
 * ```typescript
 * import { uploadManager } from '@/lib/services/upload';
 * 
 * const uploadId = await uploadManager.upload(file, {
 *   type: 'link',
 *   linkId: 'link-123',
 *   uploaderName: 'John Doe',
 *   uploaderEmail: 'john@example.com'
 * });
 * ```
 */

/**
 * Example: Cancel upload
 * ```typescript
 * import { uploadManager } from '@/lib/services/upload';
 * 
 * // Start upload
 * const uploadId = await uploadManager.upload(file, context);
 * 
 * // Cancel it
 * uploadManager.cancel(uploadId);
 * ```
 */

/**
 * Example: Get upload progress
 * ```typescript
 * import { uploadManager } from '@/lib/services/upload';
 * 
 * const progress = uploadManager.getProgress(uploadId);
 * console.log(`Upload is ${progress}% complete`);
 * ```
 */

/**
 * Example: Retry failed upload
 * ```typescript
 * import { uploadManager } from '@/lib/services/upload';
 * 
 * const status = uploadManager.getStatus(uploadId);
 * if (status === 'error') {
 *   await uploadManager.retry(uploadId);
 * }
 * ```
 */

/**
 * Example: Get upload statistics
 * ```typescript
 * import { uploadManager } from '@/lib/services/upload';
 * 
 * const stats = uploadManager.getStatistics();
 * console.log(`Total uploads: ${stats.totalUploads}`);
 * console.log(`Success rate: ${(stats.successCount / stats.totalUploads * 100).toFixed(2)}%`);
 * ```
 */