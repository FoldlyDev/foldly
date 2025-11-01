// =============================================================================
// DATABASE TEST UTILITIES
// =============================================================================
// Shared helpers for database testing with real PostgreSQL operations

import { db } from '@/lib/database/connection';
import { workspaces, users, links, folders, files } from '@/lib/database/schemas';
import { eq } from 'drizzle-orm';

/**
 * Test data generators with unique identifiers
 */
export const testData = {
  generateUserId: () => `test_user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
  generateWorkspaceId: () => crypto.randomUUID(),
  generateLinkSlug: () => `test-slug-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
};

/**
 * Create a test user in the database
 * Used to satisfy foreign key constraints in tests
 */
export async function createTestUser(userId?: string) {
  const testUserId = userId || testData.generateUserId();

  // Generate fully unique username to avoid collisions in parallel tests
  const uniqueUsername = `testuser_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

  const [user] = await db
    .insert(users)
    .values({
      id: testUserId,
      username: uniqueUsername,
      email: `test_${testUserId}@example.com`,
    })
    .returning();

  return user;
}

/**
 * Create a test workspace in the database
 */
export async function createTestWorkspace(data: {
  userId: string;
  name?: string;
  id?: string;
}) {
  const [workspace] = await db
    .insert(workspaces)
    .values({
      id: data.id || testData.generateWorkspaceId(),
      userId: data.userId,
      name: data.name || `Test Workspace`,
    })
    .returning();

  return workspace;
}

/**
 * Create a test link in the database
 */
export async function createTestLink(data: {
  workspaceId: string;
  slug?: string;
  name?: string;
  isActive?: boolean;
  isPublic?: boolean;
}) {
  const [link] = await db
    .insert(links)
    .values({
      id: crypto.randomUUID(),
      workspaceId: data.workspaceId,
      slug: data.slug || testData.generateLinkSlug(),
      name: data.name || 'Test Link',
      isActive: data.isActive ?? true,
      isPublic: data.isPublic ?? false,
    })
    .returning();

  return link;
}

/**
 * Create a test folder in the database
 */
export async function createTestFolder(data: {
  workspaceId: string;
  name?: string;
  parentFolderId?: string | null;
  linkId?: string | null;
  uploaderEmail?: string | null;
  uploaderName?: string | null;
}) {
  const [folder] = await db
    .insert(folders)
    .values({
      id: crypto.randomUUID(),
      workspaceId: data.workspaceId,
      name: data.name || 'Test Folder',
      parentFolderId: data.parentFolderId ?? null,
      linkId: data.linkId ?? null,
      uploaderEmail: data.uploaderEmail ?? null,
      uploaderName: data.uploaderName ?? null,
    })
    .returning();

  return folder;
}

/**
 * Create a test file in the database
 */
export async function createTestFile(data: {
  workspaceId: string;
  filename?: string;
  fileSize?: number;
  mimeType?: string;
  storagePath?: string;
  parentFolderId?: string | null;
  linkId?: string | null;
  uploaderEmail?: string | null;
  uploaderName?: string | null;
}) {
  const fileId = crypto.randomUUID();
  const [file] = await db
    .insert(files)
    .values({
      id: fileId,
      workspaceId: data.workspaceId,
      filename: data.filename || 'test-file.pdf',
      fileSize: data.fileSize || 1024000, // 1MB default
      mimeType: data.mimeType || 'application/pdf',
      storagePath: data.storagePath || `test/${data.workspaceId}/${fileId}.pdf`,
      parentFolderId: data.parentFolderId ?? null,
      linkId: data.linkId ?? null,
      uploaderEmail: data.uploaderEmail ?? null,
      uploaderName: data.uploaderName ?? null,
    })
    .returning();

  return file;
}

/**
 * Clean up test data by userId
 * Cascading deletes will handle related records
 */
export async function cleanupTestUser(userId: string) {
  // Delete workspaces (cascades to links, folders, files, permissions)
  await db.delete(workspaces).where(eq(workspaces.userId, userId));

  // Delete user
  await db.delete(users).where(eq(users.id, userId));
}

/**
 * Clean up test workspace by workspaceId
 */
export async function cleanupTestWorkspace(workspaceId: string) {
  await db.delete(workspaces).where(eq(workspaces.id, workspaceId));
}

/**
 * Clean up test link by slug
 */
export async function cleanupTestLink(slug: string) {
  await db.delete(links).where(eq(links.slug, slug));
}

/**
 * Verify database connection is working
 */
export async function verifyTestDatabaseConnection() {
  try {
    const result = await db.execute('SELECT 1 as test');
    return result.length > 0;
  } catch (error) {
    console.error('Test database connection failed:', error);
    return false;
  }
}
