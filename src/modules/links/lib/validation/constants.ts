// =============================================================================
// LINK MODULE CONSTANTS - Re-exports from Global Constants
// =============================================================================
// This file re-exports global constants for backward compatibility
// All constants have been moved to @/lib/constants

// Re-export error messages from global
export { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/lib/constants/error-messages';

// Re-export validation limits and reserved slugs from global
export { VALIDATION_LIMITS, RESERVED_SLUGS, type ReservedSlug } from '@/lib/constants/validation';
