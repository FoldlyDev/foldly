// =============================================================================
// LINK PERMISSION ACTIONS TESTS
// =============================================================================
// Tests for link permission operations (add, remove, update, get)

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  addPermissionAction,
  removePermissionAction,
  updatePermissionAction,
  getLinkPermissionsAction,
} from '../../lib/actions/link-permissions.actions';
import {
  createTestUser,
  createTestWorkspace,
  createTestLink,
  cleanupTestUser,
} from '@/test/db-test-utils';
import {
  createPermission,
  getPermissionByLinkAndEmail,
  getLinkPermissions,
} from '@/lib/database/queries';

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
    remaining: 9,
    resetAt: Date.now() + 60000,
    blocked: false,
  }),
}));

import { auth } from '@clerk/nextjs/server';
import { checkRateLimit } from '@/lib/middleware/rate-limit';

describe('Link Permission Actions', () => {
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
  // addPermissionAction Tests
  // ===========================================================================

  describe('addPermissionAction', () => {
    it('should add permission successfully with valid input', async () => {
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

      // Act: Add permission
      const result = await addPermissionAction({
        linkId: link.id,
        email: 'collaborator@example.com',
        role: 'editor',
      });

      // Assert: Should create permission successfully
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.email).toBe('collaborator@example.com');
      expect(result.data?.role).toBe('editor');
      expect(result.data?.linkId).toBe(link.id);
    });

    it('should reject duplicate permissions for same email', async () => {
      // Arrange: Create test user with workspace, link, and existing permission
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

      // Create existing permission
      await createPermission({
        linkId: link.id,
        email: 'existing@example.com',
        role: 'uploader',
      });

      vi.mocked(auth).mockResolvedValue({ userId: testUserId } as any);

      // Act: Try to add duplicate permission
      const result = await addPermissionAction({
        linkId: link.id,
        email: 'existing@example.com',
        role: 'editor',
      });

      // Assert: Should reject duplicate
      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
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

      // Act: Try to add permission
      const result = await addPermissionAction({
        linkId: link.id,
        email: 'test@example.com',
        role: 'uploader',
      });

      // Assert: Should return rate limit error
      expect(result.success).toBe(false);
      expect(result.error).toBe('Too many requests. Please try again later.');
      expect(result.blocked).toBe(true);
      expect(result.resetAt).toBeDefined();
    });

    it('should handle unauthorized access (different workspace)', async () => {
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

      // Act: User 2 tries to add permission to User 1's link
      const result = await addPermissionAction({
        linkId: link.id,
        email: 'hacker@example.com',
        role: 'owner',
      });

      // Assert: Should reject unauthorized access
      expect(result.success).toBe(false);
      expect(result.error).toBe('You do not have permission to access this link.');

      // Cleanup user1
      await cleanupTestUser(user1.id);
    });
  });

  // ===========================================================================
  // removePermissionAction Tests
  // ===========================================================================

  describe('removePermissionAction', () => {
    it('should remove permission successfully', async () => {
      // Arrange: Create test user with workspace, link, and permission
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

      await createPermission({
        linkId: link.id,
        email: 'toremove@example.com',
        role: 'editor',
      });

      vi.mocked(auth).mockResolvedValue({ userId: testUserId } as any);

      // Act: Remove permission
      const result = await removePermissionAction({
        linkId: link.id,
        email: 'toremove@example.com',
      });

      // Assert: Should remove successfully
      expect(result.success).toBe(true);

      // Verify permission is actually removed
      const removedPermission = await getPermissionByLinkAndEmail(
        link.id,
        'toremove@example.com'
      );
      expect(removedPermission).toBeUndefined();
    });

    it('should prevent removing owner permissions', async () => {
      // Arrange: Create test user with workspace, link, and owner permission
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

      await createPermission({
        linkId: link.id,
        email: 'owner@example.com',
        role: 'owner',
      });

      vi.mocked(auth).mockResolvedValue({ userId: testUserId } as any);

      // Act: Try to remove owner permission
      const result = await removePermissionAction({
        linkId: link.id,
        email: 'owner@example.com',
      });

      // Assert: Should reject removal of owner permission
      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot remove owner');

      // Verify permission still exists
      const ownerPermission = await getPermissionByLinkAndEmail(
        link.id,
        'owner@example.com'
      );
      expect(ownerPermission).toBeDefined();
      expect(ownerPermission?.role).toBe('owner');
    });

    it('should handle permission not found', async () => {
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

      // Act: Try to remove non-existent permission
      const result = await removePermissionAction({
        linkId: link.id,
        email: 'nonexistent@example.com',
      });

      // Assert: Should return permission not found error
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  // ===========================================================================
  // updatePermissionAction Tests
  // ===========================================================================

  describe('updatePermissionAction', () => {
    it('should update permission role successfully', async () => {
      // Arrange: Create test user with workspace, link, and permission
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

      await createPermission({
        linkId: link.id,
        email: 'toupdate@example.com',
        role: 'uploader',
      });

      vi.mocked(auth).mockResolvedValue({ userId: testUserId } as any);

      // Act: Update permission role from uploader to editor
      const result = await updatePermissionAction({
        linkId: link.id,
        email: 'toupdate@example.com',
        role: 'editor',
      });

      // Assert: Should update successfully
      expect(result.success).toBe(true);
      expect(result.data?.role).toBe('editor');

      // Verify permission is actually updated
      const updatedPermission = await getPermissionByLinkAndEmail(
        link.id,
        'toupdate@example.com'
      );
      expect(updatedPermission?.role).toBe('editor');
    });

    it('should prevent modifying owner permissions', async () => {
      // Arrange: Create test user with workspace, link, and owner permission
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

      await createPermission({
        linkId: link.id,
        email: 'owner@example.com',
        role: 'owner',
      });

      vi.mocked(auth).mockResolvedValue({ userId: testUserId } as any);

      // Act: Try to modify owner permission
      const result = await updatePermissionAction({
        linkId: link.id,
        email: 'owner@example.com',
        role: 'uploader',
      });

      // Assert: Should reject modification of owner permission
      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot remove owner');

      // Verify permission unchanged
      const ownerPermission = await getPermissionByLinkAndEmail(
        link.id,
        'owner@example.com'
      );
      expect(ownerPermission?.role).toBe('owner');
    });
  });

  // ===========================================================================
  // getLinkPermissionsAction Tests
  // ===========================================================================

  describe('getLinkPermissionsAction', () => {
    it('should get all permissions for a link', async () => {
      // Arrange: Create test user with workspace, link, and multiple permissions
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

      // Create multiple permissions
      await createPermission({
        linkId: link.id,
        email: 'owner@example.com',
        role: 'owner',
      });

      await createPermission({
        linkId: link.id,
        email: 'editor@example.com',
        role: 'editor',
      });

      await createPermission({
        linkId: link.id,
        email: 'uploader@example.com',
        role: 'uploader',
      });

      vi.mocked(auth).mockResolvedValue({ userId: testUserId } as any);

      // Act: Get all permissions
      const result = await getLinkPermissionsAction({ linkId: link.id });

      // Assert: Should return all 3 permissions
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.length).toBe(3);

      const emails = result.data?.map((p) => p.email) || [];
      expect(emails).toContain('owner@example.com');
      expect(emails).toContain('editor@example.com');
      expect(emails).toContain('uploader@example.com');
    });
  });
});
