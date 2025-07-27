// FileUploadModal - File Upload Modal Component
// Following 2025 React patterns with Zustand store integration
// Eliminates prop drilling through composite hooks

'use client';

import { memo, useCallback, useRef } from 'react';
import { Upload, X, FileText, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/core/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/core/shadcn/dialog';
import { Progress } from '@/components/ui/core/shadcn/progress';
import { Badge } from '@/components/ui/core/shadcn/badge';
import {
  useFilesModalsStore,
  useFilesUploadStore,
} from '../../hooks/use-files-composite';
import { useFilesDataStore } from '../../store';
import { MODAL_TYPE } from '../../store/files-modal-store';

// =============================================================================
// COMPONENT IMPLEMENTATION
// =============================================================================

const FileUploadModal = memo(() => {
  // Store-based state - eliminates prop drilling
  const { activeModal, isModalOpen, closeModal, modalData } =
    useFilesModalsStore();

  const { uploadState, clearUploadData, updateUploadFormData } =
    useFilesUploadStore();

  const uploadFile = useFilesDataStore(state => state.uploadFile);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Show modal only if upload modal is active
  const isOpen = isModalOpen && activeModal === MODAL_TYPE.UPLOAD;

  // Event handlers
  const handleClose = useCallback(() => {
    closeModal();
    clearUploadData();
  }, [closeModal, clearUploadData]);

  const handleFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        // Update form data
        updateUploadFormData({
          files,
          folderId: modalData?.currentFolderId || null,
        });

        // Start upload
        await uploadFile({
          files,
          folderId: modalData?.currentFolderId || null,
        });

        // Close modal on success
        if (uploadState.isCompleted && !uploadState.hasErrors) {
          handleClose();
        }
      }
    },
    [modalData, updateUploadFormData, uploadFile, uploadState, handleClose]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        // Update form data
        updateUploadFormData({
          files,
          folderId: modalData?.currentFolderId || null,
        });

        // Start upload
        await uploadFile({
          files,
          folderId: modalData?.currentFolderId || null,
        });

        // Close modal on success
        if (uploadState.isCompleted && !uploadState.hasErrors) {
          handleClose();
        }
      }
    },
    [modalData, updateUploadFormData, uploadFile, uploadState, handleClose]
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Upload className='w-5 h-5' />
            Upload Files
          </DialogTitle>
          <DialogDescription>
            Upload files to your workspace. You can drag and drop or click to
            select files.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Drop zone */}
          <div
            className={cn(
              'border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer transition-colors',
              'hover:border-blue-400 hover:bg-blue-50'
            )}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={handleFileSelect}
          >
            <Upload className='w-12 h-12 mx-auto text-gray-400 mb-4' />
            <p className='text-lg font-medium text-gray-700 mb-2'>
              Drop files here or click to browse
            </p>
            <p className='text-sm text-gray-500'>
              Supports all file types up to 100MB each
            </p>
          </div>

          {/* File input */}
          <input
            ref={fileInputRef}
            type='file'
            multiple
            className='hidden'
            onChange={handleFileChange}
          />

          {/* Upload progress */}
          {uploadState.isUploading && (
            <div className='space-y-2'>
              <div className='flex justify-between text-sm'>
                <span>Uploading {uploadState.totalFiles} files...</span>
                <span>{uploadState.totalProgress}%</span>
              </div>
              <Progress value={uploadState.totalProgress} className='h-2' />

              {/* Upload status */}
              <div className='flex gap-2 text-xs'>
                <Badge variant='secondary'>
                  {uploadState.completedFiles} completed
                </Badge>
                {uploadState.failedFiles > 0 && (
                  <Badge variant='destructive'>
                    {uploadState.failedFiles} failed
                  </Badge>
                )}
                {uploadState.pendingFiles > 0 && (
                  <Badge variant='outline'>
                    {uploadState.pendingFiles} pending
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Upload completed message */}
          {uploadState.isCompleted && (
            <div className='text-center p-4 bg-green-50 rounded-lg'>
              <p className='text-green-800 font-medium'>
                Upload completed successfully!
              </p>
              {uploadState.failedFiles > 0 && (
                <p className='text-red-600 text-sm mt-1'>
                  {uploadState.failedFiles} files failed to upload
                </p>
              )}
            </div>
          )}

          {/* Error message */}
          {uploadState.hasErrors && (
            <div className='text-center p-4 bg-red-50 rounded-lg'>
              <p className='text-red-800 font-medium'>
                Upload failed. Please try again.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className='flex justify-end gap-2'>
            <Button variant='outline' onClick={handleClose}>
              {uploadState.isUploading ? 'Cancel' : 'Close'}
            </Button>
            {!uploadState.isUploading && (
              <Button onClick={handleFileSelect}>
                {uploadState.isCompleted ? 'Upload More' : 'Select Files'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});

FileUploadModal.displayName = 'FileUploadModal';

export default FileUploadModal;
