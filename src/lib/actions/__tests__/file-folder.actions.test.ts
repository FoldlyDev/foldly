// =============================================================================
// FILE-FOLDER ACTIONS TESTS
// =============================================================================
// Tests for mixed file and folder operations (bulk download, move, delete)

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  bulkDownloadMixedAction,
  moveMixedAction,
  deleteMixedAction,
} from '../file-folder.actions';
import {
  createTestUser,
  createTestWorkspace,
  createTestFolder,
  createTestFile,
  cleanupTestUser,
} from '@/test/db-test-utils';
import { resetRateLimit, RateLimitKeys } from '@/lib/middleware/rate-limit';
import { VALIDATION_LIMITS } from '@/lib/constants/validation';

// Mock Clerk authentication
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(() => ({ has: vi.fn() })),
}));

import { auth } from '@clerk/nextjs/server';

// Mock storage client
vi.mock('@/lib/storage/client', () => ({
  getSignedUrl: vi.fn(async ({ gcsPath }) => `https://signed-url.com/${gcsPath}`),
  deleteFile: vi.fn(async () => undefined),
}));

import { getSignedUrl, deleteFile as deleteFileFromStorage } from '@/lib/storage/client';

// Mock download helpers
vi.mock('@/lib/utils/download-helpers', () => ({
  createZipFromFiles: vi.fn(async () => Buffer.from('fake-zip-content')),
}));

import { createZipFromFiles } from '@/lib/utils/download-helpers';

describe('File-Folder Actions', () => {
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
  // bulkDownloadMixedAction() Tests
  // =============================================================================
  describe('bulkDownloadMixedAction', () => {
    it('should successfully download mixed files and folders as ZIP', async () => {
      // Arrange: Create test data
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      const folder = await createTestFolder({
        workspaceId: workspace.id,
        name: 'Test Folder',
      });

      const file1 = await createTestFile({
        workspaceId: workspace.id,
        filename: 'file1.txt',
        parentFolderId: null, // Root level
      });

      const file2 = await createTestFile({
        workspaceId: workspace.id,
        filename: 'file2.txt',
        parentFolderId: folder.id, // Inside folder
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'bulk-download-mixed'));

      // Act: Download mixed files and folders
      const result = await bulkDownloadMixedAction({
        fileIds: [file1.id],
        folderIds: [folder.id],
      });

      // Assert: Should create ZIP successfully
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(getSignedUrl).toHaveBeenCalled();
      expect(createZipFromFiles).toHaveBeenCalled();
    });

    it('should return error when files not found', async () => {
      // Arrange: Authenticated user
      const user = await createTestUser();
      createdUserIds.add(user.id);

      await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'bulk-download-mixed'));

      // Act: Attempt to download non-existent files
      const result = await bulkDownloadMixedAction({
        fileIds: ['non-existent-file-id'],
        folderIds: [],
      });

      // Assert: Should return error
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return error when folder not found', async () => {
      // Arrange: Authenticated user
      const user = await createTestUser();
      createdUserIds.add(user.id);

      await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'bulk-download-mixed'));

      // Act: Attempt to download non-existent folder
      const result = await bulkDownloadMixedAction({
        fileIds: [],
        folderIds: ['non-existent-folder-id'],
      });

      // Assert: Should return error
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return error when file belongs to different workspace', async () => {
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

      const file1 = await createTestFile({
        workspaceId: workspace1.id,
        filename: 'file1.txt',
      });

      // User 2 tries to download user 1's file
      vi.mocked(auth).mockResolvedValue({ userId: user2.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user2.id, 'bulk-download-mixed'));

      // Act: User 2 attempts to download user 1's file
      const result = await bulkDownloadMixedAction({
        fileIds: [file1.id],
        folderIds: [],
      });

      // Assert: Should return error
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  // =============================================================================
  // moveMixedAction() Tests
  // =============================================================================
  describe('moveMixedAction', () => {
    it('should successfully move files and folders to target folder', async () => {
      // Arrange: Create test data
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      const targetFolder = await createTestFolder({
        workspaceId: workspace.id,
        name: 'Target Folder',
      });

      const file = await createTestFile({
        workspaceId: workspace.id,
        filename: 'file1.txt',
        parentFolderId: null, // Root level
      });

      const folder = await createTestFolder({
        workspaceId: workspace.id,
        name: 'Folder to Move',
        parentFolderId: null, // Root level
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'move-mixed'));

      // Act: Move file and folder to target
      const result = await moveMixedAction({
        fileIds: [file.id],
        folderIds: [folder.id],
        targetFolderId: targetFolder.id,
      });

      // Assert: Should move successfully
      expect(result.success).toBe(true);
      expect(result.data?.movedFileCount).toBe(1);
      expect(result.data?.movedFolderCount).toBe(1);
    });

    it('should return error when folder moved into itself', async () => {
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
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'move-mixed'));

      // Act: Attempt to move folder into itself
      const result = await moveMixedAction({
        fileIds: [],
        folderIds: [folder.id],
        targetFolderId: folder.id, // Same as source!
      });

      // Assert: Should return error
      expect(result.success).toBe(false);
      expect(result.error).toContain('subfolder');
    });

    it('should return error when folder moved into descendant', async () => {
      // Arrange: Create parent and child folders
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

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'move-mixed'));

      // Act: Attempt to move parent into child (circular reference)
      const result = await moveMixedAction({
        fileIds: [],
        folderIds: [parentFolder.id],
        targetFolderId: childFolder.id,
      });

      // Assert: Should return error
      expect(result.success).toBe(false);
      expect(result.error).toContain('subfolder');
    });

    it('should return error when file with same name exists in destination', async () => {
      // Arrange: Create files with same name in different locations
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      const targetFolder = await createTestFolder({
        workspaceId: workspace.id,
        name: 'Target Folder',
      });

      // File at root level
      const file1 = await createTestFile({
        workspaceId: workspace.id,
        filename: 'duplicate.txt',
        parentFolderId: null,
      });

      // File with same name already in target folder
      await createTestFile({
        workspaceId: workspace.id,
        filename: 'duplicate.txt',
        parentFolderId: targetFolder.id,
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'move-mixed'));

      // Act: Attempt to move file to folder with same filename
      const result = await moveMixedAction({
        fileIds: [file1.id],
        folderIds: [],
        targetFolderId: targetFolder.id,
      });

      // Assert: Should return error
      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });

    it('should skip files already in target location (idempotent)', async () => {
      // Arrange: Create file already in target folder
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      const targetFolder = await createTestFolder({
        workspaceId: workspace.id,
        name: 'Target Folder',
      });

      const file = await createTestFile({
        workspaceId: workspace.id,
        filename: 'file.txt',
        parentFolderId: targetFolder.id, // Already in target!
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'move-mixed'));

      // Act: Move file to same location
      const result = await moveMixedAction({
        fileIds: [file.id],
        folderIds: [],
        targetFolderId: targetFolder.id,
      });

      // Assert: Should succeed with 0 moved (idempotent no-op)
      expect(result.success).toBe(true);
      expect(result.data?.movedFileCount).toBe(0);
    });

    it('should return error when nesting depth limit would be exceeded', { timeout: 15000 }, async () => {
      // Arrange: Create deeply nested folder structure
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      // Create folder hierarchy at exactly max depth - 1
      // So moving a folder INTO the deepest folder would exceed max depth
      // If MAX_NESTING_DEPTH = 20, we need folders at depth 0-19
      let currentFolder = await createTestFolder({
        workspaceId: workspace.id,
        name: 'Level 0', // Depth 0
      });

      // Create nested folders up to depth MAX_NESTING_DEPTH - 1
      // Loop creates folders 1 through 19 (if max is 20)
      for (let i = 1; i < VALIDATION_LIMITS.FOLDER.MAX_NESTING_DEPTH; i++) {
        currentFolder = await createTestFolder({
          workspaceId: workspace.id,
          name: `Level ${i}`,
          parentFolderId: currentFolder.id,
        });
      }
      // currentFolder is now at depth 19 (MAX_NESTING_DEPTH - 1)
      // Moving a folder into it would make newDepth = 20, triggering validation

      // Create folder to move (at root)
      const folderToMove = await createTestFolder({
        workspaceId: workspace.id,
        name: 'Folder to Move',
        parentFolderId: null,
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'move-mixed'));

      // Act: Attempt to move folder into deeply nested location
      const result = await moveMixedAction({
        fileIds: [],
        folderIds: [folderToMove.id],
        targetFolderId: currentFolder.id, // Would exceed max depth
      });

      // Assert: Should return error
      expect(result.success).toBe(false);
      expect(result.error).toContain('nesting depth');
    });
  });

  // =============================================================================
  // deleteMixedAction() Tests
  // =============================================================================
  describe('deleteMixedAction', () => {
    it('should successfully delete files and folders', async () => {
      // Arrange: Create test data
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      const file = await createTestFile({
        workspaceId: workspace.id,
        filename: 'file.txt',
      });

      const folder = await createTestFolder({
        workspaceId: workspace.id,
        name: 'Folder',
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'delete-mixed'));

      // Mock storage deletion success
      vi.mocked(deleteFileFromStorage).mockResolvedValue(undefined);

      // Act: Delete file and folder
      const result = await deleteMixedAction({
        fileIds: [file.id],
        folderIds: [folder.id],
      });

      // Assert: Should delete successfully
      expect(result.success).toBe(true);
      expect(result.data?.deletedFileCount).toBe(1);
      expect(result.data?.deletedFolderCount).toBe(1);
      expect(deleteFileFromStorage).toHaveBeenCalledWith({
        gcsPath: file.storagePath,
        bucket: expect.any(String),
      });
    });

    it('should handle partial success when some storage deletions fail', async () => {
      // Arrange: Create multiple files
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      const file1 = await createTestFile({
        workspaceId: workspace.id,
        filename: 'file1.txt',
      });

      const file2 = await createTestFile({
        workspaceId: workspace.id,
        filename: 'file2.txt',
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'delete-mixed'));

      // Mock storage deletion: first succeeds, second fails
      vi.mocked(deleteFileFromStorage)
        .mockResolvedValueOnce(undefined) // file1 succeeds
        .mockRejectedValueOnce(new Error('Storage deletion failed')); // file2 fails

      // Act: Delete files
      const result = await deleteMixedAction({
        fileIds: [file1.id, file2.id],
        folderIds: [],
      });

      // Assert: Should succeed with partial deletion
      expect(result.success).toBe(true);
      expect(result.data?.deletedFileCount).toBe(1); // Only 1 succeeded
    });

    it('should return error when all storage deletions fail', async () => {
      // Arrange: Create file
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      const file = await createTestFile({
        workspaceId: workspace.id,
        filename: 'file.txt',
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'delete-mixed'));

      // Mock storage deletion failure
      vi.mocked(deleteFileFromStorage).mockRejectedValue(new Error('Storage deletion failed'));

      // Act: Attempt to delete file
      const result = await deleteMixedAction({
        fileIds: [file.id],
        folderIds: [],
      });

      // Assert: Should return error
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return error when files not found', async () => {
      // Arrange: Authenticated user
      const user = await createTestUser();
      createdUserIds.add(user.id);

      await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'delete-mixed'));

      // Act: Attempt to delete non-existent files
      const result = await deleteMixedAction({
        fileIds: ['non-existent-file-id'],
        folderIds: [],
      });

      // Assert: Should return error
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should verify storage-first deletion pattern for files', async () => {
      // Arrange: Create file
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      const file = await createTestFile({
        workspaceId: workspace.id,
        filename: 'file.txt',
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'delete-mixed'));

      // Mock storage deletion success
      vi.mocked(deleteFileFromStorage).mockResolvedValue(undefined);

      // Act: Delete file
      await deleteMixedAction({
        fileIds: [file.id],
        folderIds: [],
      });

      // Assert: Storage deletion should be called BEFORE database deletion
      expect(deleteFileFromStorage).toHaveBeenCalledTimes(1);
      expect(deleteFileFromStorage).toHaveBeenCalledWith({
        gcsPath: file.storagePath,
        bucket: expect.any(String),
      });
    });
  });
});
