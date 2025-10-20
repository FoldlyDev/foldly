// =============================================================================
// LINK DATABASE QUERIES - Reusable Database Operations
// =============================================================================
// 🎯 Pure database queries for link operations (called by server actions)

import { db } from '@/lib/database/connection';
import { links, workspaces, users } from '@/lib/database/schemas';
import { eq } from 'drizzle-orm';
import type { Link } from '@/lib/database/schemas';

/**
 * Get link by slug (for shareable link access)
 * Used when external users visit foldly.com/{username}/{slug}
 */
export async function getLinkBySlug(slug: string) {
  return await db.query.links.findFirst({
    where: eq(links.slug, slug),
    with: {
      workspace: {
        with: {
          user: {
            columns: {
              username: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Get link by ID
 */
export async function getLinkById(linkId: string) {
  return await db.query.links.findFirst({
    where: eq(links.id, linkId),
  });
}

/**
 * Get all links for a workspace
 */
export async function getWorkspaceLinks(workspaceId: string) {
  return await db.query.links.findMany({
    where: eq(links.workspaceId, workspaceId),
    orderBy: (links, { desc }) => [desc(links.createdAt)],
  });
}

/**
 * Create a new shareable link
 */
export async function createLink(data: {
  workspaceId: string;
  slug: string;
  name: string;
  isPublic?: boolean;
}): Promise<Link> {
  const [link] = await db
    .insert(links)
    .values({
      id: crypto.randomUUID(),
      workspaceId: data.workspaceId,
      slug: data.slug,
      name: data.name,
      isPublic: data.isPublic ?? false,
      isActive: true,
    })
    .returning();

  if (!link) {
    throw new Error('Failed to create link: Database insert returned no rows');
  }

  return link;
}

/**
 * Update link details (name, slug, isPublic, isActive, linkConfig)
 * Generic update function for all link fields
 */
export async function updateLink(
  linkId: string,
  data: {
    name?: string;
    slug?: string;
    isPublic?: boolean;
    isActive?: boolean;
    linkConfig?: Link['linkConfig'];
    branding?: Link['branding'];
  }
): Promise<Link> {
  const [link] = await db
    .update(links)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(links.id, linkId))
    .returning();

  if (!link) {
    throw new Error(`Failed to update link: Link with ID ${linkId} not found or update failed`);
  }

  return link;
}

/**
 * Update link configuration (settings)
 */
export async function updateLinkConfig(
  linkId: string,
  config: Partial<Link['linkConfig']>
): Promise<Link> {
  // Get current config
  const currentLink = await getLinkById(linkId);
  if (!currentLink) {
    throw new Error('Link not found');
  }

  // Merge with existing config
  const updatedConfig = {
    ...currentLink.linkConfig,
    ...config,
  };

  const [link] = await db
    .update(links)
    .set({ linkConfig: updatedConfig, updatedAt: new Date() })
    .where(eq(links.id, linkId))
    .returning();

  if (!link) {
    throw new Error(`Failed to update link config: Link with ID ${linkId} not found or update failed`);
  }

  return link;
}

/**
 * Update link branding (visual identity settings)
 */
export async function updateLinkBranding(
  linkId: string,
  branding: Partial<Link['branding']>
): Promise<Link> {
  // Get current branding
  const currentLink = await getLinkById(linkId);
  if (!currentLink) {
    throw new Error('Link not found');
  }

  // Merge with existing branding
  const updatedBranding = {
    ...currentLink.branding,
    ...branding,
  };

  const [link] = await db
    .update(links)
    .set({ branding: updatedBranding, updatedAt: new Date() })
    .where(eq(links.id, linkId))
    .returning();

  if (!link) {
    throw new Error(`Failed to update link branding: Link with ID ${linkId} not found or update failed`);
  }

  return link;
}

/**
 * Check if slug is available (not taken by another link)
 * Used for slug validation during link creation/update
 */
export async function isSlugAvailable(
  slug: string,
  excludeLinkId?: string
): Promise<boolean> {
  const existingLink = await db.query.links.findFirst({
    where: eq(links.slug, slug),
    columns: {
      id: true,
    },
  });

  if (!existingLink) return true;
  if (excludeLinkId && existingLink.id === excludeLinkId) return true;
  return false;
}

/**
 * Get link with permissions (for management UI)
 * Includes permission entries for the link
 */
export async function getLinkWithPermissions(linkId: string) {
  return await db.query.links.findFirst({
    where: eq(links.id, linkId),
    with: {
      permissions: {
        orderBy: (permissions, { desc }) => [desc(permissions.createdAt)],
      },
    },
  });
}

/**
 * Get link by slug with permissions (for external access validation)
 */
export async function getLinkBySlugWithPermissions(slug: string) {
  return await db.query.links.findFirst({
    where: eq(links.slug, slug),
    with: {
      workspace: {
        with: {
          user: {
            columns: {
              username: true,
              email: true,
            },
          },
        },
      },
      permissions: true,
    },
  });
}

/**
 * Delete a link
 */
export async function deleteLink(linkId: string) {
  await db.delete(links).where(eq(links.id, linkId));
}
