// =============================================================================
// WORKSPACE SERVICES - Global Services for Workspace Management
// =============================================================================
// 🎯 Service layer for workspace operations used across multiple features

export { WorkspaceService, workspaceService } from './workspace-service';
export {
  UserWorkspaceService,
  userWorkspaceService,
} from './user-workspace-service';
export {
  UserDeletionService,
  userDeletionService,
} from './user-deletion-service';

// Export service types for consumers
export type { WorkspaceService as WorkspaceServiceType } from './workspace-service';
export type { UserWorkspaceService as UserWorkspaceServiceType } from './user-workspace-service';
export type { UserWorkspaceCreateResult } from './user-workspace-service';
export type { UserDeletionService as UserDeletionServiceType } from './user-deletion-service';
export type { UserDeletionResult } from './user-deletion-service';
