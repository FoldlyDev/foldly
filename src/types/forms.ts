// Form Infrastructure Types - Generic form patterns
// Standard form field state and validation for all forms
// Following 2025 TypeScript best practices with strict type safety

// =============================================================================
// VALIDATION TYPES
// =============================================================================

/**
 * Standard validation error type for forms across the application
 * Used consistently across all features for validation errors
 */
export type ValidationError = string;

/**
 * Field validation errors map for form fields
 */
export type FieldValidationErrors<T extends Record<string, any>> = Partial<
  Record<keyof T, ValidationError>
>;

// =============================================================================
// FORM STATE PATTERNS
// =============================================================================

/**
 * Generic form field state
 */
export interface FormFieldState {
  readonly value: string;
  readonly error?: string;
  readonly isValid: boolean;
  readonly isLoading?: boolean;
}

/**
 * Generic form validation result
 */
export interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: Record<string, string>;
}
