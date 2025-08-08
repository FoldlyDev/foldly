// Cloud Storage Feature Exports

// Components
export { CloudWorkspaceView } from './components/views/CloudWorkspaceView';
export { SplitPaneManager } from './components/views/SplitPaneManager';
export { MobileViewSwitcher } from './components/views/MobileViewSwitcher';
export { CloudProviderTree } from './components/trees/CloudProviderTree';
export { UnifiedCloudTree } from './components/trees/UnifiedCloudTree';
export { CloudTransferModal } from './components/transfer/CloudTransferModal';

// Hooks
export { useCloudTransfer } from './hooks/useCloudTransfer';
export { useProviderSync } from './hooks/useProviderSync';

// Stores
export { useCloudViewStore } from './stores/cloud-view-store';

// Transfer Manager
export { CloudTransferManager } from './lib/transfer-manager';

// Re-export shared service types for convenience
export type {
  CloudProvider,
  CloudFile,
  CloudTreeNode,
  CloudTransferRequest,
  CloudTransferProgress,
  CloudProviderConfig,
  CloudAuthToken,
  CloudStorageError,
  Result,
  CloudProviderApi,
} from '@/lib/services/cloud-storage';