/**
 * Settings Schema Constants
 * Centralized form schema definitions for link settings
 * Following 2025 form management best practices
 */

import type { HexColor } from '@/types';

// =============================================================================
// SETTINGS CATEGORIES
// =============================================================================

export const SETTINGS_CATEGORIES = {
  GENERAL: 'general',
  SECURITY: 'security',
  UPLOADS: 'uploads',
  BRANDING: 'branding',
  ADVANCED: 'advanced',
} as const;

export type SettingsCategory =
  (typeof SETTINGS_CATEGORIES)[keyof typeof SETTINGS_CATEGORIES];

// =============================================================================
// FIELD TYPES AND CONFIGURATIONS
// =============================================================================

export const FIELD_TYPES = {
  TOGGLE: 'toggle',
  TEXT: 'text',
  PASSWORD: 'password',
  NUMBER: 'number',
  SELECT: 'select',
  MULTISELECT: 'multiselect',
  DATE: 'date',
  COLOR: 'color',
  FILE: 'file',
  TEXTAREA: 'textarea',
} as const;

export type FieldType = (typeof FIELD_TYPES)[keyof typeof FIELD_TYPES];

// =============================================================================
// SETTINGS FIELD INTERFACE
// =============================================================================

export interface SettingsField {
  readonly id: string;
  readonly type: FieldType;
  readonly category: SettingsCategory;
  readonly label: string;
  readonly description?: string;
  readonly placeholder?: string;
  readonly required?: boolean;
  readonly disabled?: boolean;
  readonly visible?: boolean;
  readonly order: number;
  readonly validation?: {
    readonly min?: number;
    readonly max?: number;
    readonly minLength?: number;
    readonly maxLength?: number;
    readonly pattern?: RegExp;
    readonly custom?: (value: any) => string | null;
  };
  readonly options?: readonly {
    readonly value: string | number | boolean;
    readonly label: string;
    readonly description?: string;
  }[];
  readonly dependsOn?: string; // Field ID that this field depends on
  readonly showWhen?: (values: Record<string, any>) => boolean;
}

// =============================================================================
// GENERAL SETTINGS FIELDS
// =============================================================================

export const GENERAL_SETTINGS_FIELDS: Record<string, SettingsField> = {
  isPublic: {
    id: 'isPublic',
    type: FIELD_TYPES.TOGGLE,
    category: SETTINGS_CATEGORIES.GENERAL,
    label: 'Public Access',
    description: 'Allow anyone with the link to access and upload files',
    required: false,
    order: 1,
  },

  customMessage: {
    id: 'customMessage',
    type: FIELD_TYPES.TEXTAREA,
    category: SETTINGS_CATEGORIES.GENERAL,
    label: 'Welcome Message',
    description: 'Custom message shown to uploaders on the link page',
    placeholder: 'Enter a welcome message for your uploaders...',
    required: false,
    order: 2,
    validation: {
      maxLength: 500,
    },
  },

  expiresAt: {
    id: 'expiresAt',
    type: FIELD_TYPES.DATE,
    category: SETTINGS_CATEGORIES.GENERAL,
    label: 'Expiration Date',
    description: 'When this link should stop accepting uploads',
    required: false,
    order: 3,
  },
} as const;

// =============================================================================
// SECURITY SETTINGS FIELDS
// =============================================================================

export const SECURITY_SETTINGS_FIELDS: Record<string, SettingsField> = {
  requireEmail: {
    id: 'requireEmail',
    type: FIELD_TYPES.TOGGLE,
    category: SETTINGS_CATEGORIES.SECURITY,
    label: 'Require Email',
    description: 'Uploaders must provide their email address',
    required: false,
    order: 1,
  },

  requirePassword: {
    id: 'requirePassword',
    type: FIELD_TYPES.TOGGLE,
    category: SETTINGS_CATEGORIES.SECURITY,
    label: 'Password Protection',
    description: 'Require a password to access this link',
    required: false,
    order: 2,
  },

  password: {
    id: 'password',
    type: FIELD_TYPES.PASSWORD,
    category: SETTINGS_CATEGORIES.SECURITY,
    label: 'Access Password',
    description: 'Password required to access this upload link',
    placeholder: 'Enter a secure password...',
    required: false,
    order: 3,
    dependsOn: 'requirePassword',
    showWhen: values => Boolean(values.requirePassword),
    validation: {
      minLength: 6,
      maxLength: 50,
    },
  },
} as const;

// =============================================================================
// UPLOAD SETTINGS FIELDS
// =============================================================================

export const UPLOAD_SETTINGS_FIELDS: Record<string, SettingsField> = {
  maxFiles: {
    id: 'maxFiles',
    type: FIELD_TYPES.NUMBER,
    category: SETTINGS_CATEGORIES.UPLOADS,
    label: 'Maximum Files',
    description: 'Maximum number of files per upload session',
    required: false,
    order: 1,
    validation: {
      min: 1,
      max: 1000,
    },
  },

  maxFileSize: {
    id: 'maxFileSize',
    type: FIELD_TYPES.SELECT,
    category: SETTINGS_CATEGORIES.UPLOADS,
    label: 'Maximum File Size',
    description: 'Maximum size per individual file',
    required: false,
    order: 2,
    options: [
      {
        value: 10,
        label: '10 MB',
        description: 'Good for documents and images',
      },
      {
        value: 25,
        label: '25 MB',
        description: 'Good for presentations and media',
      },
      {
        value: 50,
        label: '50 MB',
        description: 'Good for high-res images and videos',
      },
      {
        value: 100,
        label: '100 MB',
        description: 'Good for large files and archives',
      },
      { value: 250, label: '250 MB', description: 'Good for video files' },
      {
        value: 500,
        label: '500 MB',
        description: 'Good for large video files',
      },
      { value: 1000, label: '1 GB', description: 'Maximum size allowed' },
    ],
  },

  allowedFileTypes: {
    id: 'allowedFileTypes',
    type: FIELD_TYPES.MULTISELECT,
    category: SETTINGS_CATEGORIES.UPLOADS,
    label: 'Allowed File Types',
    description:
      'Restrict uploads to specific file types (leave empty to allow all)',
    required: false,
    order: 3,
    options: [
      { value: 'image/*', label: 'Images', description: 'JPG, PNG, GIF, etc.' },
      { value: 'video/*', label: 'Videos', description: 'MP4, MOV, AVI, etc.' },
      { value: 'audio/*', label: 'Audio', description: 'MP3, WAV, FLAC, etc.' },
      {
        value: 'application/pdf',
        label: 'PDF Documents',
        description: 'PDF files only',
      },
      {
        value:
          'application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        label: 'Word Documents',
        description: 'DOC, DOCX files',
      },
      {
        value:
          'application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        label: 'Excel Spreadsheets',
        description: 'XLS, XLSX files',
      },
      { value: 'text/*', label: 'Text Files', description: 'TXT, CSV, etc.' },
      {
        value: 'application/zip,application/x-rar-compressed',
        label: 'Archives',
        description: 'ZIP, RAR files',
      },
    ],
  },

  allowMultiple: {
    id: 'allowMultiple',
    type: FIELD_TYPES.TOGGLE,
    category: SETTINGS_CATEGORIES.UPLOADS,
    label: 'Multiple Files',
    description: 'Allow uploading multiple files at once',
    required: false,
    order: 4,
  },

  autoCreateFolders: {
    id: 'autoCreateFolders',
    type: FIELD_TYPES.TOGGLE,
    category: SETTINGS_CATEGORIES.UPLOADS,
    label: 'Auto-organize Uploads',
    description: 'Automatically organize uploads into date-based folders',
    required: false,
    order: 5,
  },
} as const;

// =============================================================================
// BRANDING SETTINGS FIELDS
// =============================================================================

export const BRANDING_SETTINGS_FIELDS: Record<string, SettingsField> = {
  brandingEnabled: {
    id: 'brandingEnabled',
    type: FIELD_TYPES.TOGGLE,
    category: SETTINGS_CATEGORIES.BRANDING,
    label: 'Custom Branding',
    description: 'Enable custom colors and logo for your upload page',
    required: false,
    order: 1,
  },

  brandColor: {
    id: 'brandColor',
    type: FIELD_TYPES.COLOR,
    category: SETTINGS_CATEGORIES.BRANDING,
    label: 'Primary Color',
    description: 'Main brand color for buttons and accents',
    required: false,
    order: 2,
    dependsOn: 'brandingEnabled',
    showWhen: values => Boolean(values.brandingEnabled),
  },

  accentColor: {
    id: 'accentColor',
    type: FIELD_TYPES.COLOR,
    category: SETTINGS_CATEGORIES.BRANDING,
    label: 'Accent Color',
    description: 'Secondary color for highlights and interactions',
    required: false,
    order: 3,
    dependsOn: 'brandingEnabled',
    showWhen: values => Boolean(values.brandingEnabled),
  },

  logoUrl: {
    id: 'logoUrl',
    type: FIELD_TYPES.FILE,
    category: SETTINGS_CATEGORIES.BRANDING,
    label: 'Custom Logo',
    description: 'Upload your logo to display on the upload page',
    required: false,
    order: 4,
    dependsOn: 'brandingEnabled',
    showWhen: values => Boolean(values.brandingEnabled),
  },
} as const;

// =============================================================================
// COMBINED SETTINGS SCHEMA
// =============================================================================

export const ALL_SETTINGS_FIELDS = {
  ...GENERAL_SETTINGS_FIELDS,
  ...SECURITY_SETTINGS_FIELDS,
  ...UPLOAD_SETTINGS_FIELDS,
  ...BRANDING_SETTINGS_FIELDS,
} as const;

// =============================================================================
// SETTINGS CATEGORIES CONFIGURATION
// =============================================================================

export const SETTINGS_CATEGORY_CONFIG = {
  [SETTINGS_CATEGORIES.GENERAL]: {
    label: 'General Settings',
    description: 'Basic link configuration and behavior',
    icon: 'settings',
    order: 1,
    fields: Object.keys(GENERAL_SETTINGS_FIELDS),
  },
  [SETTINGS_CATEGORIES.SECURITY]: {
    label: 'Security & Access',
    description: 'Control who can access and use your link',
    icon: 'shield',
    order: 2,
    fields: Object.keys(SECURITY_SETTINGS_FIELDS),
  },
  [SETTINGS_CATEGORIES.UPLOADS]: {
    label: 'Upload Settings',
    description: 'Configure file upload limits and restrictions',
    icon: 'upload',
    order: 3,
    fields: Object.keys(UPLOAD_SETTINGS_FIELDS),
  },
  [SETTINGS_CATEGORIES.BRANDING]: {
    label: 'Branding',
    description: 'Customize the appearance of your upload page',
    icon: 'palette',
    order: 4,
    fields: Object.keys(BRANDING_SETTINGS_FIELDS),
  },
} as const;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get all fields for a specific category
 */
export const getFieldsByCategory = (
  category: SettingsCategory
): SettingsField[] => {
  return Object.values(ALL_SETTINGS_FIELDS)
    .filter(field => field.category === category)
    .sort((a, b) => a.order - b.order);
};

/**
 * Get visible fields based on current form values
 */
export const getVisibleFields = (
  category: SettingsCategory,
  values: Record<string, any>
): SettingsField[] => {
  return getFieldsByCategory(category).filter(field => {
    if (field.visible === false) return false;
    if (field.showWhen) return field.showWhen(values);
    return true;
  });
};

/**
 * Get field by ID
 */
export const getFieldById = (fieldId: string): SettingsField | undefined => {
  return ALL_SETTINGS_FIELDS[fieldId as keyof typeof ALL_SETTINGS_FIELDS];
};
