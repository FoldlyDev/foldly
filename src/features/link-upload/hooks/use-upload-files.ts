'use client';

import { useState, useCallback, useMemo } from 'react';
import { useShallow } from 'zustand/shallow';
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
  // Local state for preview files (before staging)
  const [previewFiles, setPreviewFiles] = useState<FileWithProgress[]>([]);
  
  // Use staging store for actual staging - with useShallow to prevent infinite loops
  const {
    addFiles,
    removeFile,
    hasStagedItems,
    getStagedItemCount,
    uploaderName,
    uploaderEmail,
    uploaderMessage,
  } = useStagingStore(
    useShallow((state) => ({
      addFiles: state.addFiles,
      removeFile: state.removeFile,
      hasStagedItems: state.hasStagedItems,
      getStagedItemCount: state.getStagedItemCount,
      uploaderName: state.uploaderName,
      uploaderEmail: state.uploaderEmail,
      uploaderMessage: state.uploaderMessage,
    }))
  );
  
  // Use preview files for display in modal
  const files: FileWithProgress[] = previewFiles;

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

  // Handle file selection - add to preview, not directly to staging
  const handleFileSelect = useCallback((selectedFiles: FileList | File[]) => {
    const fileArray = Array.from(selectedFiles);
    // Add files to preview state
    const newFiles: FileWithProgress[] = fileArray.map(file => ({
      file,
      id: `preview-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      progress: 0,
      status: 'staged' as const,
      error: undefined,
    }));
    setPreviewFiles(prev => [...prev, ...newFiles]);
  }, []);

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

  // Remove file from preview
  const handleRemoveFile = useCallback((fileId: string) => {
    setPreviewFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);

  // Clear preview files
  const clearFiles = useCallback(() => {
    setPreviewFiles([]);
  }, []);

  // Stage files handler - move from preview to staging store
  const handleStageFiles = useCallback(() => {
    if (previewFiles.length > 0) {
      const filesToStage = previewFiles.map(f => f.file);
      addFiles(filesToStage, folderId);
      clearFiles();
      onClose();
    }
  }, [previewFiles, addFiles, folderId, clearFiles, onClose]);

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
    handleStageFiles,
    // New staging-specific properties
    hasStagedItems: hasStagedItems(),
    totalStagedItems: getStagedItemCount(),
  };
}