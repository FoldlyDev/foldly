// =============================================================================
// LINK VALIDATION ACTIONS
// =============================================================================
// Validation operations for link-related checks
// Uses withLinkAuthInput HOF to eliminate boilerplate
// Includes strict rate limiting to prevent enumeration attacks

'use server';

import { isSlugAvailable } from '@/lib/database/queries';
import {
  withLinkAuthInput,
  type LinkActionResponse,
} from './action-helpers';
import {
  ACTION_NAMES,
  ERROR_MESSAGES,
} from '../validation/constants';
import {
  checkSlugSchema,
  validateInput,
  type CheckSlugInput,
} from '../validation/link-schemas';
import { checkRateLimit, RateLimitPresets, RateLimitKeys } from '@/lib/middleware/rate-limit';
import { logRateLimitViolation } from '@/lib/utils/logger';

// =============================================================================
// VALIDATION ACTIONS
// =============================================================================

/**
 * Check if a slug is available
 * Requires authentication to prevent abuse
 * Rate limited: 30 requests per minute (strict to prevent slug enumeration)
 *
 * @param data - Object containing slug to check
 * @returns Availability status (true = available, false = taken)
 *
 * @example
 * ```typescript
 * const result = await checkSlugAvailabilityAction({ slug: 'my-slug' });
 * if (result.success && result.data) {
 *   console.log('Slug is available');
 * }
 * ```
 */
export const checkSlugAvailabilityAction = withLinkAuthInput<
  CheckSlugInput,
  boolean
>(ACTION_NAMES.CHECK_SLUG_AVAILABILITY, async (userId, input) => {
  // Validate input (includes slug sanitization)
  const validated = validateInput(checkSlugSchema, input);

  // Rate limiting: 30 requests/minute (strict to prevent slug enumeration)
  const rateLimitKey = RateLimitKeys.userAction(userId, 'check-slug');
  const rateLimitResult = await checkRateLimit(rateLimitKey, RateLimitPresets.SLUG_VALIDATION);

  if (!rateLimitResult.allowed) {
    logRateLimitViolation('Slug availability check rate limit exceeded', {
      userId,
      action: ACTION_NAMES.CHECK_SLUG_AVAILABILITY,
      limit: RateLimitPresets.SLUG_VALIDATION.limit,
      window: RateLimitPresets.SLUG_VALIDATION.windowMs,
      attempts:
        RateLimitPresets.SLUG_VALIDATION.limit - rateLimitResult.remaining,
    });

    throw {
      success: false,
      error: ERROR_MESSAGES.RATE_LIMIT.EXCEEDED,
      blocked: true,
      resetAt: rateLimitResult.resetAt,
    } as const;
  }

  // Check availability
  const available = await isSlugAvailable(validated.slug);

  return {
    success: true,
    data: available,
  } as const;
});
