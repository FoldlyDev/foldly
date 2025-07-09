/**
 * Settings Validation Constants
 * Centralized validation rules and functions for link settings
 * Following 2025 form validation best practices
 */

import type { ValidationError, FieldValidationErrors } from '../../types/forms';

// =============================================================================
// VALIDATION RULES
// =============================================================================

export const VALIDATION_RULES = {
  // Password validation
  PASSWORD: {
    MIN_LENGTH: 6,
    MAX_LENGTH: 50,
    REQUIRED_WHEN_ENABLED: true,
  },

  // File constraints
  FILE_SIZE: {
    MIN_MB: 1,
    MAX_MB: 1000, // 1GB max
    DEFAULT_MB: 100,
  },

  // File limits
  FILE_COUNT: {
    MIN: 1,
    MAX: 1000,
    DEFAULT: 100,
  },

  // Text fields
  CUSTOM_MESSAGE: {
    MAX_LENGTH: 500,
  },

  // URLs
  LOGO_URL: {
    MAX_LENGTH: 2000,
    ALLOWED_PROTOCOLS: ['http:', 'https:', 'data:'],
    ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
  },

  // Colors
  COLOR: {
    HEX_PATTERN: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  },
} as const;

// =============================================================================
// VALIDATION MESSAGES
// =============================================================================

export const SETTINGS_VALIDATION_MESSAGES = {
  REQUIRED: 'This field is required',
  INVALID_FORMAT: 'Invalid format',

  // Password messages
  PASSWORD_TOO_SHORT: `Password must be at least ${VALIDATION_RULES.PASSWORD.MIN_LENGTH} characters`,
  PASSWORD_TOO_LONG: `Password must be no more than ${VALIDATION_RULES.PASSWORD.MAX_LENGTH} characters`,
  PASSWORD_REQUIRED_WHEN_ENABLED:
    'Password is required when password protection is enabled',

  // File size messages
  FILE_SIZE_TOO_SMALL: `File size must be at least ${VALIDATION_RULES.FILE_SIZE.MIN_MB}MB`,
  FILE_SIZE_TOO_LARGE: `File size must be no more than ${VALIDATION_RULES.FILE_SIZE.MAX_MB}MB`,
  FILE_SIZE_INVALID: 'Invalid file size',

  // File count messages
  FILE_COUNT_TOO_LOW: `Must allow at least ${VALIDATION_RULES.FILE_COUNT.MIN} file`,
  FILE_COUNT_TOO_HIGH: `Cannot exceed ${VALIDATION_RULES.FILE_COUNT.MAX} files`,
  FILE_COUNT_INVALID: 'Invalid file count',

  // Text messages
  CUSTOM_MESSAGE_TOO_LONG: `Message must be no more than ${VALIDATION_RULES.CUSTOM_MESSAGE.MAX_LENGTH} characters`,

  // URL messages
  LOGO_URL_TOO_LONG: `URL must be no more than ${VALIDATION_RULES.LOGO_URL.MAX_LENGTH} characters`,
  LOGO_URL_INVALID_PROTOCOL:
    'URL must start with http://, https://, or be a data URL',
  LOGO_URL_INVALID_EXTENSION:
    'Logo must be an image file (.jpg, .png, .gif, .webp, or .svg)',

  // Color messages
  COLOR_INVALID_FORMAT: 'Color must be a valid hex color (e.g., #FF0000)',

  // Date messages
  DATE_INVALID: 'Invalid date format',
  DATE_IN_PAST: 'Expiration date cannot be in the past',
} as const;

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Validate password field
 */
export const validatePassword = (
  password: string,
  requirePassword: boolean
): ValidationError | null => {
  // If password protection is disabled, password is not required
  if (!requirePassword) {
    return null;
  }

  // If password protection is enabled, password is required
  if (!password || password.trim() === '') {
    return SETTINGS_VALIDATION_MESSAGES.PASSWORD_REQUIRED_WHEN_ENABLED;
  }

  // Check length constraints
  if (password.length < VALIDATION_RULES.PASSWORD.MIN_LENGTH) {
    return SETTINGS_VALIDATION_MESSAGES.PASSWORD_TOO_SHORT;
  }

  if (password.length > VALIDATION_RULES.PASSWORD.MAX_LENGTH) {
    return SETTINGS_VALIDATION_MESSAGES.PASSWORD_TOO_LONG;
  }

  return null;
};

/**
 * Validate file size in MB
 */
export const validateFileSize = (sizeInMB: number): ValidationError | null => {
  if (isNaN(sizeInMB) || sizeInMB <= 0) {
    return SETTINGS_VALIDATION_MESSAGES.FILE_SIZE_INVALID;
  }

  if (sizeInMB < VALIDATION_RULES.FILE_SIZE.MIN_MB) {
    return SETTINGS_VALIDATION_MESSAGES.FILE_SIZE_TOO_SMALL;
  }

  if (sizeInMB > VALIDATION_RULES.FILE_SIZE.MAX_MB) {
    return SETTINGS_VALIDATION_MESSAGES.FILE_SIZE_TOO_LARGE;
  }

  return null;
};

/**
 * Validate maximum file count
 */
export const validateFileCount = (count: number): ValidationError | null => {
  if (isNaN(count) || count <= 0) {
    return SETTINGS_VALIDATION_MESSAGES.FILE_COUNT_INVALID;
  }

  if (count < VALIDATION_RULES.FILE_COUNT.MIN) {
    return SETTINGS_VALIDATION_MESSAGES.FILE_COUNT_TOO_LOW;
  }

  if (count > VALIDATION_RULES.FILE_COUNT.MAX) {
    return SETTINGS_VALIDATION_MESSAGES.FILE_COUNT_TOO_HIGH;
  }

  return null;
};

/**
 * Validate custom message length
 */
export const validateCustomMessage = (
  message: string
): ValidationError | null => {
  if (message.length > VALIDATION_RULES.CUSTOM_MESSAGE.MAX_LENGTH) {
    return SETTINGS_VALIDATION_MESSAGES.CUSTOM_MESSAGE_TOO_LONG;
  }

  return null;
};

/**
 * Validate logo URL
 */
export const validateLogoUrl = (url: string): ValidationError | null => {
  if (!url || url.trim() === '') {
    return null; // Empty URL is valid (no logo)
  }

  // Check length
  if (url.length > VALIDATION_RULES.LOGO_URL.MAX_LENGTH) {
    return SETTINGS_VALIDATION_MESSAGES.LOGO_URL_TOO_LONG;
  }

  try {
    const urlObj = new URL(url);

    // Check protocol
    if (
      !VALIDATION_RULES.LOGO_URL.ALLOWED_PROTOCOLS.includes(
        urlObj.protocol as any
      )
    ) {
      return SETTINGS_VALIDATION_MESSAGES.LOGO_URL_INVALID_PROTOCOL;
    }

    // For data URLs, we allow them (base64 images)
    if (urlObj.protocol === 'data:') {
      return null;
    }

    // For http/https URLs, check file extension
    const pathname = urlObj.pathname.toLowerCase();
    const hasValidExtension = VALIDATION_RULES.LOGO_URL.ALLOWED_EXTENSIONS.some(
      ext => pathname.endsWith(ext)
    );

    if (!hasValidExtension) {
      return SETTINGS_VALIDATION_MESSAGES.LOGO_URL_INVALID_EXTENSION;
    }
  } catch {
    return SETTINGS_VALIDATION_MESSAGES.LOGO_URL_INVALID_PROTOCOL;
  }

  return null;
};

/**
 * Validate hex color
 */
export const validateHexColor = (color: string): ValidationError | null => {
  if (!color || color.trim() === '') {
    return null; // Empty color is valid (use default)
  }

  if (!VALIDATION_RULES.COLOR.HEX_PATTERN.test(color)) {
    return SETTINGS_VALIDATION_MESSAGES.COLOR_INVALID_FORMAT;
  }

  return null;
};

/**
 * Validate expiration date
 */
export const validateExpirationDate = (
  dateString: string
): ValidationError | null => {
  if (!dateString || dateString.trim() === '') {
    return null; // No expiration is valid
  }

  try {
    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return SETTINGS_VALIDATION_MESSAGES.DATE_INVALID;
    }

    // Check if date is in the future
    const now = new Date();
    if (date <= now) {
      return SETTINGS_VALIDATION_MESSAGES.DATE_IN_PAST;
    }
  } catch {
    return SETTINGS_VALIDATION_MESSAGES.DATE_INVALID;
  }

  return null;
};

// =============================================================================
// COMPREHENSIVE VALIDATION FUNCTIONS
// =============================================================================

/**
 * Validate general settings data
 */
export const validateGeneralSettings = (data: {
  requirePassword: boolean;
  password: string;
  maxFiles?: number;
  maxFileSize: number;
  customMessage?: string;
  expiresAt?: string;
}): FieldValidationErrors<typeof data> => {
  const errors: FieldValidationErrors<typeof data> = {};

  // Validate password
  const passwordError = validatePassword(data.password, data.requirePassword);
  if (passwordError) {
    errors.password = passwordError;
  }

  // Validate file count
  if (data.maxFiles !== undefined) {
    const fileCountError = validateFileCount(data.maxFiles);
    if (fileCountError) {
      errors.maxFiles = fileCountError;
    }
  }

  // Validate file size
  const fileSizeError = validateFileSize(data.maxFileSize);
  if (fileSizeError) {
    errors.maxFileSize = fileSizeError;
  }

  // Validate custom message
  if (data.customMessage) {
    const messageError = validateCustomMessage(data.customMessage);
    if (messageError) {
      errors.customMessage = messageError;
    }
  }

  // Validate expiration date
  if (data.expiresAt) {
    const dateError = validateExpirationDate(data.expiresAt);
    if (dateError) {
      errors.expiresAt = dateError;
    }
  }

  return errors;
};

/**
 * Validate branding settings data
 */
export const validateBrandingSettings = (data: {
  brandingEnabled: boolean;
  brandColor?: string;
  accentColor?: string;
  logoUrl?: string;
}): FieldValidationErrors<typeof data> => {
  const errors: FieldValidationErrors<typeof data> = {};

  // Only validate branding fields if branding is enabled
  if (data.brandingEnabled) {
    // Validate brand color
    if (data.brandColor) {
      const brandColorError = validateHexColor(data.brandColor);
      if (brandColorError) {
        errors.brandColor = brandColorError;
      }
    }

    // Validate accent color
    if (data.accentColor) {
      const accentColorError = validateHexColor(data.accentColor);
      if (accentColorError) {
        errors.accentColor = accentColorError;
      }
    }

    // Validate logo URL
    if (data.logoUrl) {
      const logoError = validateLogoUrl(data.logoUrl);
      if (logoError) {
        errors.logoUrl = logoError;
      }
    }
  }

  return errors;
};

/**
 * Check if validation errors object has any errors
 */
export const hasValidationErrors = (
  errors: FieldValidationErrors<any>
): boolean => {
  return Object.values(errors).some(
    error => error !== undefined && error !== null
  );
};

/**
 * Get the first validation error message
 */
export const getFirstValidationError = (
  errors: FieldValidationErrors<any>
): string | null => {
  const firstError = Object.values(errors).find(
    error => error !== undefined && error !== null
  );
  return firstError || null;
};
