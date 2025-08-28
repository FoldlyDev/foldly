// =============================================================================
// STORAGE SERVICES - Export all storage-related services
// =============================================================================
// 🎯 Central export point for all storage-related functionality
// 📚 Includes services, actions, and utilities

// Core services
export * from './storage-tracking-service';
export { storageQuotaService } from './storage-quota-service';
export { storageBackgroundService } from './storage-background-service';
export { storageCleanupService } from './storage-cleanup-service';
export { StorageService } from './storage-operations-service';

// Helper functions
export * from './helpers/ownership-helpers';

// Utilities
export * from './utils';

// Type exports
export type { UserStorageInfo, StorageValidationResult } from './storage-tracking-service';
export type { DatabaseResult } from '@/lib/database/types/common';
