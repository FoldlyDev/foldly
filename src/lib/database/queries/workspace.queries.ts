// =============================================================================
// WORKSPACE DATABASE QUERIES - Reusable Database Operations
// =============================================================================
// 🎯 Pure database queries for workspace operations (called by server actions)

import { db } from '@/lib/database/connection';
import { workspaces, users } from '@/lib/database/schemas';
import { eq } from 'drizzle-orm';
import type { Workspace, NewWorkspace } from '@/lib/database/schemas';

/**
 * Get workspace by userId (1:1 relationship in MVP)
 * Returns workspace with user relation
 */
export async function getUserWorkspace(userId: string) {
  return await db.query.workspaces.findFirst({
    where: eq(workspaces.userId, userId),
  });
}

/**
 * Get workspace by workspace ID
 */
export async function getWorkspaceById(workspaceId: string) {
  return await db.query.workspaces.findFirst({
    where: eq(workspaces.id, workspaceId),
  });
}

/**
 * Create a new workspace for a user
 * Used during onboarding flow
 */
export async function createWorkspace(data: {
  userId: string;
  name: string;
}): Promise<Workspace> {
  const [workspace] = await db
    .insert(workspaces)
    .values({
      id: crypto.randomUUID(),
      userId: data.userId,
      name: data.name,
    })
    .returning();

  return workspace;
}

/**
 * Update workspace name
 */
export async function updateWorkspaceName(
  workspaceId: string,
  name: string
): Promise<Workspace> {
  const [workspace] = await db
    .update(workspaces)
    .set({ name, updatedAt: new Date() })
    .where(eq(workspaces.id, workspaceId))
    .returning();

  return workspace;
}
