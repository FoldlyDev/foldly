'use server';

import { z } from 'zod';
import { linksDbService } from '../db-service';
import { requireAuth } from './shared';
import { slugSchema, type ActionResult } from '../validations';
import { normalizeSlug, validateSlugLength } from '../utils/slug-normalization';
import { hasFeature } from '@/features/billing/lib/services/clerk-billing-integration';

/**
 * Schema for checking slug availability
 */
const checkSlugAvailabilitySchema = z.object({
  slug: slugSchema.refine(slug => slug && slug.length > 0, {
    message: 'Slug is required for availability check',
  }),
  excludeId: z.string().uuid().optional(), // Exclude current link when editing
});

export type CheckSlugAvailabilityInput = z.infer<
  typeof checkSlugAvailabilitySchema
>;

export interface SlugAvailabilityResult {
  available: boolean;
  slug: string;
  message: string;
}

/**
 * Check if a slug is available for use
 * Used for real-time validation during link creation/editing
 */
export async function checkSlugAvailabilityAction(
  input: CheckSlugAvailabilityInput
): Promise<ActionResult<SlugAvailabilityResult>> {
  try {
    // 1. Authenticate user (ensure valid session)
    await requireAuth();

    // 2. Validate input and normalize slug
    const validatedData = checkSlugAvailabilitySchema.parse(input);
    const { excludeId } = validatedData;

    // Ensure slug is defined (schema validation should guarantee this)
    if (!validatedData.slug) {
      return {
        success: false,
        error: 'Slug is required for availability check',
      };
    }

    const slug = normalizeSlug(validatedData.slug); // Normalize to lowercase

    // 3. Check plan-based length restriction
    const hasPremiumShortLinks = await hasFeature('premium_short_links');
    const lengthValidation = validateSlugLength(slug, hasPremiumShortLinks);

    if (!lengthValidation.isValid) {
      return {
        success: true,
        data: {
          available: false,
          slug,
          message: lengthValidation.error!,
        },
      };
    }

    // 4. Check if slug is globally available (base links must be globally unique)
    // Use getBySlugAndTopic to search globally across all users for base links
    const existingLinkResult = await linksDbService.getBySlugAndTopic(
      slug,
      null
    );

    if (!existingLinkResult.success) {
      return {
        success: false,
        error: 'Failed to check slug availability',
      };
    }

    const conflictingLink = existingLinkResult.data;

    // Check if there's a conflicting base link (excluding current one if editing)
    const hasConflict =
      conflictingLink &&
      conflictingLink.linkType === 'base' &&
      (!excludeId || conflictingLink.id !== excludeId);

    if (hasConflict) {
      return {
        success: true,
        data: {
          available: false,
          slug,
          message: 'This slug is not available.',
        },
      };
    }

    // 5. Check against reserved slugs
    const reservedSlugs = [
      'api',
      'app',
      'www',
      'admin',
      'dashboard',
      'settings',
      'help',
      'support',
      'blog',
      'about',
      'contact',
      'privacy',
      'terms',
      'login',
      'signup',
      'register',
      'auth',
      'oauth',
      'callback',
      'webhook',
      'assets',
      'static',
      'public',
      'upload',
      'download',
      'share',
      'embed',
      'widget',
      'iframe',
      'root',
      'home',
      'index',
      'main',
      'default',
      'foldly',
      'undefined',
      'null',
    ];

    if (reservedSlugs.includes(slug)) {
      // slug is already normalized to lowercase
      return {
        success: true,
        data: {
          available: false,
          slug,
          message: 'This slug is not available.',
        },
      };
    }

    // 6. Slug is available
    return {
      success: true,
      data: {
        available: true,
        slug,
        message: 'This slug is available.',
      },
    };
  } catch (error) {
    console.error('Check slug availability error:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid slug format',
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
