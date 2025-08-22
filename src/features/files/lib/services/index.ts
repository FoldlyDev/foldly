// =============================================================================
// FILES SERVICES - File Management & Storage Services
// =============================================================================
// 🎯 Service layer for file operations, storage management, and folder handling

// File and folder services - used by both workspace and files features
export { FileService } from './file-service';
export { FolderService } from './folder-service';
export { StorageService, storageService } from './storage-service';
export type {
  UploadResult,
  DownloadResult,
  StorageContext,
} from './storage-service';

// Export service types for consumers
export type { FileService as FileServiceType } from './file-service';
export type { FolderService as FolderServiceType } from './folder-service';
