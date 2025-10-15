// =============================================================================
// LINK WRITE ACTIONS TESTS
// =============================================================================
// Tests for link write operations (create, update, updateConfig, delete)

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createLinkAction,
  updateLinkAction,
  updateLinkConfigAction,
  deleteLinkAction,
} from '../../lib/actions/link-write.actions';
import {
  createTestUser,
  createTestWorkspace,
  createTestLink,
  cleanupTestUser,
  testData,
} from '@/test/db-test-utils';
import { getLinkById } from '@/lib/database/queries';

// Mock Clerk authentication
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

// Mock logger to prevent console spam during tests
vi.mock('@/lib/utils/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
  logAuthFailure: vi.fn(),
  logSecurityEvent: vi.fn(),
  logSecurityIncident: vi.fn(),
  logRateLimitViolation: vi.fn(),
}));

// Mock rate limiting to avoid Redis dependency in tests
vi.mock('@/lib/middleware/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({
    allowed: true,
    remaining: 19,
    resetAt: Date.now() + 60000,
    blocked: false,
  }),
}));

import { auth } from '@clerk/nextjs/server';
import { checkRateLimit } from '@/lib/middleware/rate-limit';

describe('Link Write Actions', () => {
  let testUserId: string;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // Clean up test data
    if (testUserId) {
      await cleanupTestUser(testUserId);
    }
  });

  // ===========================================================================
  // createLinkAction Tests
  // ===========================================================================

  describe('createLinkAction', () => {
    it('should create link successfully with valid input', async () => {
      // Arrange: Create test user with workspace
      const user = await createTestUser();
      testUserId = user.id;

      await createTestWorkspace({
        userId: testUserId,
        name: 'Test Workspace',
      });

      vi.mocked(auth).mockResolvedValue({ userId: testUserId } as any);

      // Act: Create link
      const slug = testData.generateLinkSlug();
      const result = await createLinkAction({
        name: 'Tax Documents',
        slug,
        isPublic: false,
      });

      // Assert: Should create link successfully
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.name).toBe('Tax Documents');
      expect(result.data?.slug).toBe(slug);
      expect(result.data?.isPublic).toBe(false);
    });

    it('should sanitize and validate slug during creation', async () => {
      // Arrange: Create test user with workspace
      const user = await createTestUser();
      testUserId = user.id;

      await createTestWorkspace({
        userId: testUserId,
        name: 'Test Workspace',
      });

      vi.mocked(auth).mockResolvedValue({ userId: testUserId } as any);

      // Act: Create link with slug that needs sanitization
      const result = await createLinkAction({
        name: 'Test Link',
        slug: 'Test-Slug-123',
        isPublic: false,
      });

      // Assert: Slug should be lowercased
      expect(result.success).toBe(true);
      expect(result.data?.slug).toBe('test-slug-123');
    });

    it('should reject reserved slugs', async () => {
      // Arrange: Create test user with workspace
      const user = await createTestUser();
      testUserId = user.id;

      await createTestWorkspace({
        userId: testUserId,
        name: 'Test Workspace',
      });

      vi.mocked(auth).mockResolvedValue({ userId: testUserId } as any);

      // Act: Try to create link with reserved slug
      const result = await createLinkAction({
        name: 'Admin Link',
        slug: 'admin',
        isPublic: false,
      });

      // Assert: Should reject reserved slug
      expect(result.success).toBe(false);
      expect(result.error).toContain('reserved');
    });

    it('should reject duplicate slugs', async () => {
      // Arrange: Create test user with workspace and existing link
      const user = await createTestUser();
      testUserId = user.id;

      const workspace = await createTestWorkspace({
        userId: testUserId,
        name: 'Test Workspace',
      });

      await createTestLink({
        workspaceId: workspace.id,
        slug: 'existing-slug',
        name: 'Existing Link',
      });

      vi.mocked(auth).mockResolvedValue({ userId: testUserId } as any);

      // Act: Try to create link with duplicate slug
      const result = await createLinkAction({
        name: 'New Link',
        slug: 'existing-slug',
        isPublic: false,
      });

      // Assert: Should reject duplicate slug
      expect(result.success).toBe(false);
      expect(result.error).toBe('This slug is already in use. Please choose a different one.');
    });

    it('should handle rate limit exceeded', async () => {
      // Arrange: Create test user and mock rate limit exceeded
      const user = await createTestUser();
      testUserId = user.id;

      await createTestWorkspace({
        userId: testUserId,
        name: 'Test Workspace',
      });

      vi.mocked(auth).mockResolvedValue({ userId: testUserId } as any);
      vi.mocked(checkRateLimit).mockResolvedValueOnce({
        allowed: false,
        remaining: 0,
        resetAt: Date.now() + 60000,
        blocked: true,
      });

      // Act: Try to create link
      const result = await createLinkAction({
        name: 'Test Link',
        slug: testData.generateLinkSlug(),
        isPublic: false,
      });

      // Assert: Should return rate limit error
      expect(result.success).toBe(false);
      expect(result.error).toBe('Too many requests. Please try again later.');
      expect(result.blocked).toBe(true);
    });
  });

  // ===========================================================================
  // updateLinkAction Tests
  // ===========================================================================

  describe('updateLinkAction', () => {
    it('should update link successfully', async () => {
      // Arrange: Create test user with workspace and link
      const user = await createTestUser();
      testUserId = user.id;

      const workspace = await createTestWorkspace({
        userId: testUserId,
        name: 'Test Workspace',
      });

      const link = await createTestLink({
        workspaceId: workspace.id,
        name: 'Old Name',
      });

      vi.mocked(auth).mockResolvedValue({ userId: testUserId } as any);

      // Act: Update link
      const result = await updateLinkAction({
        linkId: link.id,
        name: 'New Name',
        isActive: false,
      });

      // Assert: Should update successfully
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('New Name');
      expect(result.data?.isActive).toBe(false);
      expect(result.data?.slug).toBe(link.slug); // Slug unchanged
    });

    it('should update slug and validate availability', async () => {
      // Arrange: Create test user with workspace and link
      const user = await createTestUser();
      testUserId = user.id;

      const workspace = await createTestWorkspace({
        userId: testUserId,
        name: 'Test Workspace',
      });

      const link = await createTestLink({
        workspaceId: workspace.id,
        name: 'Test Link',
      });

      vi.mocked(auth).mockResolvedValue({ userId: testUserId } as any);

      // Act: Update slug
      const newSlug = testData.generateLinkSlug();
      const result = await updateLinkAction({
        linkId: link.id,
        slug: newSlug,
      });

      // Assert: Should update slug
      expect(result.success).toBe(true);
      expect(result.data?.slug).toBe(newSlug);
    });

    it('should reject duplicate slug when updating', async () => {
      // Arrange: Create test user with workspace and two links
      const user = await createTestUser();
      testUserId = user.id;

      const workspace = await createTestWorkspace({
        userId: testUserId,
        name: 'Test Workspace',
      });

      const link1 = await createTestLink({
        workspaceId: workspace.id,
        slug: 'link-one',
        name: 'Link One',
      });

      await createTestLink({
        workspaceId: workspace.id,
        slug: 'link-two',
        name: 'Link Two',
      });

      vi.mocked(auth).mockResolvedValue({ userId: testUserId } as any);

      // Act: Try to change link1's slug to link-two (duplicate)
      const result = await updateLinkAction({
        linkId: link1.id,
        slug: 'link-two',
      });

      // Assert: Should reject duplicate slug
      expect(result.success).toBe(false);
      expect(result.error).toBe('This slug is already in use. Please choose a different one.');
    });

    it('should handle unauthorized update (different workspace)', async () => {
      // Arrange: Create two users with different workspaces
      const user1 = await createTestUser();
      const workspace1 = await createTestWorkspace({
        userId: user1.id,
        name: 'Workspace 1',
      });
      const link = await createTestLink({
        workspaceId: workspace1.id,
        name: 'User 1 Link',
      });

      const user2 = await createTestUser();
      testUserId = user2.id;
      await createTestWorkspace({
        userId: user2.id,
        name: 'Workspace 2',
      });

      vi.mocked(auth).mockResolvedValue({ userId: testUserId } as any);

      // Act: User 2 tries to update User 1's link
      const result = await updateLinkAction({
        linkId: link.id,
        name: 'Hacked Name',
      });

      // Assert: Should reject unauthorized update
      expect(result.success).toBe(false);
      expect(result.error).toBe('You do not have permission to access this link.');

      // Cleanup user1
      await cleanupTestUser(user1.id);
    });
  });

  // ===========================================================================
  // updateLinkConfigAction Tests
  // ===========================================================================

  describe('updateLinkConfigAction', () => {
    it('should update link configuration successfully', async () => {
      // Arrange: Create test user with workspace and link
      const user = await createTestUser();
      testUserId = user.id;

      const workspace = await createTestWorkspace({
        userId: testUserId,
        name: 'Test Workspace',
      });

      const link = await createTestLink({
        workspaceId: workspace.id,
        name: 'Test Link',
      });

      vi.mocked(auth).mockResolvedValue({ userId: testUserId } as any);

      // Act: Update config
      const result = await updateLinkConfigAction({
        linkId: link.id,
        config: {
          notifyOnUpload: true,
          customMessage: 'Please upload your documents here',
          requiresName: true,
        },
      });

      // Assert: Should update config
      expect(result.success).toBe(true);
      expect(result.data?.linkConfig?.notifyOnUpload).toBe(true);
      expect(result.data?.linkConfig?.customMessage).toBe('Please upload your documents here');
      expect(result.data?.linkConfig?.requiresName).toBe(true);
    });

    it('should validate custom message length', async () => {
      // Arrange: Create test user with workspace and link
      const user = await createTestUser();
      testUserId = user.id;

      const workspace = await createTestWorkspace({
        userId: testUserId,
        name: 'Test Workspace',
      });

      const link = await createTestLink({
        workspaceId: workspace.id,
        name: 'Test Link',
      });

      vi.mocked(auth).mockResolvedValue({ userId: testUserId } as any);

      // Act: Try to set message that's too long (>500 chars)
      const result = await updateLinkConfigAction({
        linkId: link.id,
        config: {
          customMessage: 'a'.repeat(501),
        },
      });

      // Assert: Should reject message that's too long
      expect(result.success).toBe(false);
      expect(result.error).toContain('500 characters');
    });

    it('should handle rate limit exceeded', async () => {
      // Arrange: Create test user and mock rate limit exceeded
      const user = await createTestUser();
      testUserId = user.id;

      const workspace = await createTestWorkspace({
        userId: testUserId,
        name: 'Test Workspace',
      });

      const link = await createTestLink({
        workspaceId: workspace.id,
        name: 'Test Link',
      });

      vi.mocked(auth).mockResolvedValue({ userId: testUserId } as any);
      vi.mocked(checkRateLimit).mockResolvedValueOnce({
        allowed: false,
        remaining: 0,
        resetAt: Date.now() + 60000,
        blocked: true,
      });

      // Act: Try to update config
      const result = await updateLinkConfigAction({
        linkId: link.id,
        config: { notifyOnUpload: true },
      });

      // Assert: Should return rate limit error
      expect(result.success).toBe(false);
      expect(result.blocked).toBe(true);
    });
  });

  // ===========================================================================
  // deleteLinkAction Tests
  // ===========================================================================

  describe('deleteLinkAction', () => {
    it('should delete link successfully', async () => {
      // Arrange: Create test user with workspace and link
      const user = await createTestUser();
      testUserId = user.id;

      const workspace = await createTestWorkspace({
        userId: testUserId,
        name: 'Test Workspace',
      });

      const link = await createTestLink({
        workspaceId: workspace.id,
        name: 'To Delete',
      });

      vi.mocked(auth).mockResolvedValue({ userId: testUserId } as any);

      // Act: Delete link
      const result = await deleteLinkAction({ linkId: link.id });

      // Assert: Should delete successfully
      expect(result.success).toBe(true);

      // Verify link is actually deleted
      const deletedLink = await getLinkById(link.id);
      expect(deletedLink).toBeUndefined();
    });

    it('should handle deleting non-existent link', async () => {
      // Arrange: Create test user with workspace
      const user = await createTestUser();
      testUserId = user.id;

      await createTestWorkspace({
        userId: testUserId,
        name: 'Test Workspace',
      });

      vi.mocked(auth).mockResolvedValue({ userId: testUserId } as any);

      const nonExistentLinkId = crypto.randomUUID();

      // Act: Try to delete non-existent link
      const result = await deleteLinkAction({ linkId: nonExistentLinkId });

      // Assert: Should return link not found error
      expect(result.success).toBe(false);
      expect(result.error).toBe('Link not found.');
    });

    it('should handle unauthorized deletion (different workspace)', async () => {
      // Arrange: Create two users with different workspaces
      const user1 = await createTestUser();
      const workspace1 = await createTestWorkspace({
        userId: user1.id,
        name: 'Workspace 1',
      });
      const link = await createTestLink({
        workspaceId: workspace1.id,
        name: 'User 1 Link',
      });

      const user2 = await createTestUser();
      testUserId = user2.id;
      await createTestWorkspace({
        userId: user2.id,
        name: 'Workspace 2',
      });

      vi.mocked(auth).mockResolvedValue({ userId: testUserId } as any);

      // Act: User 2 tries to delete User 1's link
      const result = await deleteLinkAction({ linkId: link.id });

      // Assert: Should reject unauthorized deletion
      expect(result.success).toBe(false);
      expect(result.error).toBe('You do not have permission to access this link.');

      // Verify link still exists
      const stillExists = await getLinkById(link.id);
      expect(stillExists).toBeDefined();

      // Cleanup user1
      await cleanupTestUser(user1.id);
    });
  });
});
