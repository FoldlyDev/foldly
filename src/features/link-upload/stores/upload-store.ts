import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { UploadSession, UploadBatch, UploadFile } from '../types';

interface UploadStore {
  // Session state
  session: UploadSession | null;
  setSession: (session: UploadSession | null) => void;

  // Upload state
  currentBatch: UploadBatch | null;
  setCurrentBatch: (batch: UploadBatch | null) => void;
  
  // File management
  addFiles: (files: File[]) => void;
  removeFile: (fileId: string) => void;
  updateFileProgress: (fileId: string, progress: number) => void;
  updateFileStatus: (fileId: string, status: UploadFile['status'], error?: string) => void;
  
  // Batch management
  updateBatchStatus: (status: UploadBatch['status']) => void;
  updateBatchProgress: (processedSize: number) => void;
  
  // UI state
  isUploading: boolean;
  setIsUploading: (isUploading: boolean) => void;
  
  // Reset
  reset: () => void;
}

const initialState = {
  session: null,
  currentBatch: null,
  isUploading: false,
};

export const useUploadStore = create<UploadStore>()(
  devtools(
    immer((set) => ({
      ...initialState,

      setSession: (session) =>
        set((state) => {
          state.session = session;
        }),

      setCurrentBatch: (batch) =>
        set((state) => {
          state.currentBatch = batch;
        }),

      addFiles: (files) =>
        set((state) => {
          if (!state.currentBatch) {
            state.currentBatch = {
              id: crypto.randomUUID(),
              files: [],
              totalSize: 0,
              processedSize: 0,
              status: 'pending',
            };
          }

          const newFiles: UploadFile[] = files.map((file) => ({
            id: crypto.randomUUID(),
            file,
            progress: 0,
            status: 'pending',
          }));

          state.currentBatch.files.push(...newFiles);
          state.currentBatch.totalSize += files.reduce(
            (sum, file) => sum + file.size,
            0
          );
        }),

      removeFile: (fileId) =>
        set((state) => {
          if (!state.currentBatch) return;

          const fileIndex = state.currentBatch.files.findIndex(
            (f) => f.id === fileId
          );
          if (fileIndex === -1) return;

          const file = state.currentBatch.files[fileIndex];
          state.currentBatch.totalSize -= file.file.size;
          state.currentBatch.files.splice(fileIndex, 1);

          if (state.currentBatch.files.length === 0) {
            state.currentBatch = null;
          }
        }),

      updateFileProgress: (fileId, progress) =>
        set((state) => {
          if (!state.currentBatch) return;

          const file = state.currentBatch.files.find((f) => f.id === fileId);
          if (file) {
            file.progress = progress;
          }
        }),

      updateFileStatus: (fileId, status, error) =>
        set((state) => {
          if (!state.currentBatch) return;

          const file = state.currentBatch.files.find((f) => f.id === fileId);
          if (file) {
            file.status = status;
            if (error) {
              file.error = error;
            }
          }
        }),

      updateBatchStatus: (status) =>
        set((state) => {
          if (state.currentBatch) {
            state.currentBatch.status = status;
          }
        }),

      updateBatchProgress: (processedSize) =>
        set((state) => {
          if (state.currentBatch) {
            state.currentBatch.processedSize = processedSize;
          }
        }),

      setIsUploading: (isUploading) =>
        set((state) => {
          state.isUploading = isUploading;
        }),

      reset: () => set(initialState),
    })),
    {
      name: 'UploadStore',
    }
  )
);