'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/animate-ui/radix/dialog';
import { CloudUpload, AlertCircle } from 'lucide-react';
import { useFileUpload } from '../../hooks/use-file-upload';
import { emitNotification } from '@/features/notifications/core/event-bus';
import { NotificationEventType, NotificationPriority } from '@/features/notifications/core/event-types';
import { clientUploadService } from '@/lib/services/upload/client-upload-service';
import { UploadProgress } from '../upload/upload-progress';
import { UploadValidation, StorageWarning } from '../upload/upload-validation';
import { StorageInfoDisplay } from '../storage/storage-info-display';
// Removed FileUploadArea - using CentralizedFileUpload instead
import { CentralizedFileUpload } from '@/components/composite/centralized-file-upload';
import { UploadLimitsInfo } from '../upload/upload-limits-info';
import { Protect } from '@clerk/nextjs';
import { useInvalidateStorage } from '../../hooks';
import { UPLOAD_CONFIG } from '../../lib/config/upload-config';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId?: string;
  folderId?: string;
  onFileUploaded?: (file: any) => void;
  initialFiles?: File[]; // Pre-selected files from drag-and-drop
}

export function UploadModal({
  isOpen,
  onClose,
  workspaceId,
  folderId,
  onFileUploaded,
  initialFiles,
}: UploadModalProps) {
  const invalidateStorage = useInvalidateStorage();
  const {
    files,
    isDragging,
    isUploading,
    uploadValidation,
    handleFileSelect,
    handleRemoveFile,
    handleUpload,
    formatSize,
    totalFiles,
    completedFiles,
    failedFiles,
    quotaStatus,
    storageInfo,
    clearFiles,
  } = useFileUpload({ workspaceId, folderId, onClose, onFileUploaded });
  
  // Track if initial files have been processed
  const [initialFilesProcessed, setInitialFilesProcessed] = useState(false);

  const handleClose = useCallback(() => {
    if (isUploading) {
      // Show background upload notification when closing during upload
      const uploadingFiles = files.filter(f => f.status === 'uploading');
      const pendingFiles = files.filter(f => f.status === 'pending');
      const totalActive = uploadingFiles.length + pendingFiles.length;
      
      if (totalActive > 0) {
        emitNotification(
          NotificationEventType.WORKSPACE_BATCH_UPLOAD_PROGRESS,
          {
            totalItems: totalFiles,
            completedItems: completedFiles,
            failedItems: failedFiles,
            batchId: `background-batch-${Date.now()}`
          },
          {
            priority: NotificationPriority.MEDIUM,
            persistent: true,
            deduplicationKey: 'background-upload-batch',
            actions: [
              {
                id: 'view',
                label: 'View Progress',
                style: 'primary' as const,
                handler: () => {
                  // Note: To reopen the modal, you'd need to pass a callback prop
                  // For now, we'll just log
                  console.log('TODO: Implement modal reopen');
                }
              },
              {
                id: 'cancel-all',
                label: 'Cancel All',
                style: 'danger' as const,
                handler: () => {
                  // Cancel all uploads
                  clientUploadService.cancelAll();
                  // Clear the files
                  clearFiles();
                  // Show cancellation notification
                  emitNotification(
                    NotificationEventType.WORKSPACE_BATCH_UPLOAD_ERROR,
                    {
                      totalItems: totalFiles,
                      completedItems: completedFiles,
                      failedItems: totalFiles - completedFiles,
                      batchId: `background-batch-${Date.now()}`
                    },
                    {
                      priority: NotificationPriority.HIGH,
                      duration: 3000
                    }
                  );
                }
              }
            ]
          }
        );
      }
    }
    onClose();
  }, [isUploading, files, totalFiles, completedFiles, failedFiles, clearFiles, onClose]);

  // Refetch storage data when modal opens and handle initial files
  useEffect(() => {
    if (isOpen) {
      // Refresh storage data to ensure we have the latest info
      invalidateStorage();
    }
  }, [isOpen, invalidateStorage]);

  // Handle initial files separately to prevent re-adding
  useEffect(() => {
    if (isOpen && initialFiles && initialFiles.length > 0 && !initialFilesProcessed) {
      console.log('📥 [UPLOAD-MODAL] Processing initial files from tree drop:', {
        fileCount: initialFiles.length,
        fileNames: initialFiles.map(f => f.name),
        fileTypes: initialFiles.map(f => f.type)
      });
      // Only add initial files once when they are first provided
      handleFileSelect(initialFiles);
      setInitialFilesProcessed(true);
    }
  }, [isOpen, initialFiles, initialFilesProcessed, handleFileSelect]);

  // Clear files when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Reset files state when modal is closed
      // This prevents files from appearing when reopening
      clearFiles();
      // Reset the processed flag for next time
      setInitialFilesProcessed(false);
    }
  }, [isOpen, clearFiles]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className='w-[calc(100vw-2rem)] max-w-[95vw] sm:max-w-lg lg:max-w-3xl h-[90vh] sm:h-[85vh] md:h-[80vh] max-h-[90vh] p-0 overflow-hidden flex flex-col'
        from='bottom'
        transition={{ type: 'spring', stiffness: 180, damping: 25 }}
      >
        {/* Accessibility Labels */}
        <DialogTitle className='sr-only'>Upload Files to Workspace</DialogTitle>
        <DialogDescription className='sr-only'>
          Upload files to your workspace. Drag and drop or click to select
          files.
        </DialogDescription>

        {/* Protect component wrapper - ensures user has valid authentication */}
        <Protect
          fallback={
            <div className='flex flex-col items-center justify-center h-full p-8 text-center'>
              <AlertCircle className='w-12 h-12 text-muted-foreground mb-4' />
              <h3 className='text-lg font-semibold text-foreground mb-2'>
                Authentication Required
              </h3>
              <p className='text-sm text-muted-foreground max-w-sm'>
                Please sign in to upload files to your workspace.
              </p>
              <Button variant='outline' onClick={handleClose} className='mt-6'>
                Close
              </Button>
            </div>
          }
        >
          {/* Modal Header */}
          <div className='modal-header relative shrink-0'>
            <div className='p-4 sm:p-6 lg:p-8'>
              <div className='flex items-center gap-3 sm:gap-4'>
                <div className='p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg'>
                  <CloudUpload className='w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground' />
                </div>
                <div className='min-w-0 flex-1'>
                  <h1 className='text-lg sm:text-xl lg:text-2xl font-bold text-foreground truncate'>
                    Add to Workspace
                  </h1>
                  <p className='text-xs sm:text-sm text-muted-foreground mt-0.5 hidden sm:block'>
                    Fast, secure uploads with automatic organization
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className='flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6'>
            {/* Storage Warning - Animated Alert */}
            <AnimatePresence>
              {quotaStatus.warningLevel !== 'normal' && storageInfo && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                  <StorageWarning
                    status={quotaStatus.warningLevel}
                    remainingSpace={storageInfo.availableSpace}
                    formatSize={formatSize}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Centralized File Upload Area with Folder Support */}
            <CentralizedFileUpload
              onChange={handleFileSelect}
              onRemove={(index) => {
                const fileId = files[index]?.id;
                if (fileId) {
                  handleRemoveFile(fileId);
                }
              }}
              files={files.map(f => f.file)}
              skipFolderExtraction={false} // Always allow folder extraction to ensure proper preview generation
              multiple={true}
              maxFiles={UPLOAD_CONFIG.batch.maxFilesPerUpload || 50}
              maxFileSize={storageInfo ? UPLOAD_CONFIG.fileSizeLimits[storageInfo.plan as 'free' | 'pro' | 'business']?.maxFileSize || 100 * 1024 * 1024 : 100 * 1024 * 1024}
              disabled={isUploading || quotaStatus.isFull}
              uploadText="Upload files"
              uploadDescription={
                isDragging 
                  ? "Release to start uploading" 
                  : "Drag and drop files or folders here, or click to browse"
              }
              showFileSize={true}
              showFileType={true}
              showModifiedDate={false}
              onError={(error) => {
                console.error('Upload error:', error);
              }}
            />

            {/* Upload Limits Info - Always show for user reference */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <UploadLimitsInfo
                plan={storageInfo ? storageInfo.plan as 'free' | 'pro' | 'business' : 'free'}
              />
            </motion.div>

            {/* Storage Info Display - Always show for user awareness */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <StorageInfoDisplay
                showHeader={true}
                compact={false}
                showLiveUpdates={isUploading}
              />
            </motion.div>

            {/* Upload Progress - Only show for batch summary */}
            <AnimatePresence>
              {isUploading && totalFiles > 3 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <UploadProgress
                    isUploading={isUploading}
                    totalFiles={totalFiles}
                    completedFiles={completedFiles}
                    failedFiles={failedFiles}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Upload Validation - Shows Error States with Details */}
            <AnimatePresence>
              {uploadValidation && !uploadValidation.valid && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <UploadValidation
                    validation={uploadValidation}
                    formatSize={formatSize}
                    planKey={storageInfo ? storageInfo.plan : 'free'}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Modal Footer */}
          <div className='modal-footer mt-auto p-4 sm:p-6 lg:p-8 shrink-0'>
            <div className='flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3'>
              {/* Action Buttons */}
              <Button
                variant='outline'
                onClick={handleClose}
                disabled={isUploading}
                className='w-full sm:w-auto min-w-0 sm:min-w-[100px] border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200'
              >
                Cancel
              </Button>
              <Button
                variant='outline'
                onClick={handleUpload}
                disabled={
                  files.length === 0 ||
                  isUploading ||
                  uploadValidation?.valid === false
                }
                className='w-full sm:w-auto min-w-0 sm:min-w-[140px] border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200'
              >
                {isUploading ? (
                  <>
                    <div className='w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin' />
                    <span>Uploading...</span>
                  </>
                ) : uploadValidation?.valid === false ? (
                  <>
                    <AlertCircle className='w-4 h-4' />
                    <span>Cannot Upload</span>
                  </>
                ) : files.length > 0 ? (
                  <>
                    <CloudUpload className='w-4 h-4' />
                    <span>
                      Start Upload
                      {files.length > 1 ? `ing ${files.length} files` : ''}
                    </span>
                  </>
                ) : (
                  <>
                    <CloudUpload className='w-4 h-4' />
                    <span>Select Files</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </Protect>
      </DialogContent>
    </Dialog>
  );
}
