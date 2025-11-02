// =============================================================================
// ONBOARDING VALIDATION SCHEMAS - Onboarding-Specific Validations
// =============================================================================
// Extends base schemas from @/lib/validation with onboarding-specific logic

import { z } from 'zod';

// Import base schemas from global
import { usernameSchema } from '@/lib/validation/base-schemas';
import { validateInput } from '@/lib/utils/action-helpers';

// Re-export for convenience
export { validateInput };

// =============================================================================
// ONBOARDING INPUT SCHEMAS
// =============================================================================

/**
 * Schema for checking username availability
 * Validates: username (sanitized and validated)
 */
export const checkUsernameSchema = z.object({
  username: usernameSchema,
});

export type CheckUsernameInput = z.infer<typeof checkUsernameSchema>;

/**
 * Schema for completing onboarding
 * Validates: username (sanitized and validated)
 */
export const completeOnboardingSchema = z.object({
  username: usernameSchema,
});

export type CompleteOnboardingInput = z.infer<typeof completeOnboardingSchema>;

// =============================================================================
// RESPONSE TYPE DEFINITIONS
// =============================================================================

/**
 * Response type for checkOnboardingStatus
 */
export type OnboardingStatusResult = {
  hasWorkspace: boolean;
  workspaceId: string | null;
};

/**
 * Response type for checkUsernameAvailability
 */
export type UsernameAvailabilityResult = {
  isAvailable: boolean;
  message: string;
};

/**
 * Response type for completeOnboardingAction
 */
export type CompleteOnboardingResult = {
  user: {
    id: string;
    email: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
  };
  workspace: {
    id: string;
    userId: string;
    name: string;
  };
  link: {
    id: string;
    workspaceId: string;
    slug: string;
    name: string;
    isPublic: boolean;
    isActive: boolean;
  };
  permission: {
    id: string;
    linkId: string;
    email: string;
    role: 'owner';
    isVerified: 'true';
    verifiedAt: Date;
  };
  folder: {
    id: string;
    workspaceId: string;
    linkId: string;
    parentFolderId: null;
    name: string;
  };
};
