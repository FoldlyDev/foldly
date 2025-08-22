/**
 * Centralized configuration for base link defaults
 * This ensures consistency across all base link creation flows
 */

export const BASE_LINK_DEFAULTS = {
  // Default title for base links
  DEFAULT_TITLE: 'My Collection',
  
  // Alternative names used in UI
  DISPLAY_NAMES: {
    FULL: 'Personal Collection',
    SHORT: 'Base Link',
    POSSESSIVE: 'Personal Collection Link',
  },
  
  // Placeholder text
  PLACEHOLDER: 'My Collection',
  
  // Default description
  DEFAULT_DESCRIPTION: 'Upload your files here',
  
  // Settings
  MAX_FILES: 200,
  AUTO_CREATE_FOLDERS: true,
  BRANDING_ENABLED: true,
} as const;

// Export for convenience
export const DEFAULT_BASE_LINK_TITLE = BASE_LINK_DEFAULTS.DEFAULT_TITLE;