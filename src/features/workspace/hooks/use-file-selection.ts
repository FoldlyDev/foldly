'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { UploadFile } from '../components/upload/file-upload-area';
import { UPLOAD_CONFIG } from '../lib/config/upload-config';

interface UseFileSelectionProps {
  onFilesSelected?: (files: File[]) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
}

/**
 * Hook for handling file selection and drag-drop functionality
 * Manages file input, drag-drop events, and file validation
 */
export function useFileSelection({
  onFilesSelected,
  maxFiles = UPLOAD_CONFIG.maxFilesPerUpload,
  acceptedTypes = [],
}: UseFileSelectionProps = {}) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const dragCounterRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Validate file type against accepted types
   */
  const isValidFileType = useCallback(
    (file: File): boolean => {
      if (acceptedTypes.length === 0) return true;
      
      return acceptedTypes.some(type => {
        if (type.endsWith('/*')) {
          // Handle wildcard MIME types like image/*
          const baseType = type.slice(0, -2);
          return file.type.startsWith(baseType);
        }
        // Handle exact MIME types or extensions
        return file.type === type || file.name.endsWith(type);
      });
    },
    [acceptedTypes]
  );

  /**
   * Process and validate selected files
   */
  const processFiles = useCallback(
    (fileList: FileList | File[]): File[] => {
      const files = Array.from(fileList);
      
      // Filter valid files
      const validFiles = files.filter(file => {
        if (!isValidFileType(file)) {
          console.warn(`File ${file.name} has invalid type: ${file.type}`);
          return false;
        }
        
        if (file.size === 0) {
          console.warn(`File ${file.name} is empty`);
          return false;
        }
        
        return true;
      });

      // Limit number of files
      const limitedFiles = validFiles.slice(0, maxFiles);
      
      if (validFiles.length > maxFiles) {
        console.warn(
          `Selected ${validFiles.length} files, but only ${maxFiles} are allowed`
        );
      }

      return limitedFiles;
    },
    [isValidFileType, maxFiles]
  );

  /**
   * Handle file selection from input or drag-drop
   */
  const handleFileSelect = useCallback(
    (fileList: FileList | File[] | null) => {
      if (!fileList || fileList.length === 0) return;

      const processedFiles = processFiles(fileList);
      
      if (processedFiles.length > 0) {
        setSelectedFiles(processedFiles);
        onFilesSelected?.(processedFiles);
      }
    },
    [processFiles, onFilesSelected]
  );

  /**
   * Clear selected files
   */
  const clearFiles = useCallback(() => {
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  /**
   * Remove a specific file from selection
   */
  const removeFile = useCallback((index: number) => {
    setSelectedFiles(prev => {
      const newFiles = prev.filter((_, i) => i !== index);
      return newFiles;
    });
  }, []);

  /**
   * Trigger file input dialog
   */
  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    dragCounterRef.current++;
    
    if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    dragCounterRef.current--;
    
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      setIsDragging(false);
      dragCounterRef.current = 0;
      
      const { files } = e.dataTransfer;
      if (files && files.length > 0) {
        handleFileSelect(files);
      }
    },
    [handleFileSelect]
  );

  // Reset drag counter on unmount
  useEffect(() => {
    return () => {
      dragCounterRef.current = 0;
    };
  }, []);

  return {
    // State
    selectedFiles,
    isDragging,
    fileInputRef,
    
    // Actions
    handleFileSelect,
    clearFiles,
    removeFile,
    openFileDialog,
    
    // Drag handlers
    dragHandlers: {
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDragOver: handleDragOver,
      onDrop: handleDrop,
    },
  };
}