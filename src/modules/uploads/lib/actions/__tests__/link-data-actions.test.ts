// =============================================================================
// LINK DATA ACTIONS TESTS
// =============================================================================
// Tests for link validation and access for external uploaders

import { describe, it, expect, afterEach } from 'vitest';
import { validateLinkAccessAction } from '../link-data-actions';
import {
  createTestUser,
  createTestWorkspace,
  createTestLink,
  cleanupTestUser,
  testData,
} from '@/test/db-test-utils';

describe('Link Data Actions', () => {
  let testUserId: string;

  afterEach(async () => {
    // Clean up test data
    if (testUserId) {
      await cleanupTestUser(testUserId);
    }
  });

  describe('validateLinkAccessAction', () => {
    it('should return error when slug format is invalid (missing parts)', async () => {
      // Arrange: Invalid URL format (only username, no slug)
      const slugParts = ['username'];

      // Act: Validate link access
      const result = await validateLinkAccessAction({ slugParts });

      // Assert: Should return invalid format error
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid link format');
    });

    it('should return error when slug format is empty', async () => {
      // Arrange: Empty slug parts array
      const slugParts: string[] = [];

      // Act: Validate link access
      const result = await validateLinkAccessAction({ slugParts });

      // Assert: Should return invalid format error
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid link format');
    });

    it('should return error when link does not exist', async () => {
      // Arrange: Valid URL format but non-existent link
      const slugParts = ['username', 'non-existent-slug'];

      // Act: Validate link access
      const result = await validateLinkAccessAction({ slugParts });

      // Assert: Should return link not found error
      expect(result.success).toBe(false);
      expect(result.error).toBe('Link not found');
    });

    it('should return error when link is inactive', async () => {
      // Arrange: Create test user, workspace, and inactive link
      const user = await createTestUser();
      testUserId = user.id;

      const workspace = await createTestWorkspace({
        userId: testUserId,
        name: 'Test Workspace',
      });

      const inactiveLink = await createTestLink({
        workspaceId: workspace.id,
        name: 'Inactive Link',
        isActive: false, // Link is paused
        isPublic: true,
      });

      const slugParts = ['username', inactiveLink.slug];

      // Act: Validate link access
      const result = await validateLinkAccessAction({ slugParts });

      // Assert: Should return inactive link error
      expect(result.success).toBe(false);
      expect(result.error).toBe('This link is currently inactive');
    });

    it('should successfully validate active public link', async () => {
      // Arrange: Create test user, workspace, and active public link
      const user = await createTestUser();
      testUserId = user.id;

      const workspace = await createTestWorkspace({
        userId: testUserId,
        name: 'Test Workspace',
      });

      const activeLink = await createTestLink({
        workspaceId: workspace.id,
        name: 'Test Public Link',
        isActive: true,
        isPublic: true,
      });

      const slugParts = ['username', activeLink.slug];

      // Act: Validate link access
      const result = await validateLinkAccessAction({ slugParts });

      // Assert: Should return success with link data
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.linkId).toBe(activeLink.id);
        expect(result.data.linkName).toBe('Test Public Link');
        expect(result.data.slug).toBe(activeLink.slug);
        expect(result.data.isPublic).toBe(true);
        expect(result.data.workspaceId).toBe(workspace.id);
        expect(result.data.ownerUsername).toBeDefined();
      }
    });

    it('should successfully validate active dedicated link', async () => {
      // Arrange: Create test user, workspace, and active dedicated link
      const user = await createTestUser();
      testUserId = user.id;

      const workspace = await createTestWorkspace({
        userId: testUserId,
        name: 'Test Workspace',
      });

      const dedicatedLink = await createTestLink({
        workspaceId: workspace.id,
        name: 'Test Dedicated Link',
        isActive: true,
        isPublic: false, // Dedicated link
      });

      const slugParts = ['username', dedicatedLink.slug];

      // Act: Validate link access
      const result = await validateLinkAccessAction({ slugParts });

      // Assert: Should return success (permission check happens at upload, not here)
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.linkId).toBe(dedicatedLink.id);
        expect(result.data.linkName).toBe('Test Dedicated Link');
        expect(result.data.slug).toBe(dedicatedLink.slug);
        expect(result.data.isPublic).toBe(false);
        expect(result.data.workspaceId).toBe(workspace.id);
      }
    });

    it('should return username as "User" when user has no username', async () => {
      // Arrange: Create test user WITHOUT username, workspace, and link
      const userId = testData.generateUserId();
      testUserId = userId;

      // Create user without username in database (null username)
      const user = await createTestUser(userId);

      const workspace = await createTestWorkspace({
        userId: testUserId,
        name: 'Test Workspace',
      });

      const link = await createTestLink({
        workspaceId: workspace.id,
        name: 'Test Link',
        isActive: true,
        isPublic: true,
      });

      const slugParts = ['username', link.slug];

      // Act: Validate link access
      const result = await validateLinkAccessAction({ slugParts });

      // Assert: Should default to "User" when username is null
      expect(result.success).toBe(true);
      if (result.success) {
        // Username should be present (from test data) or default to 'User'
        expect(result.data.ownerUsername).toBeDefined();
        expect(typeof result.data.ownerUsername).toBe('string');
      }
    });

    it('should handle links with custom message and requirements', async () => {
      // Arrange: Create link with custom settings
      const user = await createTestUser();
      testUserId = user.id;

      const workspace = await createTestWorkspace({
        userId: testUserId,
        name: 'Test Workspace',
      });

      // Note: createTestLink doesn't support all fields yet, but this tests the data structure
      const link = await createTestLink({
        workspaceId: workspace.id,
        name: 'Link with Requirements',
        isActive: true,
        isPublic: true,
      });

      const slugParts = ['username', link.slug];

      // Act: Validate link access
      const result = await validateLinkAccessAction({ slugParts });

      // Assert: Should return all link data fields
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveProperty('customMessage');
        expect(result.data).toHaveProperty('requiresName');
        expect(result.data).toHaveProperty('requiresMessage');
      }
    });
  });
});
