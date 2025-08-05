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
import { CloudUpload, AlertCircle, Shield, Info } from 'lucide-react';
import { useUploadFiles } from '../../hooks/use-upload-files';
import { UploadProgress } from '../upload/upload-progress';
import { UploadValidation, UploadStorageWarning } from '../upload/upload-validation';
import { LinkUploadArea } from '../upload/link-upload-area';
import { UploadLimitsInfo } from '../upload/upload-limits-info';
import type { LinkWithOwner } from '../../types';

interface LinkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  linkData: LinkWithOwner;
  folderId?: string;
}

export function LinkUploadModal({
  isOpen,
  onClose,
  linkData,
  folderId,
}: LinkUploadModalProps) {
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
    formatFileSize,
    formatSize,
    totalFiles,
    stagedFiles,
    completedFiles,
    failedFiles,
    hasFilesToUpload,
    clearFiles,
    handleStageFiles,
  } = useUploadFiles({ linkData, folderId, onClose });

  const handleClose = useCallback(() => {
    if (isUploading) return;
    onClose();
  }, [isUploading, onClose]);

  // Clear files when modal closes
  useEffect(() => {
    if (!isOpen) {
      clearFiles();
    }
  }, [isOpen, clearFiles]);

  // Get brand color for theming
  const brandColor = linkData.brandEnabled && linkData.brandColor ? linkData.brandColor : '#3b82f6';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className='w-[calc(100vw-2rem)] max-w-[95vw] sm:max-w-lg lg:max-w-3xl h-[90vh] sm:h-[85vh] md:h-[80vh] max-h-[90vh] p-0 overflow-hidden flex flex-col'
        from='bottom'
        transition={{ type: 'spring', stiffness: 180, damping: 25 }}
      >
        {/* Accessibility Labels */}
        <DialogTitle className='sr-only'>Add Files to Link</DialogTitle>
        <DialogDescription className='sr-only'>
          Select files to preview before adding them to the staging area. You can review your files before staging them for upload.
        </DialogDescription>

        {/* Modal Header */}
        <div 
          className='relative border-b border-gray-200/50 shrink-0'
          style={{
            background: linkData.brandEnabled 
              ? `linear-gradient(135deg, ${brandColor}1a, ${brandColor}0d)`
              : 'linear-gradient(135deg, rgb(59 130 246 / 0.1), rgb(99 102 241 / 0.05))'
          }}
        >
          <div className='p-4 sm:p-6 lg:p-8'>
            <div className='flex items-center gap-3 sm:gap-4'>
              <div 
                className='p-2 sm:p-3 rounded-lg sm:rounded-xl shadow-lg'
                style={{
                  background: linkData.brandEnabled 
                    ? `linear-gradient(135deg, ${brandColor}, ${brandColor}dd)`
                    : 'linear-gradient(135deg, rgb(59 130 246), rgb(99 102 241))'
                }}
              >
                <CloudUpload className='w-5 h-5 sm:w-6 sm:h-6 text-white' />
              </div>
              <div className='min-w-0 flex-1'>
                <h1 className='text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate'>
                  Add Files to {linkData.title || 'Link Collection'}
                </h1>
                <p className='text-xs sm:text-sm text-gray-600 mt-0.5 hidden sm:block'>
                  Select files to preview before staging for this collection
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className='flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6'>
          {/* Upload Validation Warnings */}
          <AnimatePresence>
            {uploadValidation && !uploadValidation.valid && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                <UploadValidation
                  validation={uploadValidation}
                  formatSize={formatSize}
                  linkData={linkData}
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
            <LinkUploadArea
              onFileSelect={handleFileSelect}
              isDragging={isDragging}
              isUploading={isUploading}
              linkData={linkData}
              formatSize={formatSize}
              files={files}
              onRemoveFile={handleRemoveFile}
            />
          </div>

          {/* Upload Limits Info */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <UploadLimitsInfo linkData={linkData} />
          </motion.div>

          {/* Link Security Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-muted/30 border rounded-lg p-4"
          >
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-medium text-sm">Upload Security</h4>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• Files are encrypted during transfer and stored securely</p>
                  {linkData.requirePassword && <p>• Password protection is enabled for this link</p>}
                  {linkData.requireEmail && <p>• Email verification is required for uploads</p>}
                </div>
              </div>
            </div>
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
              onClick={hasFilesToUpload ? handleStageFiles : handleClose}
              className='w-full sm:w-auto min-w-0 sm:min-w-[140px] text-white transition-all duration-200 cursor-pointer'
              style={{
                background: linkData.brandEnabled && hasFilesToUpload
                  ? `linear-gradient(135deg, ${brandColor}, ${brandColor}dd)`
                  : undefined
              }}
            >
              {hasFilesToUpload ? (
                <>
                  <CloudUpload className='w-4 h-4' />
                  <span>
                    Add {stagedFiles} selected {stagedFiles === 1 ? 'file' : 'files'}
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
      </DialogContent>
    </Dialog>
  );
}