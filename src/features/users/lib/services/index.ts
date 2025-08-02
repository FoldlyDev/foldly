// =============================================================================
// USER SERVICES - User Management Services
// =============================================================================
// 🎯 Service layer for user operations

// User deletion service
export {
  UserDeletionService,
  userDeletionService,
} from './user-deletion-service';

// User workspace service
export {
  UserWorkspaceService,
  userWorkspaceService,
} from '@/features/users/services/user-workspace-service';

// Export service types for consumers
export type { UserDeletionService as UserDeletionServiceType } from './user-deletion-service';
export type { UserDeletionResult } from './user-deletion-service';
export type { UserWorkspaceService as UserWorkspaceServiceType } from '@/features/users/services/user-workspace-service';
export type { UserWorkspaceCreateResult } from '@/features/users/services/user-workspace-service';
