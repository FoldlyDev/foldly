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
import { CloudUpload, FolderPlus, FileText, X } from 'lucide-react';
import { CentralizedFileUpload } from '@/components/composite/centralized-file-upload';
import { useLinkUploadStagingStore } from '../../stores/staging-store';
import { formatBytes } from '@/lib/utils';
import type { LinkWithStats } from '@/lib/database/types/links';

interface LinkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  linkData: LinkWithStats;
  targetFolderId: string | null;
  treeInstance: any;
  onFileUploaded?: (file: any) => void; // Callback when file is added
  initialFiles?: File[]; // Pre-selected files from drag-and-drop
}

export function LinkUploadModal({
  isOpen,
  onClose,
  linkData,
  targetFolderId,
  treeInstance,
  onFileUploaded,
  initialFiles,
}: LinkUploadModalProps) {
  const {
    addStagedFiles,
    getStagedFileCount,
    getTotalStagedSize,
    getNextSortOrder,
  } = useLinkUploadStagingStore();
  
  // Local state for files being selected
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [initialFilesProcessed, setInitialFilesProcessed] = useState(false);

  // Handle file selection
  const handleFileSelect = useCallback((files: File[]) => {
    // Add preview URLs to image files (following workspace pattern)
    const filesWithPreviews = files.map(file => {
      if (file.type.startsWith('image/')) {
        const preview = URL.createObjectURL(file);
        // Add preview property to the file object itself
        Object.assign(file, { preview });
      }
      return file;
    });
    
    setSelectedFiles(prev => [...prev, ...filesWithPreviews]);
  }, []);

  // Remove file from selection
  const handleRemoveFile = useCallback((index: number) => {
    setSelectedFiles(prev => {
      const fileToRemove = prev[index];
      // Clean up preview URL if it exists
      if (fileToRemove && 'preview' in fileToRemove && (fileToRemove as any).preview) {
        URL.revokeObjectURL((fileToRemove as any).preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  // Handle initial files from drag-drop
  useEffect(() => {
    if (isOpen && initialFiles && initialFiles.length > 0 && !initialFilesProcessed) {
      // Only add initial files once when they are first provided
      handleFileSelect(initialFiles);
      setInitialFilesProcessed(true);
    }
  }, [isOpen, initialFiles, initialFilesProcessed, handleFileSelect]);

  // Clear state when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Reset the processed flag for next time
      setInitialFilesProcessed(false);
      // Clean up all preview URLs before clearing
      selectedFiles.forEach(file => {
        if ('preview' in file && (file as any).preview) {
          URL.revokeObjectURL((file as any).preview);
        }
      });
      // Clear selected files
      setSelectedFiles([]);
    }
  }, [isOpen]);

  // Add files to staging and update tree optimistically
  const handleAddToStaging = useCallback(() => {
    if (selectedFiles.length === 0) return;
    
    // Get files state before adding
    const filesBefore = useLinkUploadStagingStore.getState().stagedFiles;
    
    // Add files to staging store
    const actualTargetId = targetFolderId || linkData.id;
    addStagedFiles(selectedFiles, actualTargetId);
    
    // Get newly added files and add them to tree immediately for optimistic update
    if (onFileUploaded) {
      const filesAfter = useLinkUploadStagingStore.getState().stagedFiles;
      filesAfter.forEach((file, fileId) => {
        if (!filesBefore.has(fileId)) {
          onFileUploaded(file);
        }
      });
    }
    
    // Clear selection and close modal
    setSelectedFiles([]);
    onClose();
  }, [selectedFiles, targetFolderId, linkData.id, addStagedFiles, onFileUploaded, onClose]);

  // Clear selection when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedFiles([]);
    }
  }, [isOpen]);

  // Get current staging stats
  const stagingStats = {
    fileCount: getStagedFileCount(),
    totalSize: getTotalStagedSize(),
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className='w-[calc(100vw-2rem)] max-w-[95vw] sm:max-w-lg lg:max-w-3xl h-[90vh] sm:h-[85vh] md:h-[80vh] max-h-[90vh] p-0 overflow-hidden flex flex-col'
        from='bottom'
        transition={{ type: 'spring', stiffness: 180, damping: 25 }}
      >
        {/* Accessibility Labels */}
        <DialogTitle className='sr-only'>Add Files to Upload</DialogTitle>
        <DialogDescription className='sr-only'>
          Select files to add to your upload session. You can organize them before sending.
        </DialogDescription>

        {/* Modal Header */}
        <div className='modal-header relative shrink-0 border-b'>
          <div className='p-4 sm:p-6'>
            <div className='flex items-center gap-3 sm:gap-4'>
              <div className='p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg'>
                <CloudUpload className='w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground' />
              </div>
              <div className='min-w-0 flex-1'>
                <h1 className='text-lg sm:text-xl lg:text-2xl font-bold text-foreground truncate'>
                  Add Files
                </h1>
                <p className='text-xs sm:text-sm text-muted-foreground mt-0.5'>
                  Select files to stage for upload
                </p>
              </div>
              <Button
                variant='ghost'
                size='icon'
                onClick={onClose}
                className='rounded-full'
              >
                <X className='h-4 w-4' />
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className='flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6'>
          {/* Current Staging Info */}
          {stagingStats.fileCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className='bg-primary/5 rounded-lg p-4 border border-primary/20'
            >
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <FileText className='h-4 w-4 text-primary' />
                  <span className='text-sm font-medium'>
                    Currently Staged: {stagingStats.fileCount} files
                  </span>
                </div>
                <span className='text-sm text-muted-foreground'>
                  {formatBytes(stagingStats.totalSize)}
                </span>
              </div>
            </motion.div>
          )}

          {/* File Upload Area */}
          <CentralizedFileUpload
            onChange={handleFileSelect}
            onRemove={handleRemoveFile}
            files={selectedFiles}
            skipFolderExtraction={false}
            multiple={true}
            maxFiles={50}
            maxFileSize={100 * 1024 * 1024} // 100MB default
            disabled={false}
            uploadText='Select files to add'
            uploadDescription={
              isDragging
                ? 'Release to add files'
                : 'Drag and drop files or folders here, or click to browse'
            }
            showFileSize={true}
            showFileType={true}
            showModifiedDate={false}
            onError={error => {
              console.error('File selection error:', error);
            }}
          />

          {/* Instructions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className='bg-muted/50 rounded-lg p-4'
          >
            <h3 className='text-sm font-medium mb-2'>How it works:</h3>
            <ul className='space-y-1 text-sm text-muted-foreground'>
              <li className='flex items-start gap-2'>
                <span className='text-primary mt-0.5'>•</span>
                <span>Files are staged locally until you send them</span>
              </li>
              <li className='flex items-start gap-2'>
                <span className='text-primary mt-0.5'>•</span>
                <span>You can organize files into folders before sending</span>
              </li>
              <li className='flex items-start gap-2'>
                <span className='text-primary mt-0.5'>•</span>
                <span>Click "Send Files" when ready to upload everything</span>
              </li>
            </ul>
          </motion.div>

          {/* Target Folder Info */}
          {targetFolderId && targetFolderId !== linkData.id && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className='flex items-center gap-2 text-sm text-muted-foreground'
            >
              <FolderPlus className='h-4 w-4' />
              <span>Files will be added to the selected folder</span>
            </motion.div>
          )}
        </div>

        {/* Modal Footer */}
        <div className='modal-footer mt-auto p-4 sm:p-6 border-t shrink-0'>
          <div className='flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3'>
            <Button
              variant='outline'
              onClick={onClose}
              className='w-full sm:w-auto min-w-0 sm:min-w-[100px]'
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddToStaging}
              disabled={selectedFiles.length === 0}
              className='w-full sm:w-auto min-w-0 sm:min-w-[140px]'
            >
              {selectedFiles.length === 0 ? (
                'Select Files'
              ) : (
                <>
                  <CloudUpload className='w-4 h-4 mr-2' />
                  Add {selectedFiles.length} {selectedFiles.length === 1 ? 'File' : 'Files'}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}