// =============================================================================
// PERMISSION QUERIES TESTS
// =============================================================================
// Tests for permission database operations using real database

import { describe, it, expect, afterEach } from 'vitest';
import {
  createPermission,
  getLinkPermissions,
  getPermissionByLinkAndEmail,
  deletePermission,
} from '../permission.queries';
import {
  createTestUser,
  createTestWorkspace,
  createTestLink,
  cleanupTestUser,
} from '@/test/db-test-utils';

describe('Permission Queries', () => {
  let testUserId: string;

  afterEach(async () => {
    // Clean up test data after each test (cascades to workspaces, links, permissions)
    if (testUserId) {
      await cleanupTestUser(testUserId);
    }
  });

  describe('createPermission', () => {
    it('should create owner permission successfully', async () => {
      // Arrange: Create test user, workspace, and link
      const user = await createTestUser();
      testUserId = user.id;

      const workspace = await createTestWorkspace({
        userId: testUserId,
        name: 'Test Workspace',
      });

      const link = await createTestLink({
        workspaceId: workspace.id,
        slug: 'test-link-owner',
        name: 'Test Link',
      });

      // Act: Create owner permission
      const result = await createPermission({
        linkId: link.id,
        email: 'owner@example.com',
        role: 'owner',
      });

      // Assert: Permission should be created correctly
      expect(result).toBeDefined();
      expect(result.linkId).toBe(link.id);
      expect(result.email).toBe('owner@example.com');
      expect(result.role).toBe('owner');
      expect(result.isVerified).toBe('true'); // Owners are auto-verified
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('should create editor permission successfully', async () => {
      // Arrange: Create test user, workspace, and link
      const user = await createTestUser();
      testUserId = user.id;

      const workspace = await createTestWorkspace({
        userId: testUserId,
      });

      const link = await createTestLink({
        workspaceId: workspace.id,
        slug: 'test-link-editor',
      });

      // Act: Create editor permission
      const result = await createPermission({
        linkId: link.id,
        email: 'editor@example.com',
        role: 'editor',
      });

      // Assert: Permission should be created with editor role
      expect(result.role).toBe('editor');
      expect(result.email).toBe('editor@example.com');
      expect(result.isVerified).toBe('false'); // Editors need verification
    });

    it('should create uploader permission successfully', async () => {
      // Arrange: Create test user, workspace, and link
      const user = await createTestUser();
      testUserId = user.id;

      const workspace = await createTestWorkspace({
        userId: testUserId,
      });

      const link = await createTestLink({
        workspaceId: workspace.id,
        slug: 'test-link-uploader',
      });

      // Act: Create uploader permission
      const result = await createPermission({
        linkId: link.id,
        email: 'uploader@example.com',
        role: 'uploader',
      });

      // Assert: Permission should be created with uploader role
      expect(result.role).toBe('uploader');
      expect(result.email).toBe('uploader@example.com');
      expect(result.isVerified).toBe('false'); // Uploaders don't need verification
    });

    it('should throw error for duplicate permission (same link + email)', async () => {
      // Arrange: Create test user, workspace, link, and initial permission
      const user = await createTestUser();
      testUserId = user.id;

      const workspace = await createTestWorkspace({
        userId: testUserId,
      });

      const link = await createTestLink({
        workspaceId: workspace.id,
        slug: 'test-link-duplicate',
      });

      // Create first permission
      await createPermission({
        linkId: link.id,
        email: 'test@example.com',
        role: 'owner',
      });

      // Act & Assert: Attempt to create duplicate permission should fail
      await expect(
        createPermission({
          linkId: link.id,
          email: 'test@example.com',
          role: 'editor',
        })
      ).rejects.toThrow(); // Unique constraint violation
    });

    it('should throw error for invalid link_id (foreign key)', async () => {
      // Act & Assert: Attempt to create permission with non-existent link
      await expect(
        createPermission({
          linkId: 'nonexistent-link-id',
          email: 'test@example.com',
          role: 'owner',
        })
      ).rejects.toThrow(); // Foreign key constraint violation
    });
  });

  describe('getLinkPermissions', () => {
    it('should return empty array for link with no permissions', async () => {
      // Arrange: Create test user, workspace, and link (no permissions)
      const user = await createTestUser();
      testUserId = user.id;

      const workspace = await createTestWorkspace({
        userId: testUserId,
      });

      const link = await createTestLink({
        workspaceId: workspace.id,
        slug: 'test-link-no-perms',
      });

      // Act: Get permissions for link
      const result = await getLinkPermissions(link.id);

      // Assert: Should return empty array
      expect(result).toEqual([]);
    });

    it('should return all permissions for a link', async () => {
      // Arrange: Create test user, workspace, link, and multiple permissions
      const user = await createTestUser();
      testUserId = user.id;

      const workspace = await createTestWorkspace({
        userId: testUserId,
      });

      const link = await createTestLink({
        workspaceId: workspace.id,
        slug: 'test-link-multi-perms',
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

      // Act: Get all permissions
      const result = await getLinkPermissions(link.id);

      // Assert: Should return both permissions
      expect(result).toHaveLength(2);
      expect(result.map((p) => p.email)).toContain('owner@example.com');
      expect(result.map((p) => p.email)).toContain('editor@example.com');
    });
  });

  describe('getPermissionByLinkAndEmail', () => {
    it('should return undefined when permission does not exist', async () => {
      // Arrange: Create test user, workspace, and link
      const user = await createTestUser();
      testUserId = user.id;

      const workspace = await createTestWorkspace({
        userId: testUserId,
      });

      const link = await createTestLink({
        workspaceId: workspace.id,
        slug: 'test-link-no-match',
      });

      // Act: Try to get non-existent permission
      const result = await getPermissionByLinkAndEmail(
        link.id,
        'nonexistent@example.com'
      );

      // Assert: Should return undefined
      expect(result).toBeUndefined();
    });

    it('should return permission when it exists', async () => {
      // Arrange: Create test user, workspace, link, and permission
      const user = await createTestUser();
      testUserId = user.id;

      const workspace = await createTestWorkspace({
        userId: testUserId,
      });

      const link = await createTestLink({
        workspaceId: workspace.id,
        slug: 'test-link-exists',
      });

      await createPermission({
        linkId: link.id,
        email: 'test@example.com',
        role: 'owner',
      });

      // Act: Get permission by link and email
      const result = await getPermissionByLinkAndEmail(
        link.id,
        'test@example.com'
      );

      // Assert: Should return the permission
      expect(result).toBeDefined();
      expect(result?.email).toBe('test@example.com');
      expect(result?.role).toBe('owner');
    });

    it('should be case-sensitive for email lookup', async () => {
      // Arrange: Create test user, workspace, link, and permission
      const user = await createTestUser();
      testUserId = user.id;

      const workspace = await createTestWorkspace({
        userId: testUserId,
      });

      const link = await createTestLink({
        workspaceId: workspace.id,
        slug: 'test-link-case-sensitive',
      });

      await createPermission({
        linkId: link.id,
        email: 'Test@Example.com',
        role: 'owner',
      });

      // Act: Try to get permission with different case
      const result = await getPermissionByLinkAndEmail(
        link.id,
        'test@example.com'
      );

      // Assert: Should return undefined (case mismatch)
      expect(result).toBeUndefined();
    });
  });

  describe('deletePermission', () => {
    it('should delete permission successfully', async () => {
      // Arrange: Create test user, workspace, link, and permission
      const user = await createTestUser();
      testUserId = user.id;

      const workspace = await createTestWorkspace({
        userId: testUserId,
      });

      const link = await createTestLink({
        workspaceId: workspace.id,
        slug: 'test-link-delete',
      });

      const permission = await createPermission({
        linkId: link.id,
        email: 'test@example.com',
        role: 'owner',
      });

      // Act: Delete permission
      await deletePermission(permission.id);

      // Assert: Permission should be deleted
      const result = await getPermissionByLinkAndEmail(
        link.id,
        'test@example.com'
      );
      expect(result).toBeUndefined();
    });

    it('should not throw error when deleting nonexistent permission', async () => {
      // Act & Assert: Deleting non-existent permission should not throw
      await expect(
        deletePermission('nonexistent-id')
      ).resolves.not.toThrow();
    });
  });
});
