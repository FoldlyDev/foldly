// Form Infrastructure Types - Generic form patterns
// Standard form field state and validation for all forms
// Following 2025 TypeScript best practices with strict type safety

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
