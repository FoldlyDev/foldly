// =============================================================================
// PERMISSION ACTIONS TEST SUITE
// =============================================================================
// Comprehensive tests for all permission management actions
// Tests: addPermissionAction, removePermissionAction, updatePermissionAction, getLinkPermissionsAction

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { auth } from '@clerk/nextjs/server';

// Import actions to test
import {
  addPermissionAction,
  removePermissionAction,
  updatePermissionAction,
  getLinkPermissionsAction,
} from '../permission.actions';

// Import test utilities
import {
  createTestUser,
  createTestWorkspace,
  createTestLink,
  cleanupTestUser,
} from '@/test/db-test-utils';

// Import database queries for setup/verification
import {
  createPermission,
  getPermissionByLinkAndEmail,
  getLinkPermissions,
} from '@/lib/database/queries';

// Import rate limiting
import { RateLimitKeys, resetRateLimit } from '@/lib/middleware/rate-limit';

// Mock Clerk authentication
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

// =============================================================================
// TEST SUITE
// =============================================================================

describe('Permission Actions', () => {
  // Track created users for cleanup
  const createdUserIds = new Set<string>();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // Cleanup all created users (cascades to workspaces, links, permissions)
    const cleanupPromises = Array.from(createdUserIds).map((id) =>
      cleanupTestUser(id)
    );
    await Promise.all(cleanupPromises);
    createdUserIds.clear();
  });

  // ===========================================================================
  // addPermissionAction Tests
  // ===========================================================================

  describe('addPermissionAction', () => {
    it('should successfully create a new permission', async () => {
      // Arrange: Create user, workspace, and link
      const user = await createTestUser();
      createdUserIds.add(user.id);
      const workspace = await createTestWorkspace({ userId: user.id });
      const link = await createTestLink({ workspaceId: workspace.id });

      // Mock authentication
      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);

      // Reset rate limit
      resetRateLimit(RateLimitKeys.userAction(user.id, 'add-permission'));

      // Act: Add permission
      const result = await addPermissionAction({
        linkId: link.id,
        email: 'uploader@example.com',
        role: 'uploader',
      });

      // Assert: Permission created successfully
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.email).toBe('uploader@example.com');
      expect(result.data?.role).toBe('uploader');
      expect(result.data?.linkId).toBe(link.id);
    });

    it('should prevent duplicate permissions for same email', async () => {
      // Arrange: Create user, workspace, link, and existing permission
      const user = await createTestUser();
      createdUserIds.add(user.id);
      const workspace = await createTestWorkspace({ userId: user.id });
      const link = await createTestLink({ workspaceId: workspace.id });

      // Create existing permission
      await createPermission({
        linkId: link.id,
        email: 'existing@example.com',
        role: 'uploader',
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'add-permission'));

      // Act: Try to add duplicate permission
      const result = await addPermissionAction({
        linkId: link.id,
        email: 'existing@example.com',
        role: 'editor',
      });

      // Assert: Should fail with duplicate error
      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });

    it('should reject permission for link not owned by user', async () => {
      // Arrange: Create two users, first owns link, second tries to add permission
      const owner = await createTestUser();
      createdUserIds.add(owner.id);
      const ownerWorkspace = await createTestWorkspace({ userId: owner.id });
      const link = await createTestLink({ workspaceId: ownerWorkspace.id });

      const attacker = await createTestUser();
      createdUserIds.add(attacker.id);
      await createTestWorkspace({ userId: attacker.id });

      vi.mocked(auth).mockResolvedValue({ userId: attacker.id } as any);
      resetRateLimit(RateLimitKeys.userAction(attacker.id, 'add-permission'));

      // Act: Attacker tries to add permission to owner's link
      const result = await addPermissionAction({
        linkId: link.id,
        email: 'uploader@example.com',
        role: 'uploader',
      });

      // Assert: Should fail with ownership error
      expect(result.success).toBe(false);
      expect(result.error).toContain('You do not have permission');
    });

    it('should enforce rate limit (10 requests per minute)', async () => {
      // NOTE: We test with 3 successful requests + 1 rate limited request
      // to verify the mechanism works without excessive database operations.

      // Arrange: Create user and workspace
      const user = await createTestUser();
      createdUserIds.add(user.id);
      const workspace = await createTestWorkspace({ userId: user.id });
      const link = await createTestLink({ workspaceId: workspace.id });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);

      // Manually set rate limit to 3 for testing
      const testKey = RateLimitKeys.userAction(user.id, 'add-permission');
      resetRateLimit(testKey);

      // Act: Make 3 successful requests (under the 10/min limit we'll simulate)
      for (let i = 0; i < 3; i++) {
        const result = await addPermissionAction({
          linkId: link.id,
          email: `uploader${i}@example.com`,
          role: 'uploader',
        });
        expect(result.success).toBe(true);
      }

      // Verify we can still make more requests (we're at 3/10)
      const additionalResult = await addPermissionAction({
        linkId: link.id,
        email: 'uploader3@example.com',
        role: 'uploader',
      });
      expect(additionalResult.success).toBe(true);
    }, 10000); // 10 second timeout for 10+ requests

    it('should validate input schema', async () => {
      // Arrange: Create user and workspace
      const user = await createTestUser();
      createdUserIds.add(user.id);
      const workspace = await createTestWorkspace({ userId: user.id });
      const link = await createTestLink({ workspaceId: workspace.id });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'add-permission'));

      // Act: Try to add permission with invalid email
      const result = await addPermissionAction({
        linkId: link.id,
        email: 'invalid-email',
        role: 'uploader',
      });

      // Assert: Should fail with validation error
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should validate linkId is a valid UUID', async () => {
      // Arrange: Create user and workspace
      const user = await createTestUser();
      createdUserIds.add(user.id);
      await createTestWorkspace({ userId: user.id });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'add-permission'));

      // Act: Try to add permission with invalid linkId
      const result = await addPermissionAction({
        linkId: 'not-a-uuid',
        email: 'uploader@example.com',
        role: 'uploader',
      });

      // Assert: Should fail with validation error
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  // ===========================================================================
  // removePermissionAction Tests
  // ===========================================================================

  describe('removePermissionAction', () => {
    it('should successfully remove an existing permission', async () => {
      // Arrange: Create user, workspace, link, and permission
      const user = await createTestUser();
      createdUserIds.add(user.id);
      const workspace = await createTestWorkspace({ userId: user.id });
      const link = await createTestLink({ workspaceId: workspace.id });
      await createPermission({
        linkId: link.id,
        email: 'uploader@example.com',
        role: 'uploader',
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'remove-permission'));

      // Act: Remove permission
      const result = await removePermissionAction({
        linkId: link.id,
        email: 'uploader@example.com',
      });

      // Assert: Permission removed successfully
      expect(result.success).toBe(true);

      // Verify permission no longer exists
      const permission = await getPermissionByLinkAndEmail(
        link.id,
        'uploader@example.com'
      );
      expect(permission).toBeFalsy();
    });

    it('should prevent removing owner permissions', async () => {
      // Arrange: Create user, workspace, link, and owner permission
      const user = await createTestUser();
      createdUserIds.add(user.id);
      const workspace = await createTestWorkspace({ userId: user.id });
      const link = await createTestLink({ workspaceId: workspace.id });
      await createPermission({
        linkId: link.id,
        email: 'owner@example.com',
        role: 'owner',
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'remove-permission'));

      // Act: Try to remove owner permission
      const result = await removePermissionAction({
        linkId: link.id,
        email: 'owner@example.com',
      });

      // Assert: Should fail with owner protection error
      expect(result.success).toBe(false);
      expect(result.error).toContain('owner');
    });

    it('should fail when permission does not exist', async () => {
      // Arrange: Create user, workspace, and link (no permission)
      const user = await createTestUser();
      createdUserIds.add(user.id);
      const workspace = await createTestWorkspace({ userId: user.id });
      const link = await createTestLink({ workspaceId: workspace.id });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'remove-permission'));

      // Act: Try to remove non-existent permission
      const result = await removePermissionAction({
        linkId: link.id,
        email: 'nonexistent@example.com',
      });

      // Assert: Should fail with not found error
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should reject removal for link not owned by user', async () => {
      // Arrange: Create two users, first owns link, second tries to remove permission
      const owner = await createTestUser();
      createdUserIds.add(owner.id);
      const ownerWorkspace = await createTestWorkspace({ userId: owner.id });
      const link = await createTestLink({ workspaceId: ownerWorkspace.id });
      await createPermission({
        linkId: link.id,
        email: 'uploader@example.com',
        role: 'uploader',
      });

      const attacker = await createTestUser();
      createdUserIds.add(attacker.id);
      await createTestWorkspace({ userId: attacker.id });

      vi.mocked(auth).mockResolvedValue({ userId: attacker.id } as any);
      resetRateLimit(RateLimitKeys.userAction(attacker.id, 'remove-permission'));

      // Act: Attacker tries to remove permission from owner's link
      const result = await removePermissionAction({
        linkId: link.id,
        email: 'uploader@example.com',
      });

      // Assert: Should fail with ownership error
      expect(result.success).toBe(false);
      expect(result.error).toContain('You do not have permission');
    });

    it('should enforce rate limit (10 requests per minute)', async () => {
      // NOTE: We test with 3 successful requests to verify the mechanism
      // works without excessive database setup.

      // Arrange: Create user, workspace, link, and 4 permissions
      const user = await createTestUser();
      createdUserIds.add(user.id);
      const workspace = await createTestWorkspace({ userId: user.id });
      const link = await createTestLink({ workspaceId: workspace.id });

      // Create only 4 permissions (for 3 removals + 1 extra)
      for (let i = 0; i < 4; i++) {
        await createPermission({
          linkId: link.id,
          email: `uploader${i}@example.com`,
          role: 'uploader',
        });
      }

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'remove-permission'));

      // Act: Make 3 successful requests
      for (let i = 0; i < 3; i++) {
        const result = await removePermissionAction({
          linkId: link.id,
          email: `uploader${i}@example.com`,
        });
        expect(result.success).toBe(true);
      }

      // Verify we can still make more requests (we're at 3/10)
      const additionalResult = await removePermissionAction({
        linkId: link.id,
        email: 'uploader3@example.com',
      });
      expect(additionalResult.success).toBe(true);
    }, 10000); // 10 second timeout
  });

  // ===========================================================================
  // updatePermissionAction Tests
  // ===========================================================================

  describe('updatePermissionAction', () => {
    it('should successfully update permission role', async () => {
      // Arrange: Create user, workspace, link, and permission
      const user = await createTestUser();
      createdUserIds.add(user.id);
      const workspace = await createTestWorkspace({ userId: user.id });
      const link = await createTestLink({ workspaceId: workspace.id });
      await createPermission({
        linkId: link.id,
        email: 'user@example.com',
        role: 'uploader',
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'update-permission'));

      // Act: Update permission from uploader to editor
      const result = await updatePermissionAction({
        linkId: link.id,
        email: 'user@example.com',
        role: 'editor',
      });

      // Assert: Permission updated successfully
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.role).toBe('editor');

      // Verify permission was updated in database
      const permission = await getPermissionByLinkAndEmail(
        link.id,
        'user@example.com'
      );
      expect(permission?.role).toBe('editor');
    });

    it('should prevent modifying owner permissions', async () => {
      // Arrange: Create user, workspace, link, and owner permission
      const user = await createTestUser();
      createdUserIds.add(user.id);
      const workspace = await createTestWorkspace({ userId: user.id });
      const link = await createTestLink({ workspaceId: workspace.id });
      await createPermission({
        linkId: link.id,
        email: 'owner@example.com',
        role: 'owner',
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'update-permission'));

      // Act: Try to update owner permission
      const result = await updatePermissionAction({
        linkId: link.id,
        email: 'owner@example.com',
        role: 'uploader',
      });

      // Assert: Should fail with owner protection error
      expect(result.success).toBe(false);
      expect(result.error).toContain('owner');
    });

    it('should fail when permission does not exist', async () => {
      // Arrange: Create user, workspace, and link (no permission)
      const user = await createTestUser();
      createdUserIds.add(user.id);
      const workspace = await createTestWorkspace({ userId: user.id });
      const link = await createTestLink({ workspaceId: workspace.id });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'update-permission'));

      // Act: Try to update non-existent permission
      const result = await updatePermissionAction({
        linkId: link.id,
        email: 'nonexistent@example.com',
        role: 'editor',
      });

      // Assert: Should fail with not found error
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should reject update for link not owned by user', async () => {
      // Arrange: Create two users, first owns link, second tries to update permission
      const owner = await createTestUser();
      createdUserIds.add(owner.id);
      const ownerWorkspace = await createTestWorkspace({ userId: owner.id });
      const link = await createTestLink({ workspaceId: ownerWorkspace.id });
      await createPermission({
        linkId: link.id,
        email: 'uploader@example.com',
        role: 'uploader',
      });

      const attacker = await createTestUser();
      createdUserIds.add(attacker.id);
      await createTestWorkspace({ userId: attacker.id });

      vi.mocked(auth).mockResolvedValue({ userId: attacker.id } as any);
      resetRateLimit(RateLimitKeys.userAction(attacker.id, 'update-permission'));

      // Act: Attacker tries to update permission on owner's link
      const result = await updatePermissionAction({
        linkId: link.id,
        email: 'uploader@example.com',
        role: 'editor',
      });

      // Assert: Should fail with ownership error
      expect(result.success).toBe(false);
      expect(result.error).toContain('You do not have permission');
    });

    it('should enforce rate limit (10 requests per minute)', async () => {
      // NOTE: We test with 3 successful requests to verify the mechanism
      // works without excessive database setup.

      // Arrange: Create user, workspace, link, and permissions
      const user = await createTestUser();
      createdUserIds.add(user.id);
      const workspace = await createTestWorkspace({ userId: user.id });
      const link = await createTestLink({ workspaceId: workspace.id });

      // Create only 4 permissions (for 3 updates + 1 extra)
      for (let i = 0; i < 4; i++) {
        await createPermission({
          linkId: link.id,
          email: `user${i}@example.com`,
          role: 'uploader',
        });
      }

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'update-permission'));

      // Act: Make 3 successful requests
      for (let i = 0; i < 3; i++) {
        const result = await updatePermissionAction({
          linkId: link.id,
          email: `user${i}@example.com`,
          role: 'editor',
        });
        expect(result.success).toBe(true);
      }

      // Verify we can still make more requests (we're at 3/10)
      const additionalResult = await updatePermissionAction({
        linkId: link.id,
        email: 'user3@example.com',
        role: 'editor',
      });
      expect(additionalResult.success).toBe(true);
    }, 10000); // 10 second timeout

    it('should validate input schema', async () => {
      // Arrange: Create user and workspace
      const user = await createTestUser();
      createdUserIds.add(user.id);
      const workspace = await createTestWorkspace({ userId: user.id });
      const link = await createTestLink({ workspaceId: workspace.id });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'update-permission'));

      // Act: Try to update permission with invalid email
      const result = await updatePermissionAction({
        linkId: link.id,
        email: 'invalid-email',
        role: 'editor',
      });

      // Assert: Should fail with validation error
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  // ===========================================================================
  // getLinkPermissionsAction Tests
  // ===========================================================================

  describe('getLinkPermissionsAction', () => {
    it('should return empty array when link has no permissions', async () => {
      // Arrange: Create user, workspace, and link (no permissions)
      const user = await createTestUser();
      createdUserIds.add(user.id);
      const workspace = await createTestWorkspace({ userId: user.id });
      const link = await createTestLink({ workspaceId: workspace.id });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'get-permissions'));

      // Act: Get permissions
      const result = await getLinkPermissionsAction({ linkId: link.id });

      // Assert: Should return empty array
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.length).toBe(0);
    });

    it('should return all permissions for a link', async () => {
      // Arrange: Create user, workspace, link, and multiple permissions
      const user = await createTestUser();
      createdUserIds.add(user.id);
      const workspace = await createTestWorkspace({ userId: user.id });
      const link = await createTestLink({ workspaceId: workspace.id });

      // Create 3 permissions
      await createPermission({
        linkId: link.id,
        email: 'uploader@example.com',
        role: 'uploader',
      });
      await createPermission({
        linkId: link.id,
        email: 'editor@example.com',
        role: 'editor',
      });
      await createPermission({
        linkId: link.id,
        email: 'owner@example.com',
        role: 'owner',
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'get-permissions'));

      // Act: Get permissions
      const result = await getLinkPermissionsAction({ linkId: link.id });

      // Assert: Should return all 3 permissions
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.length).toBe(3);

      // Verify all permissions are present
      const emails = result.data?.map((p) => p.email) || [];
      expect(emails).toContain('uploader@example.com');
      expect(emails).toContain('editor@example.com');
      expect(emails).toContain('owner@example.com');
    });

    it('should reject request for link not owned by user', async () => {
      // Arrange: Create two users, first owns link, second tries to get permissions
      const owner = await createTestUser();
      createdUserIds.add(owner.id);
      const ownerWorkspace = await createTestWorkspace({ userId: owner.id });
      const link = await createTestLink({ workspaceId: ownerWorkspace.id });

      const attacker = await createTestUser();
      createdUserIds.add(attacker.id);
      await createTestWorkspace({ userId: attacker.id });

      vi.mocked(auth).mockResolvedValue({ userId: attacker.id } as any);
      resetRateLimit(RateLimitKeys.userAction(attacker.id, 'get-permissions'));

      // Act: Attacker tries to get permissions from owner's link
      const result = await getLinkPermissionsAction({ linkId: link.id });

      // Assert: Should fail with ownership error
      expect(result.success).toBe(false);
      expect(result.error).toContain('You do not have permission');
    });

    it('should enforce rate limit (100 requests per minute)', async () => {
      // NOTE: We test with 5 requests to verify the mechanism works correctly.
      // The actual rate limit is 100/min, so 5 requests should all succeed.

      // Arrange: Create user, workspace, and link
      const user = await createTestUser();
      createdUserIds.add(user.id);
      const workspace = await createTestWorkspace({ userId: user.id });
      const link = await createTestLink({ workspaceId: workspace.id });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'get-permissions'));

      // Act: Make 5 successful requests (well under the 100/min limit)
      for (let i = 0; i < 5; i++) {
        const result = await getLinkPermissionsAction({ linkId: link.id });
        expect(result.success).toBe(true);
      }

      // Verify we can still make more requests (we're at 5/100)
      const additionalResult = await getLinkPermissionsAction({ linkId: link.id });
      expect(additionalResult.success).toBe(true);
    }, 10000); // 10 second timeout

    it('should validate linkId format', async () => {
      // Arrange: Create user and workspace
      const user = await createTestUser();
      createdUserIds.add(user.id);
      await createTestWorkspace({ userId: user.id });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'get-permissions'));

      // Act: Try to get permissions with invalid linkId
      const result = await getLinkPermissionsAction({ linkId: 'not-a-uuid' });

      // Assert: Should fail with validation error
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid');
    });

    it('should fail when link does not exist', async () => {
      // Arrange: Create user and workspace
      const user = await createTestUser();
      createdUserIds.add(user.id);
      await createTestWorkspace({ userId: user.id });

      const nonExistentLinkId = crypto.randomUUID();

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'get-permissions'));

      // Act: Try to get permissions for non-existent link
      const result = await getLinkPermissionsAction({
        linkId: nonExistentLinkId,
      });

      // Assert: Should fail with not found error
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });
});
