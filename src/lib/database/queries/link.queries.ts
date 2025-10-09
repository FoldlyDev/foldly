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

  return link;
}

/**
 * Update link active status (pause/resume)
 */
export async function updateLinkActiveStatus(
  linkId: string,
  isActive: boolean
): Promise<Link> {
  const [link] = await db
    .update(links)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(links.id, linkId))
    .returning();

  return link;
}

/**
 * Delete a link
 */
export async function deleteLink(linkId: string) {
  await db.delete(links).where(eq(links.id, linkId));
}
