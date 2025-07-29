// =============================================================================
// WORKSPACE TYPES - Database Workspace Entity and Related Types
// =============================================================================
// 🎯 Based on workspaces table in drizzle/schema.ts

import type { DatabaseId, WithoutSystemFields } from './common';

// =============================================================================
// BASE WORKSPACE TYPES - Direct from database schema
// =============================================================================

/**
 * Workspace entity - exact match to database schema
 */
export interface Workspace {
  id: DatabaseId;
  userId: DatabaseId;
  name: string;
  createdAt: Date;
}

/**
 * Workspace insert type - for creating new workspaces
 */
export type WorkspaceInsert = WithoutSystemFields<Workspace>;

/**
 * Workspace update type - for updating existing workspaces
 */
export type WorkspaceUpdate = Partial<
  Omit<Workspace, 'id' | 'userId' | 'createdAt'>
>;

// =============================================================================
// COMPUTED WORKSPACE TYPES - With calculated fields and relationships
// =============================================================================

/**
 * Workspace with statistics - includes calculated stats
 */
export interface WorkspaceWithStats extends Workspace {
  stats: {
    totalLinks: number;
    totalFiles: number;
    totalFolders: number;
    totalBatches: number;
    storageUsed: number;
    lastActivity: Date | null;
  };
}

/**
 * Workspace with user info - includes user relationship
 */
export interface WorkspaceWithUser extends Workspace {
  user: {
    id: DatabaseId;
    email: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
  };
}

/**
 * Workspace summary - condensed info for listings
 */
export interface WorkspaceSummary {
  id: DatabaseId;
  name: string;
  userId: DatabaseId;
  totalItems: number;
  storageUsed: number;
  lastActivity: Date | null;
  createdAt: Date;
}

// =============================================================================
// WORKSPACE UTILITY TYPES - Helper types for specific use cases
// =============================================================================

/**
 * Workspace for authentication - minimal info needed for auth context
 */
export interface AuthWorkspace {
  id: DatabaseId;
  userId: DatabaseId;
  name: string;
}

/**
 * Workspace for navigation - info needed for navigation components
 */
export interface WorkspaceNavItem {
  id: DatabaseId;
  name: string;
  isActive: boolean;
  itemCount: number;
}

// =============================================================================
// WORKSPACE FORM TYPES - For form handling and validation
// =============================================================================

/**
 * Workspace creation form data
 */
export interface WorkspaceCreateForm {
  name: string;
}

/**
 * Workspace update form data
 */
export interface WorkspaceUpdateForm {
  name?: string;
}

// =============================================================================
// WORKSPACE VALIDATION TYPES - Validation rules and constraints
// =============================================================================

/**
 * Workspace validation constraints
 */
export interface WorkspaceValidationConstraints {
  name: {
    minLength: number;
    maxLength: number;
    pattern: RegExp;
    reservedWords: string[];
  };
}

/**
 * Workspace field validation errors
 */
export interface WorkspaceValidationErrors {
  name?: string[];
}

// =============================================================================
// WORKSPACE FILTER TYPES - For querying and filtering workspaces
// =============================================================================

/**
 * Workspace filter options
 */
export interface WorkspaceFilterOptions {
  userId?: DatabaseId;
  createdDateRange?: { start: Date; end: Date };
  hasActivity?: boolean;
  storageUsedRange?: { min: number; max: number };
}

/**
 * Workspace sort options
 */
export type WorkspaceSortField =
  | 'name'
  | 'createdAt'
  | 'lastActivity'
  | 'totalItems'
  | 'storageUsed';

/**
 * Workspace query options
 */
export interface WorkspaceQueryOptions {
  search?: string;
  filters?: WorkspaceFilterOptions;
  sort?: {
    field: WorkspaceSortField;
    order: 'asc' | 'desc';
  };
  include?: {
    user?: boolean;
    stats?: boolean;
  };
}

// =============================================================================
// WORKSPACE HELPER FUNCTIONS - Type-safe utility functions
// =============================================================================

/**
 * Check if workspace name is valid
 */
export const isValidWorkspaceName = (name: string): boolean => {
  return name.length >= 1 && name.length <= 255 && name.trim().length > 0;
};

/**
 * Create workspace display name
 */
export const createWorkspaceDisplayName = (
  workspace: Pick<Workspace, 'name'>
): string => {
  return workspace.name || 'Untitled Workspace';
};

/**
 * Check if workspace is new (created within last 7 days)
 */
export const isNewWorkspace = (
  workspace: Pick<Workspace, 'createdAt'>
): boolean => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  return workspace.createdAt > sevenDaysAgo;
};
