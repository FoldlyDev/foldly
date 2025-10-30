// =============================================================================
// WORKSPACE DATABASE QUERIES - Reusable Database Operations
// =============================================================================
// 🎯 Pure database queries for workspace operations (called by server actions)

import { db } from '@/lib/database/connection';
import { workspaces, users, files, links } from '@/lib/database/schemas';
import { eq, and, desc, sql, count, sum } from 'drizzle-orm';
import type { Workspace, NewWorkspace, File } from '@/lib/database/schemas';

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

/**
 * Get workspace statistics (file count, storage used, active link count)
 * Used by dashboard for overview statistics
 *
 * @param workspaceId - Workspace ID
 * @returns Workspace statistics
 */
export async function getWorkspaceStats(workspaceId: string): Promise<{
  totalFiles: number;
  storageUsed: number;
  activeLinks: number;
}> {
  // Get file count and storage size in one query
  const [fileStats] = await db
    .select({
      totalFiles: count(files.id),
      storageUsed: sum(files.fileSize),
    })
    .from(files)
    .where(eq(files.workspaceId, workspaceId));

  // Get active link count
  const [linkStats] = await db
    .select({
      activeLinks: count(links.id),
    })
    .from(links)
    .where(and(eq(links.workspaceId, workspaceId), eq(links.isActive, true)));

  return {
    totalFiles: Number(fileStats?.totalFiles ?? 0),
    storageUsed: Number(fileStats?.storageUsed ?? 0),
    activeLinks: Number(linkStats?.activeLinks ?? 0),
  };
}

/**
 * Get recent file activity for workspace
 * Returns most recently uploaded files with uploader info
 *
 * @param workspaceId - Workspace ID
 * @param limit - Maximum number of files to return (default: 10)
 * @returns Array of recent files
 */
export async function getRecentActivity(
  workspaceId: string,
  limit: number = 10
): Promise<File[]> {
  return await db.query.files.findMany({
    where: eq(files.workspaceId, workspaceId),
    orderBy: [desc(files.uploadedAt)],
    limit,
    with: {
      parentFolder: true,
      link: true,
    },
  });
}
