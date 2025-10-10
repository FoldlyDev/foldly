// =============================================================================
// WORKSPACE ACTIONS TESTS
// =============================================================================
// Tests for workspace server actions with authentication checks

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createUserWorkspaceAction,
  updateWorkspaceNameAction,
} from '../workspace.actions';
import {
  createTestUser,
  createTestWorkspace,
  cleanupTestUser,
  testData,
} from '@/test/db-test-utils';

// Mock Clerk authentication
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
}));

import { auth, currentUser } from '@clerk/nextjs/server';

describe('Workspace Actions', () => {
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

  describe('createUserWorkspaceAction', () => {
    it('should return error when user is not authenticated', async () => {
      // Arrange: Mock unauthenticated state
      vi.mocked(auth).mockResolvedValue({ userId: null } as any);
      vi.mocked(currentUser).mockResolvedValue(null);

      // Act: Attempt to create workspace
      const result = await createUserWorkspaceAction('testuser');

      // Assert: Should return unauthorized error
      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized - user not authenticated');
    });

    it('should successfully create workspace for authenticated user', async () => {
      // Arrange: Create test user and mock authentication
      const user = await createTestUser();
      testUserId = user.id;

      vi.mocked(auth).mockResolvedValue({ userId: testUserId } as any);
      vi.mocked(currentUser).mockResolvedValue({
        id: testUserId,
        username: 'testuser',
      } as any);

      // Act: Create workspace
      const result = await createUserWorkspaceAction('testuser');

      // Assert: Workspace should be created successfully
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.workspace).toBeDefined();
        expect(result.workspace.userId).toBe(testUserId);
        expect(result.workspace.name).toBe("testuser's Workspace");
      }
    });

    it('should return error when workspace already exists', async () => {
      // Arrange: Create test user with existing workspace
      const user = await createTestUser();
      testUserId = user.id;

      await createTestWorkspace({
        userId: testUserId,
        name: 'Existing Workspace',
      });

      vi.mocked(auth).mockResolvedValue({ userId: testUserId } as any);
      vi.mocked(currentUser).mockResolvedValue({
        id: testUserId,
        username: 'testuser',
      } as any);

      // Act: Attempt to create second workspace
      const result = await createUserWorkspaceAction('testuser');

      // Assert: Should return duplicate workspace error
      expect(result.success).toBe(false);
      expect(result.error).toBe('Workspace already exists for this user');
    });
  });

  describe('updateWorkspaceNameAction', () => {
    it('should return error when user is not authenticated', async () => {
      // Arrange: Mock unauthenticated state
      vi.mocked(auth).mockResolvedValue({ userId: null } as any);

      // Act: Attempt to update workspace
      const result = await updateWorkspaceNameAction(
        'workspace-id',
        'New Name'
      );

      // Assert: Should return unauthorized error
      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized');
    });

    it('should return error when user does not own workspace', async () => {
      // Arrange: Create test user and workspace owned by another user
      const user = await createTestUser();
      testUserId = user.id;

      const workspace = await createTestWorkspace({
        userId: testUserId,
        name: 'Original Workspace',
      });

      // Mock authentication as a different user
      const differentUserId = testData.generateUserId();
      vi.mocked(auth).mockResolvedValue({ userId: differentUserId } as any);

      // Act: Attempt to update workspace owned by different user
      const result = await updateWorkspaceNameAction(
        workspace.id,
        'New Name'
      );

      // Assert: Should return not found/unauthorized error
      expect(result.success).toBe(false);
      expect(result.error).toBe('Workspace not found or unauthorized');
    });

    it('should successfully update workspace name for owner', async () => {
      // Arrange: Create test user and workspace
      const user = await createTestUser();
      testUserId = user.id;

      const workspace = await createTestWorkspace({
        userId: testUserId,
        name: 'Original Workspace',
      });

      vi.mocked(auth).mockResolvedValue({ userId: testUserId } as any);

      // Act: Update workspace name
      const result = await updateWorkspaceNameAction(
        workspace.id,
        'Updated Workspace Name'
      );

      // Assert: Name should be updated successfully
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.workspace).toBeDefined();
        expect(result.workspace.id).toBe(workspace.id);
        expect(result.workspace.name).toBe('Updated Workspace Name');
      }
    });

    it('should return error when workspace not found', async () => {
      // Arrange: Create test user
      const user = await createTestUser();
      testUserId = user.id;

      vi.mocked(auth).mockResolvedValue({ userId: testUserId } as any);

      const nonExistentId = testData.generateWorkspaceId();

      // Act: Attempt to update non-existent workspace
      const result = await updateWorkspaceNameAction(
        nonExistentId,
        'New Name'
      );

      // Assert: Should return not found error
      expect(result.success).toBe(false);
      expect(result.error).toBe('Workspace not found or unauthorized');
    });
  });
});
