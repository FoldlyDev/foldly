'use client';

import { useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/core/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/marketing/animate-ui/radix/dialog';
import { CloudUpload, AlertCircle } from 'lucide-react';
import { useFileUpload } from '../../hooks/use-file-upload';
import { UploadProgress } from '../upload/upload-progress';
import { UploadValidation, StorageWarning } from '../upload/upload-validation';
import { StorageInfoDisplay } from '../storage/storage-info-display';
import { FileUploadArea } from '../upload/file-upload-area';
import { UploadLimitsInfo } from '../upload/upload-limits-info';
import { useAuth, Protect } from '@clerk/nextjs';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId?: string;
  folderId?: string;
}

export function UploadModal({
  isOpen,
  onClose,
  workspaceId,
  folderId,
}: UploadModalProps) {
  const {
    files,
    isDragging,
    isUploading,
    uploadValidation,
    handleFileSelect,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleRemoveFile,
    handleUpload,
    formatFileSize,
    formatSize,
    totalFiles,
    completedFiles,
    failedFiles,
    quotaStatus,
    storageInfo,
    clearFiles,
  } = useFileUpload({ workspaceId, folderId, onClose });

  const handleClose = useCallback(() => {
    if (isUploading) return;
    onClose();
  }, [isUploading, onClose]);

  // Clear files when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Reset files state when modal is closed
      // This prevents files from appearing when reopening
      clearFiles();
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
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Authentication Required
              </h3>
              <p className="text-sm text-gray-600 max-w-sm">
                Please sign in to upload files to your workspace.
              </p>
              <Button
                variant="outline"
                onClick={handleClose}
                className="mt-6"
              >
                Close
              </Button>
            </div>
          }
        >
          {/* Modal Header */}
          <div className='relative border-b border-gray-200/50 bg-gradient-to-r from-blue-50 to-indigo-50 shrink-0'>
            <div className='p-4 sm:p-6 lg:p-8'>
              <div className='flex items-center gap-3 sm:gap-4'>
                <div className='p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg'>
                  <CloudUpload className='w-5 h-5 sm:w-6 sm:h-6 text-white' />
                </div>
                <div className='min-w-0 flex-1'>
                  <h1 className='text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate'>
                    Add to Workspace
                  </h1>
                  <p className='text-xs sm:text-sm text-gray-600 mt-0.5 hidden sm:block'>
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
            {quotaStatus.status !== 'safe' && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                <StorageWarning
                  status={quotaStatus.status}
                  remainingSpace={storageInfo.remainingBytes}
                  formatSize={formatSize}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* File Upload Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <FileUploadArea
              onFileSelect={handleFileSelect}
              isDragging={isDragging}
              isUploading={isUploading}
              isExceeded={quotaStatus.status === 'exceeded'}
              storageInfo={storageInfo}
              formatSize={formatSize}
              files={files}
              onRemoveFile={handleRemoveFile}
            />
          </div>

          {/* Upload Limits Info - Always show for user reference */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <UploadLimitsInfo 
              plan={storageInfo.planKey as 'free' | 'pro' | 'business'} 
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
                  planKey={storageInfo.planKey}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Modal Footer */}
        <div className='mt-auto border-t border-gray-200/50 bg-gray-50/50 p-4 sm:p-6 lg:p-8 shrink-0'>
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
              onClick={handleUpload}
              disabled={
                files.length === 0 ||
                isUploading ||
                uploadValidation?.valid === false
              }
              className='w-full sm:w-auto min-w-0 sm:min-w-[140px] bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white transition-all duration-200 cursor-pointer disabled:cursor-not-allowed'
            >
                  {isUploading ? (
                    <>
                      <div className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' />
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
                        Start Upload{files.length > 1 ? `ing ${files.length} files` : ''}
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
