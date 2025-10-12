// =============================================================================
// WORKSPACE QUERIES TESTS
// =============================================================================
// Tests for workspace database operations using real database

import { describe, it, expect, afterEach } from 'vitest';
import {
  getUserWorkspace,
  createWorkspace,
  updateWorkspaceName,
} from '../workspace.queries';
import {
  createTestUser,
  cleanupTestUser,
  testData,
} from '@/test/db-test-utils';

describe('Workspace Queries', () => {
  let testUserId: string;

  afterEach(async () => {
    // Clean up test data after each test
    if (testUserId) {
      await cleanupTestUser(testUserId);
    }
  });

  describe('getUserWorkspace', () => {
    it('should return workspace when user has one', async () => {
      // Arrange: Create test user
      const user = await createTestUser();
      testUserId = user.id;

      // Create workspace for user
      const workspace = await createWorkspace({
        userId: testUserId,
        name: 'Test Workspace',
      });

      // Act: Get workspace by userId
      const result = await getUserWorkspace(testUserId);

      // Assert: Workspace should be found
      expect(result).toBeDefined();
      expect(result?.id).toBe(workspace.id);
      expect(result?.userId).toBe(testUserId);
      expect(result?.name).toBe('Test Workspace');
    });

    it('should return undefined when user has no workspace', async () => {
      // Arrange: Create test user without workspace
      const user = await createTestUser();
      testUserId = user.id;

      // Act: Get workspace by userId
      const result = await getUserWorkspace(testUserId);

      // Assert: No workspace should be found
      expect(result).toBeUndefined();
    });
  });

  describe('createWorkspace', () => {
    it('should successfully create a workspace', async () => {
      // Arrange: Create test user
      const user = await createTestUser();
      testUserId = user.id;

      // Act: Create workspace
      const workspace = await createWorkspace({
        userId: testUserId,
        name: 'New Workspace',
      });

      // Assert: Workspace should be created with correct data
      expect(workspace).toBeDefined();
      expect(workspace.id).toBeDefined();
      expect(workspace.userId).toBe(testUserId);
      expect(workspace.name).toBe('New Workspace');
      expect(workspace.createdAt).toBeInstanceOf(Date);
      expect(workspace.updatedAt).toBeInstanceOf(Date);
    });

    it('should throw error when creating duplicate workspace for same user', async () => {
      // Arrange: Create test user with existing workspace
      const user = await createTestUser();
      testUserId = user.id;

      await createWorkspace({
        userId: testUserId,
        name: 'First Workspace',
      });

      // Act & Assert: Attempt to create second workspace should fail
      // (unique constraint on userId in database schema)
      await expect(
        createWorkspace({
          userId: testUserId,
          name: 'Second Workspace',
        })
      ).rejects.toThrow();
    });
  });

  describe('updateWorkspaceName', () => {
    it('should successfully update workspace name', async () => {
      // Arrange: Create test user and workspace
      const user = await createTestUser();
      testUserId = user.id;

      const workspace = await createWorkspace({
        userId: testUserId,
        name: 'Original Name',
      });

      // Act: Update workspace name
      const updatedWorkspace = await updateWorkspaceName(
        workspace.id,
        'Updated Name'
      );

      // Assert: Name should be updated
      expect(updatedWorkspace).toBeDefined();
      expect(updatedWorkspace.id).toBe(workspace.id);
      expect(updatedWorkspace.name).toBe('Updated Name');
      expect(updatedWorkspace.updatedAt).toBeInstanceOf(Date);
    });

    it('should return undefined when workspace not found', async () => {
      // Arrange: Use non-existent workspace ID
      const nonExistentId = testData.generateWorkspaceId();

      // Act: Attempt to update non-existent workspace
      const result = await updateWorkspaceName(nonExistentId, 'New Name');

      // Assert: Result should be undefined (no rows returned)
      expect(result).toBeUndefined();
    });
  });
});
