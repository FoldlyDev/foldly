/**
 * Links Feature Constants - Barrel Exports
 * Centralized export point for all links-related constants
 * Following 2025 TypeScript best practices with proper re-exports
 */

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
export type { ValidationRule, FieldValidation } from './validation';
