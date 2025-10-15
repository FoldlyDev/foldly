// =============================================================================
// ERROR MESSAGES - Centralized Error Messages
// =============================================================================
// All user-facing error messages organized by domain
// Update this file when adding new error scenarios

export const ERROR_MESSAGES = {
  // Authentication errors
  AUTH: {
    UNAUTHORIZED: 'Unauthorized. Please sign in.',
    SESSION_EXPIRED: 'Your session has expired. Please sign in again.',
    INVALID_TOKEN: 'Invalid authentication token.',
  },

  // Workspace errors
  WORKSPACE: {
    NOT_FOUND: 'Workspace not found. Please complete onboarding.',
    ACCESS_DENIED: 'You do not have access to this workspace.',
    UPDATE_FAILED: 'Failed to update workspace. Please try again.',
    CREATION_FAILED: 'Failed to create workspace. Please try again.',
  },

  // Link errors
  LINK: {
    NOT_FOUND: 'Link not found.',
    ACCESS_DENIED: 'You do not have permission to access this link.',
    SLUG_TAKEN: 'This slug is already in use. Please choose a different one.',
    SLUG_RESERVED: 'This slug is reserved and cannot be used.',
    CREATION_FAILED: 'Failed to create link. Please try again.',
    UPDATE_FAILED: 'Failed to update link. Please try again.',
    DELETE_FAILED: 'Failed to delete link. Please try again.',
    CONFIG_UPDATE_FAILED: 'Failed to update link configuration. Please try again.',
    INVALID_CONFIG: 'Invalid link configuration.',
  },

  // Folder errors (for future use)
  FOLDER: {
    NOT_FOUND: 'Folder not found.',
    ACCESS_DENIED: 'You do not have permission to access this folder.',
    CREATION_FAILED: 'Failed to create folder. Please try again.',
    UPDATE_FAILED: 'Failed to update folder. Please try again.',
    DELETE_FAILED: 'Failed to delete folder. Please try again.',
    CIRCULAR_REFERENCE: 'Cannot move folder into its own subfolder.',
    NAME_REQUIRED: 'Folder name is required.',
  },

  // File errors (for future use)
  FILE: {
    NOT_FOUND: 'File not found.',
    ACCESS_DENIED: 'You do not have permission to access this file.',
    UPLOAD_FAILED: 'Failed to upload file. Please try again.',
    DELETE_FAILED: 'Failed to delete file. Please try again.',
    SIZE_EXCEEDED: 'File size exceeds maximum allowed size.',
    INVALID_TYPE: 'File type not allowed.',
    DOWNLOAD_FAILED: 'Failed to download file. Please try again.',
  },

  // Permission errors
  PERMISSION: {
    NOT_FOUND: 'Permission not found.',
    ALREADY_EXISTS: 'Permission already exists for this email.',
    CANNOT_REMOVE_OWNER: 'Cannot remove owner permission.',
    INVALID_ROLE: 'Invalid permission role.',
    ADD_FAILED: 'Failed to add permission. Please try again.',
    REMOVE_FAILED: 'Failed to remove permission. Please try again.',
    UPDATE_FAILED: 'Failed to update permission. Please try again.',
  },

  // Validation errors
  VALIDATION: {
    INVALID_INPUT: 'Invalid input provided.',
    INVALID_UUID: 'Invalid ID format.',
    INVALID_EMAIL: 'Invalid email format.',
    INVALID_SLUG: 'Invalid slug format.',
    REQUIRED_FIELD: 'This field is required.',
  },

  // Rate limiting errors
  RATE_LIMIT: {
    EXCEEDED: 'Too many requests. Please try again later.',
    BLOCKED: 'You have been temporarily blocked due to too many requests.',
  },

  // Generic errors
  GENERIC: {
    UNEXPECTED: 'An unexpected error occurred.',
    DATABASE_ERROR: 'Database error. Please try again.',
    SERVER_ERROR: 'Server error. Please try again later.',
    NOT_IMPLEMENTED: 'This feature is not yet implemented.',
  },
} as const;

/**
 * Success messages for user feedback
 */
export const SUCCESS_MESSAGES = {
  LINK: {
    CREATED: 'Link created successfully.',
    UPDATED: 'Link updated successfully.',
    DELETED: 'Link deleted successfully.',
    CONFIG_UPDATED: 'Link configuration updated successfully.',
  },

  FOLDER: {
    CREATED: 'Folder created successfully.',
    UPDATED: 'Folder updated successfully.',
    DELETED: 'Folder deleted successfully.',
    MOVED: 'Folder moved successfully.',
  },

  FILE: {
    UPLOADED: 'File uploaded successfully.',
    DELETED: 'File deleted successfully.',
    DOWNLOADED: 'File downloaded successfully.',
  },

  PERMISSION: {
    ADDED: 'Permission added successfully.',
    REMOVED: 'Permission removed successfully.',
    UPDATED: 'Permission updated successfully.',
  },

  WORKSPACE: {
    UPDATED: 'Workspace updated successfully.',
    CREATED: 'Workspace created successfully.',
  },

  USER: {
    PROFILE_UPDATED: 'Profile updated successfully.',
    EMAIL_VERIFIED: 'Email verified successfully.',
  },
} as const;
