'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/core/shadcn/button';
import { Input } from '@/components/ui/core/shadcn/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/core/shadcn/dialog';
import { Progress } from '@/components/ui/core/shadcn/progress';
import { Upload, File, X, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import { uploadFileAction } from '../../lib/actions';
import { useQueryClient } from '@tanstack/react-query';
import { workspaceQueryKeys } from '../../lib/query-keys';
import { toast } from 'sonner';
import type { DatabaseId } from '@/lib/database/types';
import { 
  useStorageTracking, 
  usePreUploadValidation,
  useInvalidateStorage,
  useStorageQuotaStatus 
} from '../../hooks';
import { StorageInfoDisplay, StorageWarningBanner } from '../storage/storage-info-display';
import { 
  showStorageWarning,
  showStorageCritical,
  checkAndShowStorageThresholds
} from '@/features/notifications/internal/workspace-notifications';
import { type StorageNotificationData } from '@/features/notifications/internal/types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId?: string;
  folderId?: string;
}

interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export function UploadModal({
  isOpen,
  onClose,
  workspaceId,
  folderId,
}: UploadModalProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadValidation, setUploadValidation] = useState<{
    valid: boolean;
    reason?: string;
    totalSize: number;
    exceedsLimit: boolean;
  } | null>(null);
  
  const queryClient = useQueryClient();
  const { storageInfo, formatSize } = useStorageTracking();
  const preUploadValidation = usePreUploadValidation();
  const invalidateStorage = useInvalidateStorage();
  const quotaStatus = useStorageQuotaStatus();

  const handleFileSelect = useCallback(async (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    // Validate storage before adding files
    const validation = await preUploadValidation(selectedFiles);
    setUploadValidation(validation);

    if (!validation.valid && validation.exceedsLimit) {
      toast.error('Storage limit exceeded', {
        description: validation.reason,
      });
      return;
    }

    const newFiles: UploadFile[] = Array.from(selectedFiles).map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      progress: 0,
      status: 'pending',
    }));

    setFiles(prev => [...prev, ...newFiles]);

    // Show warning if approaching limit
    if (validation.valid && quotaStatus.status !== 'safe') {
      toast.warning('Storage getting full', {
        description: `${formatSize(validation.totalSize)} will be added. ${formatSize(storageInfo.remainingBytes - validation.totalSize)} remaining.`,
      });
    }
  }, [preUploadValidation, quotaStatus.status, formatSize, storageInfo.remainingBytes]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  const handleRemoveFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);

  const uploadSingleFile = useCallback(
    async (uploadFile: UploadFile) => {
      if (!workspaceId) {
        throw new Error('Workspace ID is required');
      }

      setFiles(prev =>
        prev.map(f =>
          f.id === uploadFile.id
            ? { ...f, status: 'uploading' as const, progress: 0 }
            : f
        )
      );

      try {
        // Simulate progress updates
        for (let progress = 0; progress < 90; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          setFiles(prev =>
            prev.map(f => (f.id === uploadFile.id ? { ...f, progress } : f))
          );
        }

        // Perform actual upload
        const result = await uploadFileAction(
          uploadFile.file,
          workspaceId,
          folderId
        );

        if (!result.success) {
          throw new Error(result.error || 'Upload failed');
        }

        // Handle storage notifications based on upload result
        if (result.storageInfo && result.storageInfo.shouldShowWarning) {
          const storageData: StorageNotificationData = {
            currentUsage: (storageInfo.storageLimitBytes * result.storageInfo.usagePercentage) / 100,
            totalLimit: storageInfo.storageLimitBytes,
            remainingSpace: result.storageInfo.remainingBytes,
            usagePercentage: result.storageInfo.usagePercentage,
            planKey: storageInfo.planKey,
            filesCount: storageInfo.filesCount + 1,
          };
          
          checkAndShowStorageThresholds(storageData, storageInfo.usagePercentage);
        }

        // Complete the progress
        setFiles(prev =>
          prev.map(f =>
            f.id === uploadFile.id
              ? { ...f, progress: 100, status: 'success' as const }
              : f
          )
        );

        return result.data;
      } catch (error) {
        setFiles(prev =>
          prev.map(f =>
            f.id === uploadFile.id
              ? {
                  ...f,
                  status: 'error' as const,
                  error:
                    error instanceof Error ? error.message : 'Upload failed',
                }
              : f
          )
        );
        throw error;
      }
    },
    [workspaceId, folderId]
  );

  const handleUpload = useCallback(async () => {
    if (files.length === 0 || !workspaceId) return;

    setIsUploading(true);

    try {
      // Upload files sequentially to avoid overwhelming the server
      const results = [];
      for (const file of files) {
        if (file.status === 'pending') {
          const result = await uploadSingleFile(file);
          results.push(result);
        }
      }

      // Invalidate queries to refresh the UI
      queryClient.invalidateQueries({
        queryKey: workspaceQueryKeys.tree(),
      });
      
      // Invalidate storage data to reflect changes
      invalidateStorage();

      const successCount = results.length;
      const failedCount = files.filter(f => f.status === 'error').length;

      if (successCount > 0) {
        toast.success(`Successfully uploaded ${successCount} file(s)`);
      }
      if (failedCount > 0) {
        toast.error(`Failed to upload ${failedCount} file(s)`);
      }
      
      // Show final storage status if approaching limits
      const finalResult = results[results.length - 1];
      if (finalResult && finalResult.storageInfo && finalResult.storageInfo.usagePercentage >= 90) {
        const storageData: StorageNotificationData = {
          currentUsage: (storageInfo.storageLimitBytes * finalResult.storageInfo.usagePercentage) / 100,
          totalLimit: storageInfo.storageLimitBytes,
          remainingSpace: finalResult.storageInfo.remainingBytes,
          usagePercentage: finalResult.storageInfo.usagePercentage,
          planKey: storageInfo.planKey,
          filesCount: storageInfo.filesCount + successCount,
        };
        
        if (finalResult.storageInfo.usagePercentage >= 95) {
          showStorageCritical(storageData);
        } else {
          showStorageWarning(storageData);
        }
      }

      // Clear files after upload attempt
      setTimeout(() => {
        setFiles([]);
        onClose();
      }, 1000);
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [files, workspaceId, uploadSingleFile, queryClient, onClose]);

  const handleClose = useCallback(() => {
    if (isUploading) return;
    setFiles([]);
    setUploadValidation(null);
    onClose();
  }, [isUploading, onClose]);

  // Re-validate when files change
  useEffect(() => {
    if (files.length > 0) {
      const fileList = files.map(f => f.file);
      preUploadValidation(fileList).then(setUploadValidation);
    } else {
      setUploadValidation(null);
    }
  }, [files, preUploadValidation]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const totalFiles = files.length;
  const completedFiles = files.filter(f => f.status === 'success').length;
  const failedFiles = files.filter(f => f.status === 'error').length;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle>Upload Files</DialogTitle>
          <DialogDescription>
            Upload files to your workspace. You can drag and drop or click to
            select files.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Storage Warning Banner */}
          <StorageWarningBanner />

          {/* Storage Information */}
          <div className='bg-[var(--neutral-50)] rounded-lg p-3'>
            <StorageInfoDisplay compact={true} />
          </div>

          {/* Upload Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-[var(--primary)] bg-[var(--primary-subtle)]'
                : 'border-[var(--neutral-300)] hover:border-[var(--neutral-400)]'
            }`}
          >
            <input
              type='file'
              multiple
              onChange={e => handleFileSelect(e.target.files)}
              className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
              disabled={isUploading || quotaStatus.status === 'exceeded'}
            />

            <div className='space-y-2'>
              <Upload className='w-8 h-8 mx-auto text-[var(--neutral-500)]' />
              <p className='text-sm text-[var(--neutral-600)]'>
                <span className='font-medium'>Click to upload</span> or drag and
                drop
              </p>
              <p className='text-xs text-[var(--neutral-500)]'>
                {quotaStatus.status === 'exceeded' 
                  ? 'Storage limit exceeded - please free up space'
                  : storageInfo.remainingBytes > 0
                  ? `${formatSize(storageInfo.remainingBytes)} remaining`
                  : 'Any file type supported'
                }
              </p>
            </div>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className='max-h-60 overflow-y-auto space-y-2'>
              {files.map(file => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className='flex items-center gap-3 p-3 border rounded-lg'
                >
                  <File className='w-4 h-4 text-[var(--neutral-500)]' />

                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-medium truncate'>
                      {file.file.name}
                    </p>
                    <p className='text-xs text-[var(--neutral-500)]'>
                      {formatFileSize(file.file.size)}
                    </p>

                    {file.status === 'uploading' && (
                      <Progress value={file.progress} className='mt-1' />
                    )}
                  </div>

                  <div className='flex items-center gap-2'>
                    {file.status === 'success' && (
                      <CheckCircle className='w-4 h-4 text-green-500' />
                    )}
                    {file.status === 'error' && (
                      <AlertCircle className='w-4 h-4 text-red-500' />
                    )}
                    {file.status === 'pending' && !isUploading && (
                      <button
                        onClick={() => handleRemoveFile(file.id)}
                        className='p-1 hover:bg-[var(--neutral-100)] rounded'
                      >
                        <X className='w-3 h-3' />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Upload Validation Warning */}
          {uploadValidation && !uploadValidation.valid && (
            <div className='bg-red-50 border border-red-200 rounded-lg p-3'>
              <div className='flex items-center gap-2 text-red-700'>
                <AlertTriangle className='w-4 h-4 flex-shrink-0' />
                <div>
                  <p className='text-sm font-medium'>Upload not allowed</p>
                  <p className='text-xs mt-1'>{uploadValidation.reason}</p>
                  {uploadValidation.totalSize > 0 && (
                    <p className='text-xs mt-1'>
                      Selected files: {formatSize(uploadValidation.totalSize)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Upload Size Summary */}
          {uploadValidation && uploadValidation.valid && uploadValidation.totalSize > 0 && (
            <div className='bg-blue-50 border border-blue-200 rounded-lg p-3'>
              <div className='flex items-center justify-between text-blue-700'>
                <span className='text-sm'>Ready to upload</span>
                <span className='text-sm font-medium'>{formatSize(uploadValidation.totalSize)}</span>
              </div>
            </div>
          )}

          {/* Progress Summary */}
          {isUploading && (
            <div className='bg-[var(--neutral-50)] rounded-lg p-3'>
              <div className='flex items-center justify-between text-sm'>
                <span>Uploading files...</span>
                <span>
                  {completedFiles}/{totalFiles}
                </span>
              </div>
              <Progress
                value={(completedFiles / totalFiles) * 100}
                className='mt-2'
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className='flex justify-end gap-2 pt-4'>
          <Button
            variant='outline'
            onClick={handleClose}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={
              files.length === 0 || 
              isUploading || 
              (uploadValidation && !uploadValidation.valid)
            }
          >
            {isUploading 
              ? 'Uploading...' 
              : uploadValidation && !uploadValidation.valid
              ? 'Cannot Upload'
              : `Upload ${files.length} file(s)`
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
