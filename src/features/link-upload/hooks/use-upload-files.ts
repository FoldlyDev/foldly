'use client';

import { useState, useCallback, useMemo } from 'react';
import { useStagingStore } from '../stores/staging-store';
import type { LinkWithOwner } from '../types';

interface UseUploadFilesProps {
  linkData: LinkWithOwner;
  folderId?: string;
  onClose: () => void;
}

interface FileWithProgress {
  file: File;
  id: string;
  progress: number;
  status: 'staged' | 'uploading' | 'completed' | 'failed';
  error?: string;
}

interface UploadValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function useUploadFiles({ linkData, folderId, onClose }: UseUploadFilesProps) {
  const [isDragging, setIsDragging] = useState(false);
  
  // Use staging store instead of local state
  const {
    stagedFiles,
    addFiles,
    removeFile,
    hasStagedItems,
    getStagedItemCount,
    getStagedFilesInFolder,
    uploaderName,
    uploaderEmail,
    uploaderMessage,
  } = useStagingStore();
  
  // Convert staged files to legacy format for compatibility
  const files: FileWithProgress[] = useMemo(() => {
    const currentFolderFiles = getStagedFilesInFolder(folderId);
    return currentFolderFiles.map(stagedFile => ({
      file: stagedFile.file,
      id: stagedFile.id,
      progress: stagedFile.progress,
      status: stagedFile.status,
      error: stagedFile.error,
    }));
  }, [stagedFiles, folderId, getStagedFilesInFolder]);

  // Get uploader session data from staging store or localStorage fallback
  const getUploaderSession = useCallback(() => {
    // First try staging store
    if (uploaderName !== 'Anonymous' || uploaderEmail || uploaderMessage) {
      return {
        uploaderName,
        uploaderEmail,
        uploaderMessage,
      };
    }
    
    // Fallback to localStorage
    try {
      const sessionData = localStorage.getItem(`upload-session-${linkData.id}`);
      if (sessionData) {
        return JSON.parse(sessionData);
      }
    } catch (error) {
      console.warn('Failed to parse upload session:', error);
    }
    return {
      uploaderName: 'Anonymous',
      uploaderEmail: undefined,
      uploaderMessage: undefined,
    };
  }, [linkData.id, uploaderName, uploaderEmail, uploaderMessage]);

  // File format validation
  const validateFiles = useCallback((filesToValidate: File[]): UploadValidation => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check file count limits
    if (filesToValidate.length > linkData.maxFiles) {
      errors.push(`Maximum ${linkData.maxFiles} files allowed per upload session`);
    }

    // Check individual file sizes
    const maxFileSize = Math.min(linkData.maxFileSize, linkData.subscription.maxFileSize);
    const oversizedFiles = filesToValidate.filter(file => file.size > maxFileSize);
    if (oversizedFiles.length > 0) {
      errors.push(`${oversizedFiles.length} file(s) exceed the maximum size of ${formatSize(maxFileSize)}`);
    }

    // Check file types if restricted
    if (linkData.allowedFileTypes && linkData.allowedFileTypes.length > 0) {
      const allowedTypes = linkData.allowedFileTypes as string[];
      const invalidFiles = filesToValidate.filter(file => {
        const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
        const mimeType = file.type.toLowerCase();
        
        return !allowedTypes.some(allowedType => 
          allowedType.toLowerCase().includes(fileExtension) ||
          mimeType.includes(allowedType.toLowerCase())
        );
      });
      
      if (invalidFiles.length > 0) {
        errors.push(`${invalidFiles.length} file(s) have unsupported file types`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }, [linkData.maxFiles, linkData.maxFileSize, linkData.subscription.maxFileSize, linkData.allowedFileTypes]);

  // Memoized validation for current files
  const uploadValidation = useMemo(() => {
    if (files.length === 0) return null;
    return validateFiles(files.map(f => f.file));
  }, [files, validateFiles]);

  // No longer need upload mutations - staging only

  // Handle file selection - stage files instead of auto-uploading
  const handleFileSelect = useCallback((selectedFiles: FileList | File[]) => {
    const fileArray = Array.from(selectedFiles);
    // Add files to staging store
    addFiles(fileArray, folderId);
  }, [addFiles, folderId]);

  // Handle drag events
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, [handleFileSelect]);

  // Remove file from staging
  const handleRemoveFile = useCallback((fileId: string) => {
    removeFile(fileId);
  }, [removeFile]);

  // Clear files - not needed in staging mode (handled by store)
  const clearFiles = useCallback(() => {
    // Files are managed by staging store
  }, []);

  // Upload handler removed - now handled by toolbar

  // Utility functions
  const formatFileSize = useCallback((bytes: number): string => {
    return formatSize(bytes);
  }, []);

  const formatSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  // Calculate progress stats from staging store
  const totalFiles = files.length;
  const stagedFilesCount = files.filter(f => f.status === 'staged').length;
  const completedFiles = files.filter(f => f.status === 'completed').length;
  const failedFiles = files.filter(f => f.status === 'failed').length;
  const isUploading = files.some(f => f.status === 'uploading');
  const hasFilesToUpload = stagedFilesCount > 0;

  return {
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
    stagedFiles: stagedFilesCount,
    completedFiles,
    failedFiles,
    hasFilesToUpload,
    clearFiles,
    // New staging-specific properties
    hasStagedItems: hasStagedItems(),
    totalStagedItems: getStagedItemCount(),
  };
}