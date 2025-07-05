// Links Feature Form Types
// Centralized form data types and validation types used across components
// Following 2025 TypeScript best practices with strict type safety

import type { HexColor } from '@/types';
import type { LinkType } from './index';

// =============================================================================
// VALIDATION TYPES
// =============================================================================

/**
 * Standard validation error type for forms across the links feature
 * Replaces duplicated ValidationError types in components
 */
export type ValidationError = string;

/**
 * Field validation errors map for form fields
 */
export type FieldValidationErrors<T extends Record<string, any>> = Partial<
  Record<keyof T, ValidationError>
>;

// =============================================================================
// CREATE LINK FORM TYPES
// =============================================================================

/**
 * Steps in the create link form flow
 */
export type CreateLinkStep = 'information' | 'branding' | 'success';

/**
 * Complete form data for creating a link (used in create-link-form hook)
 */
export interface CreateLinkFormData {
  // Basic information
  title: string;
  topic: string;
  description: string;
  instructions: string;

  // Security settings
  requireEmail: boolean;
  requirePassword: boolean;
  password: string;
  isPublic: boolean;

  // Upload settings
  maxFiles: number;
  maxFileSize: number; // in MB
  allowedFileTypes: string[];
  expiresAt: string; // ISO date string
  autoCreateFolders: boolean;
  allowFolderCreation: boolean;

  // Branding
  brandingEnabled: boolean;
  brandColor: HexColor | '';
  accentColor: HexColor | '';
  logoUrl: string;
  customCss: string;
  welcomeMessage: string;
}

// =============================================================================
// SECTION-SPECIFIC FORM TYPES
// =============================================================================

/**
 * Form data for the link information section
 * Used in LinkInformationSection component
 */
export interface LinkInformationFormData {
  readonly name: string; // Collection name for base link OR topic for topic link
  readonly description: string; // Description/Welcome message
  readonly requireEmail: boolean;
  readonly maxFiles: number;
  readonly maxFileSize: number; // Maximum file size in MB
  readonly allowedFileTypes: string[]; // Array of allowed file types for multi-select
  readonly autoCreateFolders: boolean; // Auto-organize uploads by date
  readonly isPublic: boolean; // Public/Private visibility
  readonly requirePassword: boolean; // Password protection toggle
  readonly password?: string; // Password if required
  readonly isActive: boolean; // Link active/inactive status
  readonly expiresAt?: Date; // Optional expiration date
}

/**
 * Form data for the link branding section
 * Used in LinkBrandingSection component
 */
export interface LinkBrandingFormData {
  readonly brandingEnabled: boolean;
  readonly brandColor: HexColor;
  readonly accentColor: HexColor;
  readonly logoUrl: string;
}

/**
 * Form data for general settings in the settings modal
 * Used in GeneralSettingsModalSection component
 */
export interface GeneralSettingsData {
  isPublic: boolean;
  requireEmail: boolean;
  requirePassword: boolean;
  password: string;
  expiresAt: string | undefined;
  maxFiles: number | undefined;
  maxFileSize: number;
  allowedFileTypes: readonly string[];
  autoCreateFolders: boolean;
  allowMultiple: boolean;
  customMessage: string;
}

// =============================================================================
// FORM VALIDATION TYPES
// =============================================================================

/**
 * Validation rules for form fields
 */
export interface ValidationRule {
  readonly required?: boolean;
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly pattern?: RegExp;
  readonly min?: number;
  readonly max?: number;
  readonly message?: string;
}

/**
 * Field validation configuration
 */
export interface FieldValidation {
  readonly [fieldName: string]: ValidationRule;
}

// =============================================================================
// FORM STATE MANAGEMENT TYPES
// =============================================================================

/**
 * Form state interface for create link form store
 * Centralized from use-create-link-form hook
 */
export interface CreateLinkFormState {
  // Form data
  linkType: LinkType;
  formData: CreateLinkFormData;

  // UI state
  currentStep: CreateLinkStep;
  isValid: boolean;
  isSubmitting: boolean;

  // Success state
  createdLinkId: string | null;
  generatedUrl: string | null;

  // Error handling
  fieldErrors: Partial<Record<keyof CreateLinkFormData, string>>;
  generalError: string | null;
}

// =============================================================================
// FORM HANDLERS AND CALLBACKS
// =============================================================================

/**
 * Generic form change handler type
 */
export type FormChangeHandler<T> = (updates: Partial<T>) => void;

/**
 * Form submission handler type
 */
export type FormSubmitHandler<T> = (data: T) => Promise<void> | void;

/**
 * Form validation handler type
 */
export type FormValidationHandler<T extends Record<string, any>> = (
  data: T
) => FieldValidationErrors<T> | null;
