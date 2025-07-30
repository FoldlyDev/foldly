/**
 * Settings Defaults Constants
 * Centralized DEFAULT and FALLBACK values for link settings
 * Following 2025 best practices - only static defaults, no user-customizable values
 */

// Local form types for constants
interface GeneralSettingsData {
  title: string;
  description: string;
  requireEmail: boolean;
  requirePassword: boolean;
  isPublic: boolean;
  maxFiles: number;
  maxFileSize: number;
  expiresAt: Date | null;
}

interface LinkBrandingFormData {
  brandingEnabled: boolean;
  brandColor: string;
  accentColor: string;
  logoUrl: string;
}

// =============================================================================
// STRUCTURAL DEFAULTS (Not user-customizable)
// =============================================================================

/**
 * Default form field values for new forms
 * These are initial values, not user preferences
 */
export const FORM_FIELD_DEFAULTS = {
  // Security defaults
  isPublic: true,
  requireEmail: false,
  requirePassword: false,
  password: '',

  // Upload limits (business defaults)
  maxFiles: 100,
  maxFileSize: 5, // 5MB in MB (Supabase deployment limit)
  allowedFileTypes: [] as readonly string[], // Allow all by default
  allowMultiple: true,
  autoCreateFolders: false,

  // Text fields
  customMessage: '',
  title: '',
  description: '',
  instructions: '',
} as const;

// =============================================================================
// BRANDING STRUCTURE DEFAULTS (Not color values)
// =============================================================================

/**
 * Branding feature defaults - structure only, no colors
 * Colors should come from user preferences or theme system
 */
export const BRANDING_STRUCTURE_DEFAULTS = {
  brandingEnabled: false,
  logoUrl: '',
} as const;

// =============================================================================
// FORM-SPECIFIC DEFAULTS
// =============================================================================

/**
 * Default values for create link form initialization
 */
export const CREATE_LINK_FORM_DEFAULTS = {
  // Basic information
  title: FORM_FIELD_DEFAULTS.title,
  topic: '',
  description: FORM_FIELD_DEFAULTS.description,
  instructions: FORM_FIELD_DEFAULTS.instructions,

  // Security settings
  requireEmail: FORM_FIELD_DEFAULTS.requireEmail,
  requirePassword: FORM_FIELD_DEFAULTS.requirePassword,
  password: FORM_FIELD_DEFAULTS.password,
  isPublic: FORM_FIELD_DEFAULTS.isPublic,

  // Upload settings
  maxFiles: FORM_FIELD_DEFAULTS.maxFiles,
  maxFileSize: FORM_FIELD_DEFAULTS.maxFileSize,
  allowedFileTypes: [...FORM_FIELD_DEFAULTS.allowedFileTypes],
  expiresAt: '',
  autoCreateFolders: FORM_FIELD_DEFAULTS.autoCreateFolders,
  allowFolderCreation: true,

  // Branding structure (colors come from theme/user prefs)
  brandingEnabled: BRANDING_STRUCTURE_DEFAULTS.brandingEnabled,
  logoUrl: BRANDING_STRUCTURE_DEFAULTS.logoUrl,
  customCss: '',
  welcomeMessage: '',

  // Color placeholders - actual values should come from theme system
  brandColor: '' as const, // Will be populated from theme
  accentColor: '' as const, // Will be populated from theme
} as const;

/**
 * Default values for general settings modal initialization
 */
export const GENERAL_SETTINGS_MODAL_DEFAULTS: Omit<
  GeneralSettingsData,
  'brandColor' | 'accentColor'
> = {
  isPublic: FORM_FIELD_DEFAULTS.isPublic,
  requireEmail: FORM_FIELD_DEFAULTS.requireEmail,
  requirePassword: FORM_FIELD_DEFAULTS.requirePassword,
  password: FORM_FIELD_DEFAULTS.password,
  expiresAt: undefined,
  maxFiles: FORM_FIELD_DEFAULTS.maxFiles,
  maxFileSize: FORM_FIELD_DEFAULTS.maxFileSize,
  allowedFileTypes: [...FORM_FIELD_DEFAULTS.allowedFileTypes],
  autoCreateFolders: FORM_FIELD_DEFAULTS.autoCreateFolders,
  allowMultiple: FORM_FIELD_DEFAULTS.allowMultiple,
  customMessage: FORM_FIELD_DEFAULTS.customMessage,
};

// =============================================================================
// LINK TYPE SPECIFIC DEFAULTS (Business logic, not user prefs)
// =============================================================================

/**
 * Default settings based on link type - business rules only
 */
export const LINK_TYPE_DEFAULTS = {
  base: {
    maxFiles: 200, // Higher limit for personal collections
    autoCreateFolders: true, // Auto-organize for personal use
    brandingEnabled: true, // Enable branding capability for base links
  },
  topic: {
    maxFiles: 50, // Lower limit for specific topics
    autoCreateFolders: false, // Manual organization for topics
    brandingEnabled: false, // Simpler appearance for topics by default
  },
} as const;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get structural defaults based on link type
 * Does not include user-customizable colors or settings
 */
export const getStructuralDefaultsByLinkType = (
  linkType: 'base' | 'topic' | 'custom'
) => {
  const baseDefaults = FORM_FIELD_DEFAULTS;
  const typeSpecific =
    LINK_TYPE_DEFAULTS[linkType === 'custom' ? 'topic' : linkType];

  return {
    ...baseDefaults,
    ...typeSpecific,
  };
};

/**
 * Get default form data for create link form (structure only)
 */
export const getCreateLinkFormDefaults = () => ({
  ...CREATE_LINK_FORM_DEFAULTS,
});

/**
 * Get default form data for settings modal (structure only)
 */
export const getSettingsModalDefaults = () => ({
  ...GENERAL_SETTINGS_MODAL_DEFAULTS,
});

/**
 * Merge user settings with structural defaults
 * Only merges non-user-customizable values
 */
export const mergeWithStructuralDefaults = <T extends Record<string, any>>(
  userSettings: Partial<T>,
  structuralDefaults: T
): T => {
  // Only use defaults for undefined values, never override user settings
  const result: Record<string, any> = { ...structuralDefaults };

  Object.keys(userSettings).forEach(key => {
    if (userSettings[key] !== undefined && userSettings[key] !== null) {
      result[key] = userSettings[key];
    }
  });

  return result as T;
};
