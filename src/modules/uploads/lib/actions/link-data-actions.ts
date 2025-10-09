// =============================================================================
// LINK DATA ACTIONS - Upload Link Validation & Access
// =============================================================================
// 🎯 Module-specific server actions for external uploader access to links

'use server';

import { getLinkBySlug } from '@/lib/database/queries';

/**
 * Validate link access for external uploaders
 *
 * URL Pattern: foldly.com/{username}/{slug}
 * slugParts[0] = username (informational, slug is globally unique)
 * slugParts[1] = actual link slug
 *
 * Validation Rules:
 * 1. Link must exist (by slug)
 * 2. Link must be active (isActive = true)
 * 3. Return link data with workspace info
 *
 * Note: Permission checking (for dedicated links) will be done in upload action
 * based on uploader email, not here (anyone can VIEW the upload page)
 */
export async function validateLinkAccessAction(data: { slugParts: string[] }) {
  const { slugParts } = data;

  // URL validation: must have username + slug
  if (!slugParts || slugParts.length < 2) {
    return {
      success: false as const,
      error: 'Invalid link format',
    };
  }

  // Extract slug (second part of URL)
  const linkSlug = slugParts[1];

  try {
    // Get link by slug with workspace + user data
    const link = await getLinkBySlug(linkSlug);

    // Link not found
    if (!link) {
      return {
        success: false as const,
        error: 'Link not found',
      };
    }

    // Link is paused/inactive
    if (!link.isActive) {
      return {
        success: false as const,
        error: 'This link is currently inactive',
      };
    }

    // Valid link - return data for upload page
    return {
      success: true as const,
      data: {
        linkId: link.id,
        linkName: link.name,
        slug: link.slug,
        isPublic: link.isPublic,
        customMessage: link.customMessage,
        requiresName: link.requiresName,
        requiresMessage: link.requiresMessage,
        workspaceId: link.workspaceId,
        ownerUsername: link.workspace?.user?.username || 'User',
      },
    };
  } catch (error) {
    console.error('Link validation error:', error);
    return {
      success: false as const,
      error: 'Failed to validate link',
    };
  }
}
