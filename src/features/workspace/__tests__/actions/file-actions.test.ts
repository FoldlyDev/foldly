import { describe, it, expect, vi, beforeEach } from 'vitest';
import { deleteFileAction } from '../../lib/actions/file-actions';

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'test-user-id' }),
}));

// Mock the file service
vi.mock('@/lib/services/file-system/file-service', () => ({
  FileService: vi.fn().mockImplementation(() => ({
    deleteFileWithStorage: vi.fn().mockResolvedValue({
      success: true,
      data: { deletedFromStorage: true },
    }),
  })),
}));

// Mock storage service
vi.mock('@/lib/services/storage/storage-operations-service', () => ({
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
    usagePercentage: 45,
    remainingBytes: 5000000000,
  }),
}));

describe('File Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('deleteFileAction', () => {
    it('should successfully delete a file with storage cleanup', async () => {
      const result = await deleteFileAction('test-file-id');

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ deletedFromStorage: true });
      expect(result.storageInfo).toEqual({
        usagePercentage: 45,
        remainingBytes: 5000000000,
        shouldShowWarning: false,
      });
    });

    it('should return error when user is not authenticated', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      vi.mocked(auth).mockResolvedValueOnce({ userId: null } as any);

      const result = await deleteFileAction('test-file-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized');
    });

    it('should handle file service errors gracefully', async () => {
      const { FileService } = await import('@/lib/services/file-system/file-service');
      vi.mocked(FileService).mockImplementationOnce(() => ({
        deleteFileWithStorage: vi.fn().mockResolvedValue({
          success: false,
          error: 'File not found',
        }),
      } as any));

      const result = await deleteFileAction('test-file-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('File not found');
    });

    it('should handle unexpected errors', async () => {
      const { FileService } = await import('@/lib/services/file-system/file-service');
      vi.mocked(FileService).mockImplementationOnce(() => ({
        deleteFileWithStorage: vi.fn().mockRejectedValue(new Error('Network error')),
      } as any));

      const result = await deleteFileAction('test-file-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });
});