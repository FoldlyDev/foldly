// =============================================================================
// PERMISSION DATABASE QUERIES - Reusable Database Operations
// =============================================================================
// 🎯 Pure database queries for permission operations (called by server actions)

import { db } from '@/lib/database/connection';
import { permissions } from '@/lib/database/schemas';
import { eq, and } from 'drizzle-orm';
import type { Permission, PermissionRole } from '@/lib/database/schemas';

/**
 * Create a new permission entry
 * Used when:
 * - Creating owner permission for new links
 * - Auto-adding uploader on first upload (public links)
 * - Promoting uploader to editor
 */
export async function createPermission(data: {
  linkId: string;
  email: string;
  role: PermissionRole;
}): Promise<Permission> {
  const [permission] = await db
    .insert(permissions)
    .values({
      id: crypto.randomUUID(),
      linkId: data.linkId,
      email: data.email,
      role: data.role,
      isVerified: data.role === 'owner' ? 'true' : 'false', // Owners are auto-verified
    })
    .returning();

  if (!permission) {
    throw new Error('Failed to create permission: Database insert returned no rows');
  }

  return permission;
}

/**
 * Get all permissions for a link
 */
export async function getLinkPermissions(linkId: string) {
  return await db.query.permissions.findMany({
    where: eq(permissions.linkId, linkId),
    orderBy: (permissions, { desc }) => [desc(permissions.createdAt)],
  });
}

/**
 * Get permission by link and email
 */
export async function getPermissionByLinkAndEmail(
  linkId: string,
  email: string
) {
  return await db.query.permissions.findFirst({
    where: and(eq(permissions.linkId, linkId), eq(permissions.email, email)),
  });
}

/**
 * Update permission role
 */
export async function updatePermission(
  permissionId: string,
  role: PermissionRole
): Promise<Permission> {
  const [updatedPermission] = await db
    .update(permissions)
    .set({ role })
    .where(eq(permissions.id, permissionId))
    .returning();

  if (!updatedPermission) {
    throw new Error(`Failed to update permission: Permission with ID ${permissionId} not found or update failed`);
  }

  return updatedPermission;
}

/**
 * Delete a permission entry
 */
export async function deletePermission(permissionId: string) {
  await db.delete(permissions).where(eq(permissions.id, permissionId));
}
