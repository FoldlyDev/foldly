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
// - Analytics types: @/features/analytics/types
// - Links types: @/features/links/types
// - Files types: @/features/files/types
// - Upload types: @/features/link-upload/types
// - Notifications types: @/features/notifications/types
// - Auth types: @/features/auth/types
// - UI component types: @/components/ui/types

// Use individual feature exports:
// import { LinkType } from '@/features/links/types';
// import { FileProcessingStatus } from '@/features/files/types';
// import { UploadFlowStep } from '@/features/link-upload/types';
