'use server';

import { db } from '@/lib/database/connection';
import { links, users, subscription_plans } from '@/lib/database/schemas';
import { eq, and } from 'drizzle-orm';
import type { LinkWithOwner } from '../../types';
import type { ActionResult } from '@/types/actions';

interface ValidateLinkAccessParams {
  slugParts: string[];
}

export async function validateLinkAccessAction({
  slugParts,
}: ValidateLinkAccessParams): Promise<ActionResult<LinkWithOwner>> {
  try {
    let conditions;

    if (slugParts.length === 1) {
      // Single slug - base link only
      conditions = and(
        eq(links.slug, slugParts[0]),
        eq(links.link_type, 'base')
      );
    } else if (slugParts.length === 2) {
      // Two parts - could be custom link OR generated link
      // First check if it's a custom link (slug + topic)
      const customConditions = and(
        eq(links.slug, slugParts[0]),
        eq(links.topic, slugParts[1]),
        eq(links.link_type, 'custom')
      );
      
      // Also check if it's a generated link (base slug + generated slug)
      const generatedConditions = and(
        eq(links.slug, slugParts[1]), // The generated slug is the second part
        eq(links.link_type, 'generated')
      );
      
      // We'll need to check both possibilities
      // First try custom link
      const customResult = await db
        .select({
          link: links,
          owner: {
            id: users.id,
            username: users.username,
            storage_used: users.storage_used,
          },
        })
        .from(links)
        .innerJoin(users, eq(links.user_id, users.id))
        .where(customConditions)
        .limit(1);
      
      if (customResult.length > 0) {
        // Continue with custom link processing
        const { link, owner } = customResult[0];
        
        // Rest of the function will handle this
        conditions = customConditions;
      } else {
        // Try generated link
        conditions = generatedConditions;
      }
    } else {
      // Invalid URL structure
      return {
        success: false,
        error: 'Invalid link structure',
      };
    }

    // For two-part URLs, we already handled custom links above
    // Now fetch the final result
    const result = conditions ? await db
      .select({
        link: links,
        owner: {
          id: users.id,
          username: users.username,
          storage_used: users.storage_used,
        },
      })
      .from(links)
      .innerJoin(users, eq(links.user_id, users.id))
      .where(conditions)
      .limit(1) : [];

    if (result.length === 0) {
      return {
        success: false,
        error: 'Link not found',
      };
    }

    const { link, owner } = result[0];

    // Check if link is active
    if (!link.is_active) {
      return {
        success: false,
        error: 'This link is no longer active',
      };
    }

    // Check if link has expired
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return {
        success: false,
        error: 'This link has expired',
      };
    }

    // Get user's subscription plan - for now using free plan
    // TODO: Integrate with actual subscription system
    const planResult = await db
      .select({
        storage_limit_gb: subscription_plans.storage_limit_gb,
        max_file_size_mb: subscription_plans.max_file_size_mb,
      })
      .from(subscription_plans)
      .where(eq(subscription_plans.plan_key, 'free'))
      .limit(1);

    const plan = planResult[0] || {
      storage_limit_gb: 50,
      max_file_size_mb: 5,
    };

    const linkWithOwner: LinkWithOwner = {
      ...link,
      owner,
      subscription: {
        storageLimit: plan.storage_limit_gb * 1024 * 1024 * 1024, // Convert GB to bytes
        maxFileSize: plan.max_file_size_mb * 1024 * 1024, // Convert MB to bytes
      },
    };

    return {
      success: true,
      data: linkWithOwner,
    };
  } catch (error) {
    console.error('Error validating link access:', error);
    return {
      success: false,
      error: 'Failed to validate link access',
    };
  }
}