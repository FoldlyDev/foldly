/**
 * Link Access Service - Handles link validation and access control
 */

import { db } from '@/lib/database/connection';
import { links, users } from '@/lib/database/schemas';
import { eq, and } from 'drizzle-orm';
import type { DatabaseResult } from '@/lib/database/types/common';
import { BillingService } from '@/features/billing/lib/services';
import type { LinkWithOwner } from '../../types';
import bcrypt from 'bcryptjs';

export class LinkAccessService {
  /**
   * Validate link access based on slug parts
   */
  async validateLinkAccess(
    slugParts: string[]
  ): Promise<DatabaseResult<LinkWithOwner>> {
    try {
      // Validate input
      if (!slugParts || !Array.isArray(slugParts) || slugParts.length === 0) {
        console.error('Invalid slugParts:', slugParts);
        return {
          success: false,
          error: 'Invalid link format',
        };
      }

      console.log('Validating link access for slugParts:', slugParts);

      let linkResult = null;

      if (slugParts.length === 1) {
        // Single slug - base link only
        const slug = slugParts[0];
        if (!slug) {
          return {
            success: false,
            error: 'Invalid slug',
          };
        }
        
        const baseResult = await db
          .select({
            links: links,
            users: users
          })
          .from(links)
          .innerJoin(users, eq(links.userId, users.id))
          .where(
            and(
              eq(links.slug, slug),
              eq(links.linkType, 'base')
            )
          )
          .limit(1);
        
        if (baseResult.length > 0) {
          linkResult = baseResult[0];
        }
      } else if (slugParts.length === 2) {
        // Two parts - could be custom link OR generated link
        const firstSlug = slugParts[0];
        const secondSlug = slugParts[1];
        
        if (!firstSlug || !secondSlug) {
          return {
            success: false,
            error: 'Invalid slug parts',
          };
        }
        
        // First try custom link (slug + topic)
        const customResult = await db
          .select({
            links: links,
            users: users
          })
          .from(links)
          .innerJoin(users, eq(links.userId, users.id))
          .where(
            and(
              eq(links.slug, firstSlug),
              eq(links.topic, secondSlug),
              eq(links.linkType, 'custom')
            )
          )
          .limit(1);
        
        if (customResult.length > 0) {
          linkResult = customResult[0];
        } else {
          // Try generated link (base slug + generated slug)
          const generatedResult = await db
            .select({
              links: links,
              users: users
            })
            .from(links)
            .innerJoin(users, eq(links.userId, users.id))
            .where(
              and(
                eq(links.slug, secondSlug), // The generated slug is the second part
                eq(links.linkType, 'generated')
              )
            )
            .limit(1);
          
          if (generatedResult.length > 0) {
            linkResult = generatedResult[0];
          }
        }
      } else {
        // Invalid URL structure
        return {
          success: false,
          error: 'Invalid link structure',
        };
      }

      if (!linkResult) {
        return {
          success: false,
          error: 'Link not found',
        };
      }

      const link = linkResult.links;
      const owner = linkResult.users;

      // Check if link is active
      if (!link.isActive) {
        return {
          success: false,
          error: 'This link is no longer active',
        };
      }

      // Check if link has expired
      if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
        return {
          success: false,
          error: 'This link has expired',
        };
      }

      // Get user's subscription plan
      const billingResult = await BillingService.getUserBillingData(owner.id);
      
      let storageLimit: number;
      let maxFileSize: number;
      
      if (!billingResult.success) {
        console.warn('Failed to get billing data, using free plan defaults:', billingResult.error);
        // Fallback to free plan defaults if billing service fails
        storageLimit = 50 * 1024 * 1024 * 1024; // 50GB in bytes
        maxFileSize = 5 * 1024 * 1024; // 5MB in bytes
      } else {
        storageLimit = billingResult.data.storageLimit;
        maxFileSize = 5 * 1024 * 1024; // Keep 5MB as default for now
      }

      const linkWithOwner: LinkWithOwner = {
        ...link,
        owner: {
          id: owner.id,
          username: owner.username,
          storageUsed: owner.storageUsed,
        },
        subscription: {
          storageLimit: storageLimit,
          maxFileSize: maxFileSize,
        },
      };

      return {
        success: true,
        data: linkWithOwner,
      };
    } catch (error) {
      console.error('Error validating link access:', error);
      console.error('Error type:', typeof error);
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      // Check if it's a database connection error
      if (error instanceof Error && error.message.includes('DATABASE_URL')) {
        return {
          success: false,
          error: 'Database connection not configured',
        };
      }
      
      return {
        success: false,
        error: 'Failed to validate link access',
      };
    }
  }

  /**
   * Validate link password
   */
  async validateLinkPassword(
    linkId: string,
    password: string
  ): Promise<DatabaseResult<{ isValid: boolean }>> {
    try {
      // Get link password hash
      const linkResult = await db
        .select({
          passwordHash: links.passwordHash,
        })
        .from(links)
        .where(eq(links.id, linkId))
        .limit(1);

      if (linkResult.length === 0) {
        return {
          success: false,
          error: 'Link not found',
        };
      }

      const linkData = linkResult[0];
      if (!linkData) {
        return {
          success: false,
          error: 'Link not found',
        };
      }

      const { passwordHash } = linkData;

      if (!passwordHash) {
        return {
          success: true,
          data: { isValid: true }, // No password required
        };
      }

      // Validate password
      const isValid = await bcrypt.compare(password, passwordHash);

      return {
        success: true,
        data: { isValid },
      };
    } catch (error) {
      console.error('Error validating password:', error);
      return {
        success: false,
        error: 'Failed to validate password',
      };
    }
  }
}

// Export singleton instance
export const linkAccessService = new LinkAccessService();