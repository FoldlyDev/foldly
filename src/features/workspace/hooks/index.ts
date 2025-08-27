// Workspace hooks exports

// Core workspace hooks
export { useWorkspaceRealtime } from './use-workspace-realtime';
export { useWorkspaceData } from './use-workspace-data';
export { useLiveStorage } from './use-live-storage';
export { usePreUploadValidation } from './use-pre-upload-validation';
export { useWorkspaceUI } from './use-workspace-ui';

// Re-export centralized storage hooks
export {
  useStorageTracking,
  useInvalidateStorage,
  useStorageWarnings,
  useStorageState,
  type StorageInfo,
} from '@/lib/hooks/use-storage-tracking';

// Storage utilities (client-safe)
export {
  getStorageQuotaStatus,
  shouldShowStorageWarning,
  formatBytes,
  type StorageQuotaStatus,
} from '../lib/utils/storage-utils';
