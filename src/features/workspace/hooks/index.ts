// Workspace hooks exports

// Core workspace hooks
export { useWorkspaceRealtime } from './use-workspace-realtime';
export { useWorkspaceData } from './use-workspace-data';
export { useLiveStorage } from './use-live-storage';
export { useWorkspaceUI } from './use-workspace-ui';

// File upload hooks - simplified
export { useFileUpload } from './use-file-upload';
export { useFileSelection } from './use-file-selection';

// Re-export centralized storage hooks
export {
  useStorageTracking,
  useInvalidateStorage,
  useStorageWarnings,
  useStorageState,
  type StorageInfo,
} from '@/lib/hooks/use-storage-tracking';
