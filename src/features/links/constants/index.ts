/**
 * Links Feature Constants - Barrel Exports
 * Centralized export point for all links-related constants
 * Following 2025 TypeScript best practices with proper re-exports
 */

// UI Text - All user-facing text, labels, and messages
export * from './ui-text';

// Component Configuration - Sizes, styling, animations
export * from './components';

// Default Values - Form defaults, component defaults, etc.
export * from './defaults';

// File type and upload configurations
export * from './file-types';
export type { FileTypeOption, FileSizeOption } from './file-types';

// UI states, status configurations, and styling
export * from './ui-states';
export type {
  LinkStatus,
  StatusSize,
  ColorType,
  StatusConfig,
  ColorClasses,
} from './ui-states';

// Social sharing configurations
export * from './social-sharing';
export type { SocialShareConfig } from './social-sharing';

// Static UI color constants (NOT for user-customizable brand colors)
export * from './colors';
export type { HexColor } from './colors';

// Form validation rules and patterns
export * from './validation';

// Settings schema, defaults, and validation
export * from './settings-schema';
export type {
  SettingsField,
  SettingsCategory,
  FieldType,
} from './settings-schema';

export * from './settings-defaults';

export * from './settings-validation';
