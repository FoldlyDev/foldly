import type { Workspace } from '@/lib/supabase/types';

// UI-specific workspace types for dashboard feature

export interface WorkspaceSettingsProps {
  onWorkspaceUpdate?: (workspace: Workspace) => void;
  className?: string;
}

export interface WorkspaceOverviewProps {
  workspace?: Workspace | null;
  className?: string;
}

export interface WorkspaceStatsData {
  totalLinks: number;
  totalFolders: number;
  totalFiles: number;
  storageUsed: number;
  storageLimit: number;
  lastActivity: Date | null;
  recentActivity: string;
}

export interface WorkspaceQuickAction {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  disabled?: boolean;
}

export interface WorkspaceManagementState {
  isEditing: boolean;
  isSaving: boolean;
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
}

// Form states
export interface WorkspaceEditForm {
  name: string;
  description?: string;
}

// Component state management
export interface UseWorkspaceManagementOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  onError?: (error: string) => void;
  onSuccess?: (message: string) => void;
}
