// =============================================================================
// USER TYPES - Database User Entity and Related Types
// =============================================================================
// 🎯 Based on users table in drizzle/schema.ts

import type {
  DatabaseId,
  TimestampFields,
  WithoutSystemFields,
  PartialBy,
} from './common';

// =============================================================================
// BASE USER TYPES - Direct from database schema
// =============================================================================

/**
 * User entity - exact match to database schema
 * Storage tracking removed - now calculated from files table
 */
export interface User extends TimestampFields {
  id: DatabaseId;
  email: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
}

/**
 * User insert type - for creating new users
 */
export type UserInsert = WithoutSystemFields<User>;

/**
 * User update type - for updating existing users
 */
export type UserUpdate = PartialBy<
  Omit<User, 'id' | 'createdAt' | 'updatedAt'>,
  'email' | 'username'
>;

// =============================================================================
// COMPUTED USER TYPES - With calculated fields and relationships
// =============================================================================

/**
 * User profile - displayable user information
 */
export interface UserProfile {
  id: DatabaseId;
  email: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  displayName: string;
  initials: string;
  memberSince: Date;
}

/**
 * User with workspace - includes workspace relationship
 */
export interface UserWithWorkspace extends User {
  workspace: {
    id: DatabaseId;
    name: string;
    createdAt: Date;
  };
}

/**
 * User with storage stats - includes calculated storage information
 * Now uses real-time calculation from files table
 */
export interface UserWithStorageStats extends User {
  storageUsedBytes: number;
  storageLimitBytes: number;
  storageUsedFormatted: string;
  storageLimitFormatted: string;
  storageUsedPercentage: number;
  storageAvailable: number;
  storageAvailableFormatted: string;
  isStorageNearLimit: boolean;
  isStorageFull: boolean;
  filesCount: number;
  planKey: string;
}

/**
 * User with activity stats - includes usage statistics
 */
export interface UserWithActivityStats extends User {
  stats: {
    totalLinks: number;
    totalFiles: number;
    totalFolders: number;
    totalUploads: number;
    lastActivity: Date | null;
    joinedDaysAgo: number;
  };
}

/**
 * Complete user profile - includes all computed fields
 */
export interface CompleteUserProfile
  extends UserProfile,
    Omit<UserWithStorageStats, keyof User>,
    Omit<UserWithActivityStats, keyof User> {
  // Additional computed fields
  isNewUser: boolean;
  isActiveUser: boolean;
  riskLevel: 'low' | 'medium' | 'high';
}

// =============================================================================
// USER UTILITY TYPES - Helper types for specific use cases
// =============================================================================

/**
 * User for authentication - minimal info needed for auth
 */
export interface AuthUser {
  id: DatabaseId;
  email: string;
  username: string;
  avatarUrl: string | null;
}

/**
 * User for listings - condensed info for lists
 */
export interface UserListItem {
  id: DatabaseId;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  memberSince: Date;
  isActive: boolean;
}

/**
 * User for sharing - public info safe to share
 */
export interface PublicUserProfile {
  id: DatabaseId;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  memberSince: Date;
  // Note: No email, subscription tier, or storage info for privacy
}

/**
 * User search result - for user search functionality
 */
export interface UserSearchResult {
  id: DatabaseId;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  matchReason: 'username' | 'displayName' | 'email';
  matchScore: number;
}

// =============================================================================
// USER FORM TYPES - For form handling and validation
// =============================================================================

/**
 * User registration form data
 */
export interface UserRegistrationForm {
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  password: string;
  confirmPassword: string;
}

/**
 * User profile update form data
 */
export interface UserProfileUpdateForm {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

/**
 * User account settings form data
 */
export interface UserAccountSettingsForm {
  email?: string;
  username?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmNewPassword?: string;
}

/**
 * User preferences form data
 */
export interface UserPreferencesForm {
  theme?: 'light' | 'dark' | 'auto';
  notifications?: {
    email: boolean;
    browser: boolean;
    marketing: boolean;
  };
  privacy?: {
    publicProfile: boolean;
    showActivity: boolean;
  };
}

// =============================================================================
// USER VALIDATION TYPES - Validation rules and constraints
// =============================================================================

/**
 * User validation constraints
 */
export interface UserValidationConstraints {
  username: {
    minLength: number;
    maxLength: number;
    pattern: RegExp;
    reservedWords: string[];
  };
  email: {
    pattern: RegExp;
    maxLength: number;
  };
  password: {
    minLength: number;
    maxLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSymbols: boolean;
  };
  displayName: {
    minLength: number;
    maxLength: number;
  };
}

/**
 * User field validation errors
 */
export interface UserValidationErrors {
  username?: string[];
  email?: string[];
  password?: string[];
  firstName?: string[];
  lastName?: string[];
  avatarUrl?: string[];
}

// =============================================================================
// USER FILTER TYPES - For querying and filtering users
// =============================================================================

/**
 * User filter options
 */
export interface UserFilterOptions {
  createdDateRange?: { start: Date; end: Date };
  isActive?: boolean;
  hasProfileComplete?: boolean;
  planKey?: string;
}

/**
 * User sort options
 */
export type UserSortField =
  | 'username'
  | 'email'
  | 'firstName'
  | 'lastName'
  | 'createdAt'
  | 'updatedAt';

/**
 * User query options
 */
export interface UserQueryOptions {
  search?: string;
  filters?: UserFilterOptions;
  sort?: {
    field: UserSortField;
    order: 'asc' | 'desc';
  };
  include?: {
    workspace?: boolean;
    stats?: boolean;
    features?: boolean;
  };
}

// =============================================================================
// USER HELPER FUNCTIONS - Type-safe utility functions
// =============================================================================

/**
 * Create display name from user data
 */
export const createDisplayName = (
  user: Pick<User, 'firstName' | 'lastName' | 'username'>
): string => {
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  if (user.firstName) {
    return user.firstName;
  }
  if (user.lastName) {
    return user.lastName;
  }
  return user.username;
};

/**
 * Create initials from user data
 */
export const createInitials = (
  user: Pick<User, 'firstName' | 'lastName' | 'username'>
): string => {
  if (user.firstName && user.lastName) {
    return `${user.firstName[0]?.toUpperCase() || ''}${user.lastName[0]?.toUpperCase() || ''}`;
  }
  if (user.firstName) {
    return user.firstName[0]?.toUpperCase() || '';
  }
  if (user.lastName) {
    return user.lastName[0]?.toUpperCase() || '';
  }
  return user.username[0]?.toUpperCase() || '';
};

/**
 * Check if user is new (created within last 7 days)
 */
export const isNewUser = (user: Pick<User, 'createdAt'>): boolean => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  return user.createdAt > sevenDaysAgo;
};

/**
 * Check if user storage is near limit (>80%)
 * Use with real-time storage data from storage service
 */
export const isStorageNearLimit = (storageInfo: {
  storageUsedBytes: number;
  storageLimitBytes: number;
}): boolean => {
  if (storageInfo.storageLimitBytes === 0) return false;
  return storageInfo.storageUsedBytes / storageInfo.storageLimitBytes > 0.8;
};

/**
 * Check if user storage is full (>95%)
 * Use with real-time storage data from storage service
 */
export const isStorageFull = (storageInfo: {
  storageUsedBytes: number;
  storageLimitBytes: number;
}): boolean => {
  if (storageInfo.storageLimitBytes === 0) return false;
  return storageInfo.storageUsedBytes / storageInfo.storageLimitBytes > 0.95;
};

/**
 * Calculate storage used percentage
 * Use with real-time storage data from storage service
 */
export const calculateStoragePercentage = (storageInfo: {
  storageUsedBytes: number;
  storageLimitBytes: number;
}): number => {
  if (storageInfo.storageLimitBytes === 0) return 0;
  return Math.round(
    (storageInfo.storageUsedBytes / storageInfo.storageLimitBytes) * 100
  );
};

/**
 * Format storage size to human readable format
 */
export const formatStorageSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};
