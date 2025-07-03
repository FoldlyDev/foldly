// Foldly Types - Infrastructure-Only Barrel File
// Following 2025 feature-based architecture principles
// This file ONLY exports global infrastructure types, not feature-specific types

// =============================================================================
// GLOBAL INFRASTRUCTURE TYPES ONLY
// =============================================================================

// Core infrastructure - used across all features
export * from './ids';
export * from './errors';
export * from './database-infrastructure';
export * from './api-infrastructure';
export * from './forms';
export * from './queries';
export * from './utils';

// =============================================================================
// FEATURE-SPECIFIC TYPES
// =============================================================================
// These have been moved to their proper feature locations:
// - Analytics types: @/components/features/analytics/types
// - Links types: @/components/features/links/types
// - Files types: @/components/features/files/types
// - Upload types: @/components/features/upload/types
// - Notifications types: @/components/features/notifications/types
// - Auth types: @/components/features/auth/types
// - UI component types: @/components/ui/types

// Use individual feature exports:
// import { LinkType } from '@/components/features/links/types';
// import { FileProcessingStatus } from '@/components/features/files/types';
// import { UploadFlowStep } from '@/components/features/upload/types';
