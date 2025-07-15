// =============================================================================
// SHARED SERVICES - Global Services Used Across Multiple Features
// =============================================================================
// 🎯 Service layer for operations shared between workspace, files, and other features

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
