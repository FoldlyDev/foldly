// =============================================================================
// FILE ACTIONS TESTS
// =============================================================================
// Tests for global file CRUD operations with ownership verification

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getWorkspaceFilesAction,
  getFilesByEmailAction,
  searchFilesAction,
  createFileRecordAction,
  updateFileMetadataAction,
  deleteFileAction,
  bulkDeleteFilesAction,
} from '../file.actions';
import {
  createTestUser,
  createTestWorkspace,
  createTestFolder,
  createTestFile,
  cleanupTestUser,
} from '@/test/db-test-utils';
import { resetRateLimit, RateLimitKeys } from '@/lib/middleware/rate-limit';

// Mock Clerk authentication
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(() => ({ has: vi.fn() })),
}));

// Mock storage client to prevent actual storage operations
vi.mock('@/lib/storage/client', () => ({
  deleteFile: vi.fn().mockResolvedValue(undefined),
}));

import { auth } from '@clerk/nextjs/server';
import { deleteFile } from '@/lib/storage/client';

describe('File Actions', () => {
  const createdUserIds = new Set<string>();

  beforeEach(() => {
    vi.clearAllMocks();
    createdUserIds.clear();
  });

  afterEach(async () => {
    const cleanupPromises = Array.from(createdUserIds).map(id => cleanupTestUser(id));
    await Promise.all(cleanupPromises);
    createdUserIds.clear();
  });

  // =============================================================================
  // getWorkspaceFilesAction() Tests
  // =============================================================================
  describe('getWorkspaceFilesAction', () => {
    it('should return empty array when user has no files', async () => {
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'list-workspace-files'));

      const result = await getWorkspaceFilesAction();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data?.length).toBe(0);
    });

    it('should return all files for authenticated user workspace', async () => {
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      const file1 = await createTestFile({
        workspaceId: workspace.id,
        filename: 'file1.pdf',
      });
      const file2 = await createTestFile({
        workspaceId: workspace.id,
        filename: 'file2.pdf',
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'list-workspace-files'));

      const result = await getWorkspaceFilesAction();

      expect(result.success).toBe(true);
      expect(result.data?.length).toBe(2);
      expect(result.data?.map(f => f.id)).toContain(file1.id);
      expect(result.data?.map(f => f.id)).toContain(file2.id);
    });

    it('should return error when user is not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as any);

      const result = await getWorkspaceFilesAction();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  // =============================================================================
  // getFilesByEmailAction() Tests
  // =============================================================================
  describe('getFilesByEmailAction', () => {
    it('should return files filtered by uploader email', async () => {
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      const file1 = await createTestFile({
        workspaceId: workspace.id,
        filename: 'file1.pdf',
        uploaderEmail: 'alice@example.com',
      });
      await createTestFile({
        workspaceId: workspace.id,
        filename: 'file2.pdf',
        uploaderEmail: 'bob@example.com',
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'get-files-by-email'));

      const result = await getFilesByEmailAction({ uploaderEmail: 'alice@example.com' });

      expect(result.success).toBe(true);
      expect(result.data?.length).toBe(1);
      expect(result.data?.[0].id).toBe(file1.id);
      expect(result.data?.[0].uploaderEmail).toBe('alice@example.com');
    });

    it('should return empty array when no files match email', async () => {
      const user = await createTestUser();
      createdUserIds.add(user.id);

      await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'get-files-by-email'));

      const result = await getFilesByEmailAction({ uploaderEmail: 'nonexistent@example.com' });

      expect(result.success).toBe(true);
      expect(result.data?.length).toBe(0);
    });
  });

  // =============================================================================
  // searchFilesAction() Tests
  // =============================================================================
  describe('searchFilesAction', () => {
    // NOTE: Full-text search tests removed - requires manual fts vector updates
    // Advanced search functionality deferred to Phase 3+ (per user requirements)

    it('should return empty array for no matches', async () => {
      const user = await createTestUser();
      createdUserIds.add(user.id);

      await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'search-files'));

      const result = await searchFilesAction({ query: 'nonexistent-file-xyz' });

      expect(result.success).toBe(true);
      expect(result.data?.length).toBe(0);
    });
  });

  // =============================================================================
  // createFileRecordAction() Tests
  // =============================================================================
  describe('createFileRecordAction', () => {
    it('should create file record successfully', async () => {
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'create-file'));

      const result = await createFileRecordAction({
        filename: 'document.pdf',
        fileSize: 2048000,
        mimeType: 'application/pdf',
        storagePath: `test/${workspace.id}/file123.pdf`,
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.filename).toBe('document.pdf');
      expect(result.data?.workspaceId).toBe(workspace.id);
    });

    it('should create file with folder assignment', async () => {
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      const folder = await createTestFolder({
        workspaceId: workspace.id,
        name: 'Documents',
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'create-file'));

      const result = await createFileRecordAction({
        filename: 'document.pdf',
        fileSize: 2048000,
        mimeType: 'application/pdf',
        storagePath: `test/${workspace.id}/file123.pdf`,
        parentFolderId: folder.id,
      });

      expect(result.success).toBe(true);
      expect(result.data?.parentFolderId).toBe(folder.id);
    });

    it('should return error when parent folder does not exist', async () => {
      const user = await createTestUser();
      createdUserIds.add(user.id);

      await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'create-file'));

      const result = await createFileRecordAction({
        filename: 'document.pdf',
        fileSize: 2048000,
        mimeType: 'application/pdf',
        storagePath: 'test/path/file.pdf',
        parentFolderId: 'non-existent-folder',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  // =============================================================================
  // updateFileMetadataAction() Tests
  // =============================================================================
  describe('updateFileMetadataAction', () => {
    it('should update file metadata successfully', async () => {
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      const file = await createTestFile({
        workspaceId: workspace.id,
        filename: 'original.pdf',
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'update-file'));

      const result = await updateFileMetadataAction({
        fileId: file.id,
        filename: 'updated.pdf',
      });

      expect(result.success).toBe(true);
      expect(result.data?.filename).toBe('updated.pdf');
    });

    it('should update uploader name', async () => {
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      const file = await createTestFile({
        workspaceId: workspace.id,
        filename: 'file.pdf',
        uploaderName: 'Original Name',
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'update-file'));

      const result = await updateFileMetadataAction({
        fileId: file.id,
        uploaderName: 'Updated Name',
      });

      expect(result.success).toBe(true);
      expect(result.data?.uploaderName).toBe('Updated Name');
    });

    it('should return error when file does not exist', async () => {
      const user = await createTestUser();
      createdUserIds.add(user.id);

      await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'update-file'));

      const result = await updateFileMetadataAction({
        fileId: 'non-existent-file',
        filename: 'new.pdf',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return error when file belongs to different workspace', async () => {
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
        filename: 'file.pdf',
      });

      vi.mocked(auth).mockResolvedValue({ userId: user2.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user2.id, 'update-file'));

      const result = await updateFileMetadataAction({
        fileId: file1.id,
        filename: 'hacked.pdf',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  // =============================================================================
  // deleteFileAction() Tests
  // =============================================================================
  describe('deleteFileAction', () => {
    it('should delete file successfully (storage first, then DB)', async () => {
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      const file = await createTestFile({
        workspaceId: workspace.id,
        filename: 'file-to-delete.pdf',
      });

      vi.mocked(deleteFile).mockResolvedValueOnce(undefined);
      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'delete-file'));

      const result = await deleteFileAction({ fileId: file.id });

      expect(result.success).toBe(true);
      expect(deleteFile).toHaveBeenCalledWith({
        gcsPath: file.storagePath,
        bucket: expect.any(String),
      });
    });

    it('should abort deletion if storage deletion fails', async () => {
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      const file = await createTestFile({
        workspaceId: workspace.id,
        filename: 'file.pdf',
      });

      vi.mocked(deleteFile).mockRejectedValueOnce(new Error('Storage error'));
      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'delete-file'));

      const result = await deleteFileAction({ fileId: file.id });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to delete file from storage');
    });

    it('should return error when file does not exist', async () => {
      const user = await createTestUser();
      createdUserIds.add(user.id);

      await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'delete-file'));

      const result = await deleteFileAction({ fileId: 'non-existent-file' });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return error when file belongs to different workspace', async () => {
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
        filename: 'file.pdf',
      });

      vi.mocked(auth).mockResolvedValue({ userId: user2.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user2.id, 'delete-file'));

      const result = await deleteFileAction({ fileId: file1.id });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  // =============================================================================
  // bulkDeleteFilesAction() Tests
  // =============================================================================
  describe('bulkDeleteFilesAction', () => {
    it('should delete multiple files successfully', async () => {
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      const file1 = await createTestFile({
        workspaceId: workspace.id,
        filename: 'file1.pdf',
      });
      const file2 = await createTestFile({
        workspaceId: workspace.id,
        filename: 'file2.pdf',
      });

      vi.mocked(deleteFile).mockResolvedValue(undefined);
      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'bulk-delete-files'));

      const result = await bulkDeleteFilesAction({ fileIds: [file1.id, file2.id] });

      expect(result.success).toBe(true);
      expect(deleteFile).toHaveBeenCalledTimes(2);
    });

    it('should handle partial success (some files fail)', async () => {
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      const file1 = await createTestFile({
        workspaceId: workspace.id,
        filename: 'file1.pdf',
      });
      const file2 = await createTestFile({
        workspaceId: workspace.id,
        filename: 'file2.pdf',
      });

      vi.mocked(deleteFile)
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('Storage error'));
      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'bulk-delete-files'));

      const result = await bulkDeleteFilesAction({ fileIds: [file1.id, file2.id] });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to delete 1 file(s)');
    });

    it('should reject when any file does not exist', async () => {
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      const file1 = await createTestFile({
        workspaceId: workspace.id,
        filename: 'file1.pdf',
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'bulk-delete-files'));

      const result = await bulkDeleteFilesAction({
        fileIds: [file1.id, 'non-existent-file'],
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject when any file belongs to different workspace', async () => {
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

      const file1 = await createTestFile({
        workspaceId: workspace1.id,
        filename: 'file1.pdf',
      });
      const file2 = await createTestFile({
        workspaceId: workspace2.id,
        filename: 'file2.pdf',
      });

      vi.mocked(auth).mockResolvedValue({ userId: user1.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user1.id, 'bulk-delete-files'));

      const result = await bulkDeleteFilesAction({
        fileIds: [file1.id, file2.id],
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject empty file IDs array', async () => {
      const user = await createTestUser();
      createdUserIds.add(user.id);

      await createTestWorkspace({
        userId: user.id,
        name: 'Test Workspace',
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, 'bulk-delete-files'));

      const result = await bulkDeleteFilesAction({ fileIds: [] });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
