// =============================================================================
// FOLDER-LINK ACTIONS TESTS
// =============================================================================
// Tests for workspace module folder-link relationship operations

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  linkFolderToExistingLinkAction,
  linkFolderWithNewLinkAction,
  unlinkFolderAction,
  getAvailableLinksAction,
} from '../folder-link.actions';
import {
  createTestUser,
  createTestWorkspace,
  createTestLink,
  createTestFolder,
  cleanupTestUser,
} from '@/test/db-test-utils';
import { resetRateLimit, RateLimitKeys } from '@/lib/middleware/rate-limit';
import { db } from '@/lib/database/connection';
import { folders, links } from '@/lib/database/schemas';
import { eq } from 'drizzle-orm';

// Mock Clerk authentication
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(() => ({ has: vi.fn() })),
}));

import { auth } from '@clerk/nextjs/server';

describe('Folder-Link Actions', () => {
  // Track all user IDs created in each test for proper cleanup
  const createdUserIds = new Set<string>();

  beforeEach(() => {
    vi.clearAllMocks();
    createdUserIds.clear();
  });

  afterEach(async () => {
    // Clean up all test data created in this test
    const cleanupPromises = Array.from(createdUserIds).map(id => cleanupTestUser(id));
    await Promise.all(cleanupPromises);
    createdUserIds.clear();
  });

  // =============================================================================
  // linkFolderToExistingLinkAction() Tests
  // =============================================================================
  describe('linkFolderToExistingLinkAction', () => {
    it('should link folder to existing inactive link', async () => {
      // Arrange: Create test user, workspace, folder, and inactive link
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      // Create personal folder (no linkId)
      const folder = await createTestFolder({
        workspaceId: workspace.id,
        name: 'Personal Folder',
        linkId: null,
      });

      // Create inactive link
      const inactiveLink = await createTestLink({
        workspaceId: workspace.id,
        name: 'Inactive Link',
        isActive: false,
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);

      // Reset rate limit
      resetRateLimit(RateLimitKeys.userAction(user.id, 'link-folder-to-existing'));

      // Act: Link folder to existing link
      const result = await linkFolderToExistingLinkAction({
        folderId: folder.id,
        linkId: inactiveLink.id,
      });

      // Assert: Should succeed
      expect(result.success).toBe(true);

      // Verify folder.linkId updated
      const updatedFolder = await db.query.folders.findFirst({
        where: eq(folders.id, folder.id),
      });
      expect(updatedFolder?.linkId).toBe(inactiveLink.id);

      // Verify link.isActive updated
      const updatedLink = await db.query.links.findFirst({
        where: eq(links.id, inactiveLink.id),
      });
      expect(updatedLink?.isActive).toBe(true);
    });

    it('should reject when folder does not exist', async () => {
      // Arrange: Create test user and workspace
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      const inactiveLink = await createTestLink({
        workspaceId: workspace.id,
        name: 'Inactive Link',
        isActive: false,
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);

      // Reset rate limit
      resetRateLimit(RateLimitKeys.userAction(user.id, 'link-folder-to-existing'));

      // Act: Attempt to link non-existent folder
      const result = await linkFolderToExistingLinkAction({
        folderId: crypto.randomUUID(),
        linkId: inactiveLink.id,
      });

      // Assert: Should return error response (not throw)
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('not found');
      }
    });

    it('should reject when folder is already linked', async () => {
      // Arrange: Create test user, workspace, and already-linked folder
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      const existingLink = await createTestLink({
        workspaceId: workspace.id,
        name: 'Existing Link',
        isActive: true,
      });

      // Create folder already linked to existingLink
      const linkedFolder = await createTestFolder({
        workspaceId: workspace.id,
        name: 'Already Linked Folder',
        linkId: existingLink.id,
      });

      // Create another inactive link
      const inactiveLink = await createTestLink({
        workspaceId: workspace.id,
        name: 'Inactive Link',
        isActive: false,
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);

      // Reset rate limit
      resetRateLimit(RateLimitKeys.userAction(user.id, 'link-folder-to-existing'));

      // Act: Attempt to link already-linked folder
      const result = await linkFolderToExistingLinkAction({
        folderId: linkedFolder.id,
        linkId: inactiveLink.id,
      });

      // Assert: Should return error response (not throw)
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Folder is already linked to a shareable link');
      }
    });

    it('should reject when link is already active', async () => {
      // Arrange: Create test user, workspace, folder, and active link
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      const folder = await createTestFolder({
        workspaceId: workspace.id,
        name: 'Personal Folder',
        linkId: null,
      });

      // Create active link
      const activeLink = await createTestLink({
        workspaceId: workspace.id,
        name: 'Active Link',
        isActive: true,
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);

      // Reset rate limit
      resetRateLimit(RateLimitKeys.userAction(user.id, 'link-folder-to-existing'));

      // Act: Attempt to link to active link
      const result = await linkFolderToExistingLinkAction({
        folderId: folder.id,
        linkId: activeLink.id,
      });

      // Assert: Should return error response (not throw)
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Link is already active and cannot be reused');
      }
    });
  });

  // =============================================================================
  // linkFolderWithNewLinkAction() Tests
  // =============================================================================
  describe('linkFolderWithNewLinkAction', () => {
    it('should create new standalone link and link folder', async () => {
      // Arrange: Create test user, workspace, and folder
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      const folder = await createTestFolder({
        workspaceId: workspace.id,
        name: 'Personal Folder',
        linkId: null,
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);

      // Reset rate limit
      resetRateLimit(RateLimitKeys.userAction(user.id, 'link-folder-with-new'));

      // Act: Create new link and link folder (auto-generates name/slug from folder name)
      const result = await linkFolderWithNewLinkAction({
        folderId: folder.id,
        allowedEmails: ['editor@example.com'],
      });

      // Assert: Should succeed and return link with auto-generated name/slug
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.name).toBe('Personal Folder Link'); // Auto-generated from folder name
      expect(result.data?.slug).toMatch(/^personal-folder-link(-\d+)?$/); // Auto-generated slug with optional increment

      // Verify folder.linkId updated
      const updatedFolder = await db.query.folders.findFirst({
        where: eq(folders.id, folder.id),
      });
      expect(updatedFolder?.linkId).toBe(result.data?.id);

      // Verify link was activated in DB (linkFolderToLinkQuery activates it)
      const updatedLink = await db.query.links.findFirst({
        where: eq(links.id, result.data!.id),
      });
      expect(updatedLink?.isActive).toBe(true);

      // Verify NO duplicate root folder created (only user's folder should be linked)
      const allFoldersForLink = await db.query.folders.findMany({
        where: eq(folders.linkId, result.data!.id),
      });
      expect(allFoldersForLink.length).toBe(1);
      expect(allFoldersForLink[0].id).toBe(folder.id);
    }, 15000); // Increased timeout for transaction-heavy test

    it('should reject when folder does not exist', async () => {
      // Arrange: Create test user and workspace
      const user = await createTestUser();
      createdUserIds.add(user.id);

      await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);

      // Reset rate limit
      resetRateLimit(RateLimitKeys.userAction(user.id, 'link-folder-with-new'));

      // Act: Attempt to link non-existent folder
      const result = await linkFolderWithNewLinkAction({
        folderId: crypto.randomUUID(),
      });

      // Assert: Should return error response (not throw)
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('not found');
      }
    });

    it('should reject when folder is already linked', async () => {
      // Arrange: Create test user, workspace, and already-linked folder
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      const existingLink = await createTestLink({
        workspaceId: workspace.id,
        name: 'Existing Link',
        isActive: true,
      });

      const linkedFolder = await createTestFolder({
        workspaceId: workspace.id,
        name: 'Already Linked Folder',
        linkId: existingLink.id,
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);

      // Reset rate limit
      resetRateLimit(RateLimitKeys.userAction(user.id, 'link-folder-with-new'));

      // Act: Attempt to link already-linked folder
      const result = await linkFolderWithNewLinkAction({
        folderId: linkedFolder.id,
      });

      // Assert: Should return error response (not throw)
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Folder is already linked to a shareable link');
      }
    });

    it('should auto-increment slug when base slug is taken', async () => {
      // Arrange: Create test user, workspace, folder, and link with the base auto-generated slug
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      const folder = await createTestFolder({
        workspaceId: workspace.id,
        name: 'Test Folder', // Will generate "test-folder-link"
        linkId: null,
      });

      // Create link with the base auto-generated slug to force increment
      const baseSlug = 'test-folder-link';
      await createTestLink({
        workspaceId: workspace.id,
        name: 'Existing Link',
        slug: baseSlug,
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);

      // Reset rate limit
      resetRateLimit(RateLimitKeys.userAction(user.id, 'link-folder-with-new'));

      // Act: Create link - should auto-increment to "test-folder-link-2"
      const result = await linkFolderWithNewLinkAction({
        folderId: folder.id,
      });

      // Assert: Should succeed with incremented slug
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.name).toBe('Test Folder Link'); // Auto-generated name
      expect(result.data?.slug).toBe('test-folder-link-2'); // Auto-incremented slug
    }, 15000); // Increased timeout for transaction-heavy test
  });

  // =============================================================================
  // unlinkFolderAction() Tests
  // =============================================================================
  describe('unlinkFolderAction', () => {
    it('should unlink folder from link (non-destructive)', async () => {
      // Arrange: Create test user, workspace, link, and linked folder
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      const link = await createTestLink({
        workspaceId: workspace.id,
        name: 'Test Link',
        isActive: true,
      });

      const linkedFolder = await createTestFolder({
        workspaceId: workspace.id,
        name: 'Linked Folder',
        linkId: link.id,
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);

      // Reset rate limit
      resetRateLimit(RateLimitKeys.userAction(user.id, 'unlink-folder'));

      // Act: Unlink folder
      const result = await unlinkFolderAction({
        folderId: linkedFolder.id,
      });

      // Assert: Should succeed
      expect(result.success).toBe(true);

      // Wait for transaction to fully commit (Drizzle ORM .returning() quirk with null values)
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify folder.linkId set to NULL
      const updatedFolder = await db.query.folders.findFirst({
        where: eq(folders.id, linkedFolder.id),
      });
      expect(updatedFolder?.linkId).toBeNull();

      // Verify link.isActive set to false (preserved for re-use)
      const updatedLink = await db.query.links.findFirst({
        where: eq(links.id, link.id),
      });
      expect(updatedLink?.isActive).toBe(false);

      // Verify link record still exists (non-destructive)
      expect(updatedLink).toBeDefined();
    });

    it('should reject when folder does not exist', async () => {
      // Arrange: Create test user and workspace
      const user = await createTestUser();
      createdUserIds.add(user.id);

      await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);

      // Reset rate limit
      resetRateLimit(RateLimitKeys.userAction(user.id, 'unlink-folder'));

      // Act: Attempt to unlink non-existent folder
      const result = await unlinkFolderAction({
        folderId: crypto.randomUUID(),
      });

      // Assert: Should return error response (not throw)
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('not found');
      }
    });

    it('should succeed when folder is not linked (idempotent)', async () => {
      // Arrange: Create test user, workspace, and personal folder
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      const personalFolder = await createTestFolder({
        workspaceId: workspace.id,
        name: 'Personal Folder',
        linkId: null,
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);

      // Reset rate limit
      resetRateLimit(RateLimitKeys.userAction(user.id, 'unlink-folder'));

      // Act: Attempt to unlink folder that's not linked
      const result = await unlinkFolderAction({
        folderId: personalFolder.id,
      });

      // Assert: Should succeed (idempotent operation)
      expect(result.success).toBe(true);
    });
  });

  // =============================================================================
  // getAvailableLinksAction() Tests
  // =============================================================================
  describe('getAvailableLinksAction', () => {
    it('should return inactive links for workspace', async () => {
      // Arrange: Create test user, workspace, and mix of active/inactive links
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      // Create inactive links
      const inactiveLink1 = await createTestLink({
        workspaceId: workspace.id,
        name: 'Inactive Link 1',
        isActive: false,
      });
      const inactiveLink2 = await createTestLink({
        workspaceId: workspace.id,
        name: 'Inactive Link 2',
        isActive: false,
      });

      // Create active link (should not be returned)
      await createTestLink({
        workspaceId: workspace.id,
        name: 'Active Link',
        isActive: true,
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);

      // Reset rate limit
      resetRateLimit(RateLimitKeys.userAction(user.id, 'get-available-links'));

      // Act: Get available links
      const result = await getAvailableLinksAction();

      // Assert: Should return only inactive links
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.length).toBe(2);
      expect(result.data?.find(l => l.id === inactiveLink1.id)).toBeDefined();
      expect(result.data?.find(l => l.id === inactiveLink2.id)).toBeDefined();
    });

    it('should return empty array when no inactive links exist', async () => {
      // Arrange: Create test user, workspace, and only active links
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      // Create only active links
      await createTestLink({
        workspaceId: workspace.id,
        name: 'Active Link',
        isActive: true,
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);

      // Reset rate limit
      resetRateLimit(RateLimitKeys.userAction(user.id, 'get-available-links'));

      // Act: Get available links
      const result = await getAvailableLinksAction();

      // Assert: Should return empty array
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.length).toBe(0);
    });
  });
});
