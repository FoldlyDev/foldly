// =============================================================================
// LIVE STORAGE HOOK - Real-time Storage Tracking During Uploads
// =============================================================================
// 🎯 Provides real-time storage tracking during file uploads with optimistic updates

'use client';

import { create } from 'zustand';
import { useCallback } from 'react';
import * as React from 'react';

// =============================================================================
// TYPES
// =============================================================================

export interface FileUploadInfo {
  totalBytes: number;
  uploadedBytes: number;
  progress: number;
  startTime: number; // Track when upload started for cleanup
}

export interface LiveStorageState {
  // Base storage usage (from server)
  baseUsage: number;

  // Bytes currently being uploaded (in progress)
  uploadingBytes: number;

  // Bytes successfully uploaded (completed)
  completedBytes: number;

  // Whether uploads are currently in progress
  isUploading: boolean;

  // File-specific upload progress
  fileProgress: Map<string, FileUploadInfo>;

  // Track if reset is in progress to prevent race conditions
  isResetting: boolean;
}

export interface LiveStorageActions {
  // Start tracking a new file upload
  startFileUpload: (fileId: string, totalBytes: number) => void;

  // Update progress for a specific file
  updateFileProgress: (fileId: string, uploadedBytes: number) => void;

  // Mark a file as completed
  completeFileUpload: (fileId: string) => void;

  // Mark a file as failed (rollback bytes)
  failFileUpload: (fileId: string) => void;

  // Reset all live tracking (after all uploads complete)
  resetLiveTracking: () => void;

  // Update base usage from server
  updateBaseUsage: (bytes: number) => void;

  // Clean up abandoned uploads (older than timeout)
  cleanupAbandonedUploads: (timeoutMs?: number) => void;
}

// =============================================================================
// STORE
// =============================================================================

// Default timeout for abandoned uploads (5 minutes)
const ABANDONED_UPLOAD_TIMEOUT = 5 * 60 * 1000;

const useLiveStorageStore = create<LiveStorageState & LiveStorageActions>(
  (set, get) => ({
    // Initial state
    baseUsage: 0,
    uploadingBytes: 0,
    completedBytes: 0,
    isUploading: false,
    fileProgress: new Map(),
    isResetting: false,

    // Actions
    startFileUpload: (fileId, totalBytes) => {
      set(state => ({
        fileProgress: new Map(state.fileProgress).set(fileId, {
          totalBytes,
          uploadedBytes: 0,
          progress: 0,
          startTime: Date.now(),
        }),
        uploadingBytes: state.uploadingBytes + totalBytes,
        isUploading: true,
      }));
    },

    updateFileProgress: (fileId, uploadedBytes) => {
      set(state => {
        const fileInfo = state.fileProgress.get(fileId);
        if (!fileInfo) return state;

        const newProgress = new Map(state.fileProgress);
        newProgress.set(fileId, {
          ...fileInfo,
          uploadedBytes,
          progress: (uploadedBytes / fileInfo.totalBytes) * 100,
        });

        return {
          fileProgress: newProgress,
        };
      });
    },

    completeFileUpload: fileId => {
      set(state => {
        const fileInfo = state.fileProgress.get(fileId);
        if (!fileInfo) return state;

        const newProgress = new Map(state.fileProgress);
        newProgress.delete(fileId);

        const newUploadingBytes = state.uploadingBytes - fileInfo.totalBytes;
        const newCompletedBytes = state.completedBytes + fileInfo.totalBytes;

        return {
          fileProgress: newProgress,
          uploadingBytes: newUploadingBytes,
          completedBytes: newCompletedBytes,
          isUploading: newProgress.size > 0,
        };
      });
    },

    failFileUpload: fileId => {
      set(state => {
        const fileInfo = state.fileProgress.get(fileId);
        if (!fileInfo) return state;

        const newProgress = new Map(state.fileProgress);
        newProgress.delete(fileId);

        return {
          fileProgress: newProgress,
          uploadingBytes: state.uploadingBytes - fileInfo.totalBytes,
          isUploading: newProgress.size > 0,
        };
      });
    },

    resetLiveTracking: () => {
      // Prevent race conditions by checking if already resetting
      const state = get();
      if (state.isResetting) return;

      set({
        isResetting: true,
        uploadingBytes: 0,
        completedBytes: 0,
        isUploading: false,
        fileProgress: new Map(),
      });

      // Clear resetting flag after a short delay
      setTimeout(() => {
        set({ isResetting: false });
      }, 100);
    },

    updateBaseUsage: bytes => {
      set({ baseUsage: bytes });
    },

    cleanupAbandonedUploads: (timeoutMs = ABANDONED_UPLOAD_TIMEOUT) => {
      set(state => {
        const now = Date.now();
        const newProgress = new Map(state.fileProgress);
        let bytesToRemove = 0;

        // Find and remove abandoned uploads
        state.fileProgress.forEach((fileInfo, fileId) => {
          if (now - fileInfo.startTime > timeoutMs && fileInfo.progress < 100) {
            newProgress.delete(fileId);
            bytesToRemove += fileInfo.totalBytes;
          }
        });

        if (bytesToRemove === 0) return state;

        return {
          fileProgress: newProgress,
          uploadingBytes: Math.max(0, state.uploadingBytes - bytesToRemove),
          isUploading: newProgress.size > 0,
        };
      });
    },
  })
);

// =============================================================================
// MAIN HOOK
// =============================================================================

export interface LiveStorageData {
  // Current confirmed usage (base + completed)
  currentUsage: number;

  // Projected final usage (current + all uploading files)
  projectedUsage: number;

  // Real-time usage (current + weighted progress of uploading files)
  realtimeUsage: number;

  // Total bytes being uploaded
  uploadingBytes: number;

  // Upload progress percentage (0-100)
  uploadProgress: number;

  // Whether uploads are in progress
  isUploading: boolean;
}

/**
 * Hook for tracking live storage usage during uploads
 * Provides real-time calculations and progress tracking
 */
export function useLiveStorage(): LiveStorageData & LiveStorageActions {
  const state = useLiveStorageStore();

  // Calculate real-time usage based on upload progress
  const realtimeUploadedBytes = Array.from(state.fileProgress.values()).reduce(
    (total, file) => total + file.uploadedBytes,
    0
  );

  // Calculate overall upload progress
  const totalBytes = state.uploadingBytes + state.completedBytes;
  const uploadedBytes = state.completedBytes + realtimeUploadedBytes;
  const uploadProgress =
    totalBytes > 0 ? (uploadedBytes / totalBytes) * 100 : 0;

  // Calculate usage values
  const currentUsage = state.baseUsage + state.completedBytes;
  const projectedUsage = currentUsage + state.uploadingBytes;
  const realtimeUsage =
    state.baseUsage + state.completedBytes + realtimeUploadedBytes;

  // Set up periodic cleanup of abandoned uploads
  React.useEffect(() => {
    if (!state.isUploading) return;

    const cleanupInterval = setInterval(() => {
      state.cleanupAbandonedUploads();
    }, 60000); // Check every minute

    return () => clearInterval(cleanupInterval);
  }, [state.isUploading]);

  return {
    // Calculated values
    currentUsage,
    projectedUsage,
    realtimeUsage,
    uploadingBytes: state.uploadingBytes,
    uploadProgress,
    isUploading: state.isUploading,

    // Actions
    startFileUpload: state.startFileUpload,
    updateFileProgress: state.updateFileProgress,
    completeFileUpload: state.completeFileUpload,
    failFileUpload: state.failFileUpload,
    resetLiveTracking: state.resetLiveTracking,
    updateBaseUsage: state.updateBaseUsage,
    cleanupAbandonedUploads: state.cleanupAbandonedUploads,
  };
}

// =============================================================================
// UTILITY HOOKS
// =============================================================================

/**
 * Hook to get file-specific upload progress
 */
export function useFileUploadProgress(fileId: string) {
  const fileProgress = useLiveStorageStore(state =>
    state.fileProgress.get(fileId)
  );

  return {
    progress: fileProgress?.progress ?? 0,
    uploadedBytes: fileProgress?.uploadedBytes ?? 0,
    totalBytes: fileProgress?.totalBytes ?? 0,
    isUploading: !!fileProgress,
  };
}
