import { describe, it, expect, vi, beforeEach } from 'vitest';
import { deleteFolderAction } from '../../lib/actions/folder-actions';

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'test-user-id' }),
}));

// Mock the folder service
vi.mock('@/lib/services/files/folder-service', () => ({
  FolderService: vi.fn().mockImplementation(() => ({
    deleteFolderWithStorage: vi.fn().mockResolvedValue({
      success: true,
      data: { filesDeleted: 5, storageDeleted: 4 },
    }),
  })),
}));

// Mock storage service
vi.mock('@/lib/services/files/storage-service', () => ({
  StorageService: vi.fn().mockImplementation(() => ({
    deleteFile: vi.fn().mockResolvedValue({ success: true }),
  })),
}));

// Mock supabase client
vi.mock('@/lib/config/supabase-server', () => ({
  createServerSupabaseClient: vi.fn().mockResolvedValue({}),
}));

// Mock storage tracking service
vi.mock('@/lib/services/storage/storage-tracking-service', () => ({
  getUserStorageDashboard: vi.fn().mockResolvedValue({
    usagePercentage: 30,
    remainingBytes: 7000000000,
  }),
}));

describe('Folder Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('deleteFolderAction', () => {
    it('should successfully delete a folder with nested files and storage cleanup', async () => {
      const result = await deleteFolderAction('test-folder-id');

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        filesDeleted: 5,
        storageDeleted: 4,
        storageInfo: {
          usagePercentage: 30,
          remainingBytes: 7000000000,
          shouldShowWarning: false,
        },
      });
    });

    it('should return error when user is not authenticated', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      vi.mocked(auth).mockResolvedValueOnce({ userId: null } as any);

      const result = await deleteFolderAction('test-folder-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized');
    });

    it('should handle folder service errors gracefully', async () => {
      const { FolderService } = await import('@/lib/services/files/folder-service');
      vi.mocked(FolderService).mockImplementationOnce(() => ({
        deleteFolderWithStorage: vi.fn().mockResolvedValue({
          success: false,
          error: 'Folder not found',
        }),
      } as any));

      const result = await deleteFolderAction('test-folder-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Folder not found');
    });

    it('should handle unexpected errors', async () => {
      const { FolderService } = await import('@/lib/services/files/folder-service');
      vi.mocked(FolderService).mockImplementationOnce(() => ({
        deleteFolderWithStorage: vi.fn().mockRejectedValue(new Error('Database error')),
      } as any));

      const result = await deleteFolderAction('test-folder-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });
});