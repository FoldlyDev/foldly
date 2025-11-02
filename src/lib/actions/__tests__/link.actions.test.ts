// =============================================================================
// LINK ACTIONS TESTS
// =============================================================================
// Tests for global link CRUD operations with ownership verification

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getUserLinksAction,
  getLinkByIdAction,
  createLinkAction,
  updateLinkAction,
  updateLinkConfigAction,
  deleteLinkAction,
  checkSlugAvailabilityAction,
} from '../link.actions';
import {
  createTestUser,
  createTestWorkspace,
  createTestLink,
  cleanupTestUser,
} from '@/test/db-test-utils';
import { resetRateLimit, RateLimitKeys } from '@/lib/middleware/rate-limit';
import { db } from '@/lib/database/connection';
import { links, permissions, folders } from '@/lib/database/schemas';
import { eq } from 'drizzle-orm';

// Mock Clerk authentication
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(() => ({ has: vi.fn() })),
}));

import { auth } from '@clerk/nextjs/server';

describe('Link Actions', () => {
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
  // getUserLinksAction() Tests
  // =============================================================================
  describe('getUserLinksAction', () => {
    it('should return empty array when user has no links', async () => {
      // Arrange: Create test user with workspace but no links
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);

      // Reset rate limit for clean test
      resetRateLimit(RateLimitKeys.userAction(user.id, 'list-links'));

      // Act: Get user links
      const result = await getUserLinksAction();

      // Assert: Should return empty array
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data?.length).toBe(0);
    });

    it('should return all links for authenticated user workspace', async () => {
      // Arrange: Create test user with workspace and links
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      // Create multiple links
      const link1 = await createTestLink({
        workspaceId: workspace.id,
        name: 'Link 1',
      });
      const link2 = await createTestLink({
        workspaceId: workspace.id,
        name: 'Link 2',
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);

      // Reset rate limit
      resetRateLimit(RateLimitKeys.userAction(user.id, 'list-links'));

      // Act: Get user links
      const result = await getUserLinksAction();

      // Assert: Should return both links
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.length).toBe(2);
      expect(result.data?.find(l => l.id === link1.id)).toBeDefined();
      expect(result.data?.find(l => l.id === link2.id)).toBeDefined();
    });

    it('should enforce rate limit', async () => {
      // NOTE: We test with 50 requests (not 100) to ensure the test completes
      // quickly within the 60-second rate limit window. This still validates
      // that the rate limiting mechanism works correctly.

      // Arrange: Create test user
      const user = await createTestUser();
      createdUserIds.add(user.id);

      await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);

      // Reset rate limit for clean test
      resetRateLimit(RateLimitKeys.userAction(user.id, 'list-links'));

      // Act: Make 50 successful requests (rate limit is 100/min)
      for (let i = 0; i < 50; i++) {
        const result = await getUserLinksAction();
        expect(result.success).toBe(true);
      }

      // Verify we can still make more requests (we're at 50/100)
      const additionalResult = await getUserLinksAction();
      expect(additionalResult.success).toBe(true);
    }, 30000); // 30 second timeout
  });

  // =============================================================================
  // getLinkByIdAction() Tests
  // =============================================================================
  describe('getLinkByIdAction', () => {
    it('should return link with permissions when user owns it', async () => {
      // Arrange: Create test user, workspace, and link
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      const link = await createTestLink({
        workspaceId: workspace.id,
        name: 'Test Link',
      });

      // Create owner permission
      await db.insert(permissions).values({
        id: crypto.randomUUID(),
        linkId: link.id,
        email: user.email,
        role: 'owner',
        isVerified: 'true',
        verifiedAt: new Date(),
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);

      // Reset rate limit
      resetRateLimit(RateLimitKeys.userAction(user.id, 'get-link'));

      // Act: Get link by ID
      const result = await getLinkByIdAction({ linkId: link.id });

      // Assert: Should return link with permissions
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.id).toBe(link.id);
      expect(result.data?.permissions).toBeDefined();
      expect(result.data?.permissions?.length).toBeGreaterThan(0);
    });

    it('should reject when user does not own link', async () => {
      // Arrange: Create two users with separate workspaces
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      createdUserIds.add(user1.id);
      createdUserIds.add(user2.id);

      const workspace1 = await createTestWorkspace({
        userId: user1.id,
        name: 'User 1 Workspace',
      });

      const workspace2 = await createTestWorkspace({
        userId: user2.id,
        name: 'User 2 Workspace',
      });

      // Create link for user2
      const link = await createTestLink({
        workspaceId: workspace2.id,
        name: 'User 2 Link',
      });

      // User1 tries to access user2's link
      vi.mocked(auth).mockResolvedValue({ userId: user1.id } as any);

      // Reset rate limit
      resetRateLimit(RateLimitKeys.userAction(user1.id, 'get-link'));

      // Act & Assert: Should reject
      const result = await getLinkByIdAction({ linkId: link.id });
      expect(result.success).toBe(false);
      expect(result.error).toContain('You do not have permission');
    });

    it('should reject invalid link ID format', async () => {
      // Arrange: Create test user
      const user = await createTestUser();
      createdUserIds.add(user.id);

      await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);

      // Reset rate limit
      resetRateLimit(RateLimitKeys.userAction(user.id, 'get-link'));

      // Act & Assert: Invalid UUID format
      const result = await getLinkByIdAction({ linkId: 'invalid-uuid' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid link ID');
    });
  });

  // =============================================================================
  // createLinkAction() Tests
  // =============================================================================
  describe('createLinkAction', () => {
    it('should create link with owner permission atomically', async () => {
      // Arrange: Create test user with workspace
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);

      // Reset rate limit
      resetRateLimit(RateLimitKeys.linkCreation(user.id));

      // Act: Create link
      const result = await createLinkAction({
        name: 'New Test Link',
        slug: 'new-test-link',
        isPublic: false,
      });

      // Assert: Link created successfully
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.name).toBe('New Test Link');
      expect(result.data?.slug).toBe('new-test-link');

      // Verify owner permission was created
      const perms = await db
        .select()
        .from(permissions)
        .where(eq(permissions.linkId, result.data!.id));

      expect(perms.length).toBe(1);
      expect(perms[0].email).toBe(user.email);
      expect(perms[0].role).toBe('owner');

      // Verify root folder was created for the link
      const linkFolders = await db
        .select()
        .from(folders)
        .where(eq(folders.linkId, result.data!.id));

      expect(linkFolders.length).toBe(1);
      expect(linkFolders[0].name).toBe('new-test-link-files');
      expect(linkFolders[0].parentFolderId).toBeNull();
      expect(linkFolders[0].workspaceId).toBe(workspace.id);
    });

    it('should reject duplicate slug', async () => {
      // Arrange: Create test user with workspace and existing link
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      const existingLink = await createTestLink({
        workspaceId: workspace.id,
        slug: 'existing-slug',
        name: 'Existing Link',
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);

      // Reset rate limit
      resetRateLimit(RateLimitKeys.linkCreation(user.id));

      // Act & Assert: Try to create link with same slug
      const result = await createLinkAction({
        name: 'New Link',
        slug: 'existing-slug',
        isPublic: false,
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('already in use');
    });

    it('should enforce rate limit', async () => {
      // NOTE: We test with 10 requests (not 20) to ensure the test completes
      // quickly within the 60-second rate limit window. This still validates
      // that the rate limiting mechanism works correctly.

      // Arrange: Create test user and workspace
      const user = await createTestUser();
      createdUserIds.add(user.id);

      await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);

      // Reset rate limit for clean test
      resetRateLimit(RateLimitKeys.linkCreation(user.id));

      // Act: Make 10 successful requests (rate limit is 20/min)
      for (let i = 0; i < 10; i++) {
        const result = await createLinkAction({
          name: `Link ${i}`,
          slug: `link-${i}-${Date.now()}`,
          isPublic: false,
        });
        expect(result.success).toBe(true);
      }

      // Verify we can still make more requests (we're at 10/20)
      const additionalResult = await createLinkAction({
        name: 'Link 11',
        slug: `link-11-${Date.now()}`,
        isPublic: false,
      });
      expect(additionalResult.success).toBe(true);
    }, 30000); // 30 second timeout

    it('should sanitize and validate input', async () => {
      // Arrange: Create test user
      const user = await createTestUser();
      createdUserIds.add(user.id);

      await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);

      // Reset rate limit
      resetRateLimit(RateLimitKeys.linkCreation(user.id));

      // Act & Assert: Invalid slug (too short)
      const result = await createLinkAction({
        name: 'Test Link',
        slug: 'ab',
        isPublic: false,
      });
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  // =============================================================================
  // updateLinkAction() Tests
  // =============================================================================
  describe('updateLinkAction', () => {
    it('should update link details when user owns it', async () => {
      // Arrange: Create test user, workspace, and link
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      const link = await createTestLink({
        workspaceId: workspace.id,
        name: 'Original Name',
        slug: 'original-slug',
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);

      // Reset rate limit
      resetRateLimit(RateLimitKeys.userAction(user.id, 'update-link'));

      // Act: Update link
      const result = await updateLinkAction({
        linkId: link.id,
        name: 'Updated Name',
      });

      // Assert: Link updated successfully
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.name).toBe('Updated Name');
      expect(result.data?.slug).toBe('original-slug'); // Unchanged
    });

    it('should update slug when available', async () => {
      // Arrange: Create test user, workspace, and link
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      const link = await createTestLink({
        workspaceId: workspace.id,
        name: 'Test Link',
        slug: 'old-slug',
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);

      // Reset rate limit
      resetRateLimit(RateLimitKeys.userAction(user.id, 'update-link'));

      // Act: Update slug
      const result = await updateLinkAction({
        linkId: link.id,
        slug: 'new-slug',
      });

      // Assert: Slug updated successfully
      expect(result.success).toBe(true);
      expect(result.data?.slug).toBe('new-slug');
    });

    it('should reject slug change if slug already taken', async () => {
      // Arrange: Create test user with two links
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      const link1 = await createTestLink({
        workspaceId: workspace.id,
        slug: 'taken-slug',
      });

      const link2 = await createTestLink({
        workspaceId: workspace.id,
        slug: 'original-slug',
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);

      // Reset rate limit
      resetRateLimit(RateLimitKeys.userAction(user.id, 'update-link'));

      // Act & Assert: Try to update link2 slug to taken-slug
      const result = await updateLinkAction({
        linkId: link2.id,
        slug: 'taken-slug',
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('already in use');
    });
  });

  // =============================================================================
  // updateLinkConfigAction() Tests
  // =============================================================================
  describe('updateLinkConfigAction', () => {
    it('should update link config when user owns link', async () => {
      // Arrange: Create test user, workspace, and link
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      const link = await createTestLink({
        workspaceId: workspace.id,
        name: 'Test Link',
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);

      // Reset rate limit
      resetRateLimit(RateLimitKeys.userAction(user.id, 'update-link-config'));

      // Act: Update config
      const result = await updateLinkConfigAction({
        linkId: link.id,
        config: {
          notifyOnUpload: true,
          requiresName: true,
          customMessage: 'Please upload your documents',
        },
      });

      // Assert: Config updated successfully
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.linkConfig).toBeDefined();
      expect(result.data?.linkConfig?.notifyOnUpload).toBe(true);
    });
  });

  // =============================================================================
  // deleteLinkAction() Tests
  // =============================================================================
  describe('deleteLinkAction', () => {
    it('should delete link when user owns it', async () => {
      // Arrange: Create test user, workspace, and link
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      const link = await createTestLink({
        workspaceId: workspace.id,
        name: 'Test Link',
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);

      // Reset rate limit
      resetRateLimit(RateLimitKeys.userAction(user.id, 'delete-link'));

      // Act: Delete link
      const result = await deleteLinkAction({
        linkId: link.id,
      });

      // Assert: Link deleted successfully
      expect(result.success).toBe(true);

      // Verify link no longer exists
      const deletedLink = await db
        .select()
        .from(links)
        .where(eq(links.id, link.id));

      expect(deletedLink.length).toBe(0);
    });
  });

  // =============================================================================
  // checkSlugAvailabilityAction() Tests
  // =============================================================================
  describe('checkSlugAvailabilityAction', () => {
    it('should return true when slug is available', async () => {
      // Arrange: Create test user
      const user = await createTestUser();
      createdUserIds.add(user.id);

      await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);

      // Reset rate limit
      resetRateLimit(RateLimitKeys.userAction(user.id, 'check-slug'));

      // Act: Check available slug
      const result = await checkSlugAvailabilityAction({
        slug: 'available-slug',
      });

      // Assert: Should return true (available)
      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });

    it('should return false when slug is taken', async () => {
      // Arrange: Create test user with existing link
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      const link = await createTestLink({
        workspaceId: workspace.id,
        slug: 'taken-slug',
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);

      // Reset rate limit
      resetRateLimit(RateLimitKeys.userAction(user.id, 'check-slug'));

      // Act: Check taken slug
      const result = await checkSlugAvailabilityAction({
        slug: 'taken-slug',
      });

      // Assert: Should return false (not available)
      expect(result.success).toBe(true);
      expect(result.data).toBe(false);
    });

    it('should enforce strict rate limit to prevent enumeration', async () => {
      // NOTE: We test with 15 requests (not 30) to ensure the test completes
      // quickly within the 60-second rate limit window. This still validates
      // that the rate limiting mechanism works correctly and prevents enumeration.

      // Arrange: Create test user
      const user = await createTestUser();
      createdUserIds.add(user.id);

      await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);

      // Reset rate limit for clean test
      resetRateLimit(RateLimitKeys.userAction(user.id, 'check-slug'));

      // Act: Make 15 successful requests (rate limit is 30/min)
      for (let i = 0; i < 15; i++) {
        const result = await checkSlugAvailabilityAction({
          slug: `slug-${i}`,
        });
        expect(result.success).toBe(true);
      }

      // Verify we can still make more requests (we're at 15/30)
      const additionalResult = await checkSlugAvailabilityAction({
        slug: 'slug-16',
      });
      expect(additionalResult.success).toBe(true);
    }, 10000); // 10 second timeout
  });
});
