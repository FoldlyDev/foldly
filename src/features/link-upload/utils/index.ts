// Link Upload Feature Utilities
// Re-export shared upload utilities that are commonly used in link uploads

// Re-export shared validation utilities
export {
  validateFile,
  validateFiles,
  checkFileSize,
  checkFileType,
  checkFileName,
  formatFileSize,
  getReadableFileType,
} from '@/lib/upload/utils/file-validation';

// Re-export shared file processing utilities
export {
  generateFileId,
  generateBatchId,
  sanitizeFileName,
  generateUniqueFileName,
  createFileMetadata,
  getFileCategory,
  isImageFile,
  isVideoFile,
  isDocumentFile,
} from '@/lib/upload/utils/file-processing';

// Re-export shared storage utilities  
export {
  generateLinkStoragePath,
  generateThumbnailPath,
  parseStoragePath,
  isValidStoragePath,
} from '@/lib/upload/utils/storage-paths';

// Re-export shared constants
export {
  LINK_UPLOAD_LIMITS,
  UPLOAD_STATUS,
  BATCH_STATUS,
  UPLOAD_ERROR_CODES,
} from '@/lib/upload/constants/limits';