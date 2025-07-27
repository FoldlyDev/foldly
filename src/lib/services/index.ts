// =============================================================================
// SERVICES INDEX - Central Export Hub for All Services (DEPRECATED)
// =============================================================================
// 📢 MIGRATION NOTICE: Services have moved to their respective features
// This file provides backward compatibility during the transition period

// Re-export services from their new feature locations for backward compatibility
export * from '@/features/files/services'; // FileService, FolderService
export * from '@/features/users/services'; // UserDeletionService, UserWorkspaceService  
export * from '@/features/workspace/services'; // WorkspaceService
// Note: Billing services are maintained in @/lib/services/billing

// Local services (maintained here for core functionality)
export * from './billing';
export * from './storage';
