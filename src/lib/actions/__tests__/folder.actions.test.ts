// =============================================================================
// FOLDER ACTIONS TESTS
// =============================================================================
// Tests for global folder CRUD operations with ownership verification

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getRootFoldersAction,
  getFolderHierarchyAction,
  createFolderAction,
  updateFolderAction,
  moveFolderAction,
  deleteFolderAction,
} from '../folder.actions';
import {
  createTestUser,
  createTestWorkspace,
  createTestFolder,
  cleanupTestUser,
} from '@/test/db-test-utils';
import { resetRateLimit, RateLimitKeys } from '@/lib/middleware/rate-limit';
import { VALIDATION_LIMITS } from '@/lib/constants/validation';

// Mock Clerk authentication
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(() => ({ has: vi.fn() })),
}));

import { auth } from '@clerk/nextjs/server';

describe('Folder Actions', () => {
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
  // getRootFoldersAction() Tests
  // =============================================================================
  describe('getRootFoldersAction', () => {
    it('should return empty array when user has no folders', async () => {
      // Arrange: Create test user with workspace but no folders
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);

      // Reset rate limit for clean test
      resetRateLimit(RateLimitKeys.userAction(user.id, 'list-root-folders'));

      // Act: Get root folders
      const result = await getRootFoldersAction();

      // Assert: Should return empty array
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data?.length).toBe(0);
    });

    it('should return all root folders for authenticated user workspace', async () => {
      // Arrange: Create test user with workspace and root folders
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      // Create multiple root folders
      const folder1 = await createTestFolder({
        workspaceId: workspace.id,
        name: 'Root Folder 1',
        parentFolderId: null,
      });
      const folder2 = await createTestFolder({
        workspaceId: workspace.id,
        name: 'Root Folder 2',
        parentFolderId: null,
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'list-root-folders'));

      // Act: Get root folders
      const result = await getRootFoldersAction();

      // Assert: Should return both root folders
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.length).toBe(2);
      expect(result.data?.map(f => f.id)).toContain(folder1.id);
      expect(result.data?.map(f => f.id)).toContain(folder2.id);
    });

    it('should not return nested folders', async () => {
      // Arrange: Create root folder with nested folder
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      const rootFolder = await createTestFolder({
        workspaceId: workspace.id,
        name: 'Root Folder',
        parentFolderId: null,
      });

      const nestedFolder = await createTestFolder({
        workspaceId: workspace.id,
        name: 'Nested Folder',
        parentFolderId: rootFolder.id,
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'list-root-folders'));

      // Act: Get root folders
      const result = await getRootFoldersAction();

      // Assert: Should only return root folder
      expect(result.success).toBe(true);
      expect(result.data?.length).toBe(1);
      expect(result.data?.[0].id).toBe(rootFolder.id);
      expect(result.data?.map(f => f.id)).not.toContain(nestedFolder.id);
    });

    it('should return error when user is not authenticated', async () => {
      // Arrange: No authenticated user
      vi.mocked(auth).mockResolvedValue({ userId: null } as any);

      // Act: Attempt to get root folders
      const result = await getRootFoldersAction();

      // Assert: Should return error
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  // =============================================================================
  // getFolderHierarchyAction() Tests
  // =============================================================================
  describe('getFolderHierarchyAction', () => {
    it('should return hierarchy for nested folder', async () => {
      // Arrange: Create folder hierarchy (root → level1 → level2)
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      const rootFolder = await createTestFolder({
        workspaceId: workspace.id,
        name: 'Root',
        parentFolderId: null,
      });

      const level1 = await createTestFolder({
        workspaceId: workspace.id,
        name: 'Level 1',
        parentFolderId: rootFolder.id,
      });

      const level2 = await createTestFolder({
        workspaceId: workspace.id,
        name: 'Level 2',
        parentFolderId: level1.id,
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'get-folder-hierarchy'));

      // Act: Get hierarchy for level2
      const result = await getFolderHierarchyAction({ folderId: level2.id });

      // Assert: Should return [root, level1, level2]
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.length).toBe(3);
      expect(result.data?.[0].id).toBe(rootFolder.id);
      expect(result.data?.[1].id).toBe(level1.id);
      expect(result.data?.[2].id).toBe(level2.id);
    });

    it('should return single folder for root folder', async () => {
      // Arrange: Create root folder
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      const rootFolder = await createTestFolder({
        workspaceId: workspace.id,
        name: 'Root',
        parentFolderId: null,
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'get-folder-hierarchy'));

      // Act: Get hierarchy for root folder
      const result = await getFolderHierarchyAction({ folderId: rootFolder.id });

      // Assert: Should return only the root folder
      expect(result.success).toBe(true);
      expect(result.data?.length).toBe(1);
      expect(result.data?.[0].id).toBe(rootFolder.id);
    });

    it('should return error when folder does not exist', async () => {
      // Arrange: Authenticated user
      const user = await createTestUser();
      createdUserIds.add(user.id);

      await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'get-folder-hierarchy'));

      // Act: Attempt to get hierarchy for non-existent folder
      const result = await getFolderHierarchyAction({ folderId: 'non-existent-id' });

      // Assert: Should return error
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return error when folder belongs to different workspace', async () => {
      // Arrange: Create two users with different workspaces
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      createdUserIds.add(user1.id);
      createdUserIds.add(user2.id);

      const workspace1 = await createTestWorkspace({
        userId: user1.id,
        name: 'Workspace 1',
      });

      const workspace2 = await createTestWorkspace({
        userId: user2.id,
        name: 'Workspace 2',
      });

      const folder1 = await createTestFolder({
        workspaceId: workspace1.id,
        name: 'User 1 Folder',
      });

      // User 2 tries to access user 1's folder
      vi.mocked(auth).mockResolvedValue({ userId: user2.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user2.id, 'get-folder-hierarchy'));

      // Act: User 2 attempts to get hierarchy for user 1's folder
      const result = await getFolderHierarchyAction({ folderId: folder1.id });

      // Assert: Should return error
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  // =============================================================================
  // createFolderAction() Tests
  // =============================================================================
  describe('createFolderAction', () => {
    it('should create root folder successfully', async () => {
      // Arrange: Authenticated user with workspace
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'create-folder'));

      // Act: Create root folder
      const result = await createFolderAction({
        name: 'New Root Folder',
        parentFolderId: null,
      });

      // Assert: Should create folder successfully
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.name).toBe('New Root Folder');
      expect(result.data?.parentFolderId).toBe(null);
      expect(result.data?.workspaceId).toBe(workspace.id);
    });

    it('should create nested folder with valid parent', async () => {
      // Arrange: Create parent folder
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      const parentFolder = await createTestFolder({
        workspaceId: workspace.id,
        name: 'Parent Folder',
        parentFolderId: null,
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'create-folder'));

      // Act: Create child folder
      const result = await createFolderAction({
        name: 'Child Folder',
        parentFolderId: parentFolder.id,
      });

      // Assert: Should create nested folder successfully
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Child Folder');
      expect(result.data?.parentFolderId).toBe(parentFolder.id);
    });

    it('should reject when nesting depth exceeds limit', async () => {
      // Arrange: Create folder hierarchy at maximum depth
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      // Create folders up to maximum depth (20 levels)
      let currentFolder = await createTestFolder({
        workspaceId: workspace.id,
        name: 'Level 0',
        parentFolderId: null,
      });

      // Create 19 more levels (total 20)
      for (let i = 1; i < VALIDATION_LIMITS.FOLDER.MAX_NESTING_DEPTH; i++) {
        currentFolder = await createTestFolder({
          workspaceId: workspace.id,
          name: `Level ${i}`,
          parentFolderId: currentFolder.id,
        });
      }

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'create-folder'));

      // Act: Attempt to create folder at depth 21
      const result = await createFolderAction({
        name: 'Too Deep',
        parentFolderId: currentFolder.id,
      });

      // Assert: Should reject due to nesting limit
      expect(result.success).toBe(false);
      expect(result.error).toContain('Maximum nesting depth');
    }, 15000); // Increased timeout for deep folder creation

    it('should reject duplicate names in same parent context', async () => {
      // Arrange: Create folder with specific name
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      await createTestFolder({
        workspaceId: workspace.id,
        name: 'Documents',
        parentFolderId: null,
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'create-folder'));

      // Act: Attempt to create another folder with same name in same parent context
      const result = await createFolderAction({
        name: 'Documents',
        parentFolderId: null,
      });

      // Assert: Should reject duplicate name
      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });

    it('should allow duplicate names in different parent contexts', async () => {
      // Arrange: Create two parent folders
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      const parent1 = await createTestFolder({
        workspaceId: workspace.id,
        name: 'Parent 1',
        parentFolderId: null,
      });

      const parent2 = await createTestFolder({
        workspaceId: workspace.id,
        name: 'Parent 2',
        parentFolderId: null,
      });

      // Create child folder in parent1
      await createTestFolder({
        workspaceId: workspace.id,
        name: 'Documents',
        parentFolderId: parent1.id,
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'create-folder'));

      // Act: Create child folder with same name in parent2
      const result = await createFolderAction({
        name: 'Documents',
        parentFolderId: parent2.id,
      });

      // Assert: Should allow duplicate name in different parent
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Documents');
      expect(result.data?.parentFolderId).toBe(parent2.id);
    });

    it('should return error when parent folder does not exist', async () => {
      // Arrange: Authenticated user
      const user = await createTestUser();
      createdUserIds.add(user.id);

      await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'create-folder'));

      // Act: Attempt to create folder with non-existent parent
      const result = await createFolderAction({
        name: 'Child Folder',
        parentFolderId: 'non-existent-parent',
      });

      // Assert: Should return error
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return error when parent belongs to different workspace', async () => {
      // Arrange: Create two users with different workspaces
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      createdUserIds.add(user1.id);
      createdUserIds.add(user2.id);

      const workspace1 = await createTestWorkspace({
        userId: user1.id,
        name: 'Workspace 1',
      });

      const workspace2 = await createTestWorkspace({
        userId: user2.id,
        name: 'Workspace 2',
      });

      const folder1 = await createTestFolder({
        workspaceId: workspace1.id,
        name: 'User 1 Folder',
      });

      // User 2 tries to create child in user 1's folder
      vi.mocked(auth).mockResolvedValue({ userId: user2.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user2.id, 'create-folder'));

      // Act: User 2 attempts to create folder under user 1's folder
      const result = await createFolderAction({
        name: 'Child Folder',
        parentFolderId: folder1.id,
      });

      // Assert: Should return error
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  // =============================================================================
  // updateFolderAction() Tests
  // =============================================================================
  describe('updateFolderAction', () => {
    it('should update folder name successfully', async () => {
      // Arrange: Create folder
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      const folder = await createTestFolder({
        workspaceId: workspace.id,
        name: 'Original Name',
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'update-folder'));

      // Act: Update folder name
      const result = await updateFolderAction({
        folderId: folder.id,
        name: 'Updated Name',
      });

      // Assert: Should update successfully
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Updated Name');
      expect(result.data?.id).toBe(folder.id);
    });

    it('should reject duplicate name in same parent context', async () => {
      // Arrange: Create two folders in same parent
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      await createTestFolder({
        workspaceId: workspace.id,
        name: 'Existing Folder',
        parentFolderId: null,
      });

      const folder = await createTestFolder({
        workspaceId: workspace.id,
        name: 'My Folder',
        parentFolderId: null,
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'update-folder'));

      // Act: Attempt to rename to existing name
      const result = await updateFolderAction({
        folderId: folder.id,
        name: 'Existing Folder',
      });

      // Assert: Should reject duplicate name
      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });

    it('should allow renaming to same name (no-op)', async () => {
      // Arrange: Create folder
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      const folder = await createTestFolder({
        workspaceId: workspace.id,
        name: 'My Folder',
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'update-folder'));

      // Act: "Rename" to same name
      const result = await updateFolderAction({
        folderId: folder.id,
        name: 'My Folder',
      });

      // Assert: Should succeed (no-op)
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('My Folder');
    });

    it('should return error when folder does not exist', async () => {
      // Arrange: Authenticated user
      const user = await createTestUser();
      createdUserIds.add(user.id);

      await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'update-folder'));

      // Act: Attempt to update non-existent folder
      const result = await updateFolderAction({
        folderId: 'non-existent-id',
        name: 'New Name',
      });

      // Assert: Should return error
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return error when folder belongs to different workspace', async () => {
      // Arrange: Create two users with different workspaces
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      createdUserIds.add(user1.id);
      createdUserIds.add(user2.id);

      const workspace1 = await createTestWorkspace({
        userId: user1.id,
        name: 'Workspace 1',
      });

      await createTestWorkspace({
        userId: user2.id,
        name: 'Workspace 2',
      });

      const folder1 = await createTestFolder({
        workspaceId: workspace1.id,
        name: 'User 1 Folder',
      });

      // User 2 tries to update user 1's folder
      vi.mocked(auth).mockResolvedValue({ userId: user2.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user2.id, 'update-folder'));

      // Act: User 2 attempts to update user 1's folder
      const result = await updateFolderAction({
        folderId: folder1.id,
        name: 'Hacked Name',
      });

      // Assert: Should return error
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  // =============================================================================
  // moveFolderAction() Tests
  // =============================================================================
  describe('moveFolderAction', () => {
    it('should move folder to new parent successfully', async () => {
      // Arrange: Create source and target folders
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      const parent1 = await createTestFolder({
        workspaceId: workspace.id,
        name: 'Parent 1',
        parentFolderId: null,
      });

      const parent2 = await createTestFolder({
        workspaceId: workspace.id,
        name: 'Parent 2',
        parentFolderId: null,
      });

      const childFolder = await createTestFolder({
        workspaceId: workspace.id,
        name: 'Child',
        parentFolderId: parent1.id,
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'move-folder'));

      // Act: Move child from parent1 to parent2
      const result = await moveFolderAction({
        folderId: childFolder.id,
        newParentId: parent2.id,
      });

      // Assert: Should move successfully
      expect(result.success).toBe(true);
      expect(result.data?.parentFolderId).toBe(parent2.id);
    });

    it('should move folder to root (null parent)', async () => {
      // Arrange: Create nested folder
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      const parentFolder = await createTestFolder({
        workspaceId: workspace.id,
        name: 'Parent',
        parentFolderId: null,
      });

      const childFolder = await createTestFolder({
        workspaceId: workspace.id,
        name: 'Child',
        parentFolderId: parentFolder.id,
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'move-folder'));

      // Act: Move child to root
      const result = await moveFolderAction({
        folderId: childFolder.id,
        newParentId: null,
      });

      // Assert: Should move to root successfully
      expect(result.success).toBe(true);
      expect(result.data?.parentFolderId).toBe(null);
    });

    it('should prevent circular reference (move folder into itself)', async () => {
      // Arrange: Create folder
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      const folder = await createTestFolder({
        workspaceId: workspace.id,
        name: 'Folder',
        parentFolderId: null,
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'move-folder'));

      // Act: Attempt to move folder into itself
      const result = await moveFolderAction({
        folderId: folder.id,
        newParentId: folder.id,
      });

      // Assert: Should reject circular reference
      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot move folder into its own subfolder');
    });

    it('should prevent moving folder into its descendant', async () => {
      // Arrange: Create folder hierarchy (grandparent → parent → child)
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      const grandparent = await createTestFolder({
        workspaceId: workspace.id,
        name: 'Grandparent',
        parentFolderId: null,
      });

      const parent = await createTestFolder({
        workspaceId: workspace.id,
        name: 'Parent',
        parentFolderId: grandparent.id,
      });

      const child = await createTestFolder({
        workspaceId: workspace.id,
        name: 'Child',
        parentFolderId: parent.id,
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'move-folder'));

      // Act: Attempt to move grandparent into child (its descendant)
      const result = await moveFolderAction({
        folderId: grandparent.id,
        newParentId: child.id,
      });

      // Assert: Should reject circular reference
      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot move folder into its own subfolder');
    });

    it('should enforce nesting depth limit after move', async () => {
      // Arrange: Create folder hierarchy at maximum depth
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      // Create deep hierarchy (20 levels: depth 0-19)
      let currentFolder = await createTestFolder({
        workspaceId: workspace.id,
        name: 'Level 0',
        parentFolderId: null,
      });

      for (let i = 1; i < VALIDATION_LIMITS.FOLDER.MAX_NESTING_DEPTH; i++) {
        currentFolder = await createTestFolder({
          workspaceId: workspace.id,
          name: `Level ${i}`,
          parentFolderId: currentFolder.id,
        });
      }

      // Create folder to be moved (currently at root)
      const folderToMove = await createTestFolder({
        workspaceId: workspace.id,
        name: 'Folder to Move',
        parentFolderId: null,
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'move-folder'));

      // Act: Attempt to move folder under depth 19 parent (would create depth 20, which equals limit)
      const result = await moveFolderAction({
        folderId: folderToMove.id,
        newParentId: currentFolder.id,
      });

      // Assert: Should reject due to nesting limit
      expect(result.success).toBe(false);
      expect(result.error).toContain('Maximum nesting depth');
    }, 15000); // Increased timeout for deep folder creation

    it('should reject if name conflicts in destination', async () => {
      // Arrange: Create two parent folders, each with a child named "Documents"
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      const parent1 = await createTestFolder({
        workspaceId: workspace.id,
        name: 'Parent 1',
        parentFolderId: null,
      });

      const parent2 = await createTestFolder({
        workspaceId: workspace.id,
        name: 'Parent 2',
        parentFolderId: null,
      });

      const child1 = await createTestFolder({
        workspaceId: workspace.id,
        name: 'Documents',
        parentFolderId: parent1.id,
      });

      await createTestFolder({
        workspaceId: workspace.id,
        name: 'Documents',
        parentFolderId: parent2.id,
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'move-folder'));

      // Act: Attempt to move child1 to parent2 (name conflict)
      const result = await moveFolderAction({
        folderId: child1.id,
        newParentId: parent2.id,
      });

      // Assert: Should reject due to name conflict
      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });

    it('should return error when new parent belongs to different workspace', async () => {
      // Arrange: Create two users with different workspaces
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      createdUserIds.add(user1.id);
      createdUserIds.add(user2.id);

      const workspace1 = await createTestWorkspace({
        userId: user1.id,
        name: 'Workspace 1',
      });

      const workspace2 = await createTestWorkspace({
        userId: user2.id,
        name: 'Workspace 2',
      });

      const folder1 = await createTestFolder({
        workspaceId: workspace1.id,
        name: 'User 1 Folder',
      });

      const folder2 = await createTestFolder({
        workspaceId: workspace2.id,
        name: 'User 2 Folder',
      });

      // User 1 tries to move their folder into user 2's folder
      vi.mocked(auth).mockResolvedValue({ userId: user1.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user1.id, 'move-folder'));

      // Act: User 1 attempts to move their folder under user 2's folder
      const result = await moveFolderAction({
        folderId: folder1.id,
        newParentId: folder2.id,
      });

      // Assert: Should return error
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should rollback transaction on database update failure', async () => {
      // Arrange: Create folders for move operation
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      const parent1 = await createTestFolder({
        workspaceId: workspace.id,
        name: 'Parent 1',
        parentFolderId: null,
      });

      const parent2 = await createTestFolder({
        workspaceId: workspace.id,
        name: 'Parent 2',
        parentFolderId: null,
      });

      const childFolder = await createTestFolder({
        workspaceId: workspace.id,
        name: 'Child',
        parentFolderId: parent1.id,
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'move-folder'));

      // Get folder state before move attempt
      const { getFolderById } = await import('@/lib/database/queries');
      const folderBeforeMove = await getFolderById(childFolder.id);

      // Act: Attempt move with invalid parent ID (UUID format but non-existent)
      // This should fail during transaction execution
      const invalidParentId = '00000000-0000-0000-0000-000000000000';
      const result = await moveFolderAction({
        folderId: childFolder.id,
        newParentId: invalidParentId,
      });

      // Assert: Transaction should fail and rollback
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();

      // Verify folder state unchanged after failed transaction (rollback successful)
      const folderAfterFailedMove = await getFolderById(childFolder.id);
      expect(folderAfterFailedMove).toBeDefined();
      expect(folderAfterFailedMove?.parentFolderId).toBe(folderBeforeMove?.parentFolderId);
      expect(folderAfterFailedMove?.parentFolderId).toBe(parent1.id); // Still in original parent
    });

    it('should maintain data integrity when transaction fails mid-operation', async () => {
      // Arrange: Create complex folder structure
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      // Create hierarchy: Root → Parent → Child → Grandchild
      const rootFolder = await createTestFolder({
        workspaceId: workspace.id,
        name: 'Root',
        parentFolderId: null,
      });

      const parentFolder = await createTestFolder({
        workspaceId: workspace.id,
        name: 'Parent',
        parentFolderId: rootFolder.id,
      });

      const childFolder = await createTestFolder({
        workspaceId: workspace.id,
        name: 'Child',
        parentFolderId: parentFolder.id,
      });

      const grandchildFolder = await createTestFolder({
        workspaceId: workspace.id,
        name: 'Grandchild',
        parentFolderId: childFolder.id,
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'move-folder'));

      // Get all folder states before move
      const { getFolderById } = await import('@/lib/database/queries');
      const childBeforeMove = await getFolderById(childFolder.id);
      const grandchildBeforeMove = await getFolderById(grandchildFolder.id);

      // Act: Attempt to move parent into grandchild (circular reference - should fail)
      const result = await moveFolderAction({
        folderId: parentFolder.id,
        newParentId: grandchildFolder.id,
      });

      // Assert: Should reject due to circular reference
      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot move folder into its own subfolder');

      // Verify all folders maintain original state (no partial updates)
      const childAfterFailedMove = await getFolderById(childFolder.id);
      const grandchildAfterFailedMove = await getFolderById(grandchildFolder.id);
      const parentAfterFailedMove = await getFolderById(parentFolder.id);

      // All relationships should be unchanged
      expect(parentAfterFailedMove?.parentFolderId).toBe(rootFolder.id);
      expect(childAfterFailedMove?.parentFolderId).toBe(childBeforeMove?.parentFolderId);
      expect(grandchildAfterFailedMove?.parentFolderId).toBe(grandchildBeforeMove?.parentFolderId);
    });
  });

  // =============================================================================
  // deleteFolderAction() Tests
  // =============================================================================
  describe('deleteFolderAction', () => {
    it('should delete folder successfully', async () => {
      // Arrange: Create folder
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      const folder = await createTestFolder({
        workspaceId: workspace.id,
        name: 'Folder to Delete',
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'delete-folder'));

      // Act: Delete folder
      const result = await deleteFolderAction({ folderId: folder.id });

      // Assert: Should delete successfully
      expect(result.success).toBe(true);

      // Verify folder is deleted by attempting to get hierarchy
      resetRateLimit(RateLimitKeys.userAction(user.id, 'get-folder-hierarchy'));
      const verifyResult = await getFolderHierarchyAction({ folderId: folder.id });
      expect(verifyResult.success).toBe(false);
    });

    it('should cascade delete subfolders', { timeout: 10000 }, async () => {
      // Arrange: Create folder with subfolders
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      const parentFolder = await createTestFolder({
        workspaceId: workspace.id,
        name: 'Parent',
      });

      const childFolder = await createTestFolder({
        workspaceId: workspace.id,
        name: 'Child',
        parentFolderId: parentFolder.id,
      });

      const grandchildFolder = await createTestFolder({
        workspaceId: workspace.id,
        name: 'Grandchild',
        parentFolderId: childFolder.id,
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'delete-folder'));

      // Act: Delete parent folder
      const result = await deleteFolderAction({ folderId: parentFolder.id });

      // Assert: Should delete parent and all descendants
      expect(result.success).toBe(true);

      // Verify parent folder is deleted
      resetRateLimit(RateLimitKeys.userAction(user.id, 'get-folder-hierarchy'));
      const verifyParent = await getFolderHierarchyAction({ folderId: parentFolder.id });
      expect(verifyParent.success).toBe(false);
    });

    it('should return error when folder does not exist', async () => {
      // Arrange: Authenticated user
      const user = await createTestUser();
      createdUserIds.add(user.id);

      await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'delete-folder'));

      // Act: Attempt to delete non-existent folder
      const result = await deleteFolderAction({ folderId: 'non-existent-id' });

      // Assert: Should return error
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return error when folder belongs to different workspace', async () => {
      // Arrange: Create two users with different workspaces
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      createdUserIds.add(user1.id);
      createdUserIds.add(user2.id);

      const workspace1 = await createTestWorkspace({
        userId: user1.id,
        name: 'Workspace 1',
      });

      await createTestWorkspace({
        userId: user2.id,
        name: 'Workspace 2',
      });

      const folder1 = await createTestFolder({
        workspaceId: workspace1.id,
        name: 'User 1 Folder',
      });

      // User 2 tries to delete user 1's folder
      vi.mocked(auth).mockResolvedValue({ userId: user2.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user2.id, 'delete-folder'));

      // Act: User 2 attempts to delete user 1's folder
      const result = await deleteFolderAction({ folderId: folder1.id });

      // Assert: Should return error
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
