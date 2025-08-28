'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ClientUploadService } from '@/lib/services/upload/client-upload-service';
import { workspaceQueryKeys } from '../lib/query-keys';
import { useFileSelection } from './use-file-selection';
import type { UploadFile } from '../components/upload/file-upload-area';

interface UseFileUploadProps {
  workspaceId?: string;
  folderId?: string;
  onClose?: () => void;
  onFileUploaded?: (file: any) => void;
}

/**
 * Simplified file upload hook
 * Files are selected first, then uploaded when user triggers upload
 */
export function useFileUpload({
  workspaceId,
  folderId,
  onClose,
  onFileUploaded,
}: UseFileUploadProps) {
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, UploadFile>>(new Map());
  const [pendingFiles, setPendingFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  // Use file selection for drag-drop
  const {
    isDragging,
    fileInputRef,
    handleFileSelect: selectFiles,
    clearFiles,
    removeFile,
    openFileDialog,
    dragHandlers,
  } = useFileSelection();

  /**
   * Handle file selection - just add to pending, don't upload yet
   */
  const handleFileSelect = useCallback(
    (files: FileList | File[] | null) => {
      if (!files) return;
      
      const fileArray = Array.from(files);
      
      // Create UploadFile entries and add to pending
      // Add preview URLs for image files
      const newPendingFiles = fileArray.map(file => {
        // Create preview URL for image files
        if (file.type.startsWith('image/')) {
          const preview = URL.createObjectURL(file);
          // Add preview property to the file object
          Object.assign(file, { preview });
        }
        
        return {
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          file,
          progress: 0,
          status: 'pending' as const,
        };
      });
      
      setPendingFiles(prev => [...prev, ...newPendingFiles]);
      selectFiles(files);
    },
    [selectFiles]
  );

  /**
   * Remove a file from pending or cancel if uploading
   */
  const handleRemoveFile = useCallback((index: number) => {
    // Get the file to remove for cleanup
    const allFiles = [...pendingFiles, ...Array.from(uploadingFiles.values())];
    const fileToRemove = allFiles[index];
    
    // Clean up preview URL if it exists
    if (fileToRemove && 'preview' in fileToRemove.file && (fileToRemove.file as any).preview) {
      URL.revokeObjectURL((fileToRemove.file as any).preview);
    }
    
    // Remove from pending files
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
    removeFile(index);
    
    // If it's uploading, cancel it
    const file = pendingFiles[index];
    if (file && uploadingFiles.has(file.id)) {
      const controller = abortControllersRef.current.get(file.id);
      if (controller) {
        controller.abort();
        abortControllersRef.current.delete(file.id);
      }
      setUploadingFiles(prev => {
        const updated = new Map(prev);
        updated.delete(file.id);
        return updated;
      });
    }
  }, [pendingFiles, uploadingFiles, removeFile]);

  /**
   * Start uploading all pending files
   */
  const startUpload = useCallback(
    async () => {
      if (pendingFiles.length === 0 || !workspaceId || isUploading) return;

      setIsUploading(true);
      const uploads = new Map<string, UploadFile>();

      // Move pending files to uploading state
      pendingFiles.forEach(file => {
        uploads.set(file.id, { ...file, status: 'uploading' });
      });
      
      setUploadingFiles(uploads);
      setPendingFiles([]); // Clear pending since they're now uploading

      const uploadService = new ClientUploadService();
      
      // Check if we should use batch upload (more than 1 file)
      if (uploads.size > 1) {
        // Prepare files for batch upload
        const filesToUpload = Array.from(uploads.values()).map(uf => uf.file);
        const fileIdMap = new Map<string, string>(); // Map file names to upload IDs
        
        Array.from(uploads.entries()).forEach(([id, uploadFile]) => {
          // Create a unique key for each file (name + size for uniqueness)
          const fileKey = `${uploadFile.file.name}-${uploadFile.file.size}`;
          fileIdMap.set(fileKey, id);
        });

        try {
          // Use batch upload for multiple files
          const results = await uploadService.uploadBatch(
            filesToUpload,
            workspaceId,
            folderId,
            {
              maxConcurrent: 3,
              onProgress: (overallProgress) => {
                // Update all files with the overall progress
                setUploadingFiles(prev => {
                  const updated = new Map(prev);
                  updated.forEach(file => {
                    if (file.status === 'uploading') {
                      file.progress = overallProgress;
                    }
                  });
                  return updated;
                });
              },
              onFileComplete: (fileName, result) => {
                // Find the corresponding upload ID
                const matchingEntry = Array.from(uploads.values()).find(
                  uf => uf.file.name === fileName
                );
                
                if (matchingEntry) {
                  const id = Array.from(uploads.entries()).find(
                    ([_, uf]) => uf === matchingEntry
                  )?.[0];
                  
                  if (id) {
                    setUploadingFiles(prev => {
                      const updated = new Map(prev);
                      const file = updated.get(id);
                      if (file) {
                        file.progress = 100;
                        file.status = result.success ? 'success' : 'error';
                        if (!result.success) {
                          file.error = result.error || 'Upload failed';
                        }
                      }
                      return updated;
                    });
                    
                    if (result.success) {
                      onFileUploaded?.(result.data);
                    }
                  }
                }
              }
            }
          );

          // Process final results
          results.forEach((result, index) => {
            const file = filesToUpload[index];
            if (file) {
              const fileKey = `${file.name}-${file.size}`;
              const id = fileIdMap.get(fileKey);
              
              if (id) {
                setUploadingFiles(prev => {
                  const updated = new Map(prev);
                  const uploadFile = updated.get(id);
                  if (uploadFile) {
                    uploadFile.progress = 100;
                    uploadFile.status = result.success ? 'success' : 'error';
                    if (!result.success) {
                      uploadFile.error = result.error || 'Upload failed';
                    }
                  }
                  return updated;
                });
              }
            }
          });
        } catch (error) {
          // Handle batch upload error
          setUploadingFiles(prev => {
            const updated = new Map(prev);
            updated.forEach(file => {
              if (file.status === 'uploading') {
                file.status = 'error';
                file.error = error instanceof Error ? error.message : 'Batch upload failed';
              }
            });
            return updated;
          });
        }
      } else {
        // Single file upload - use existing logic
        for (const [id, uploadFile] of uploads) {
          const controller = new AbortController();
          abortControllersRef.current.set(id, controller);

          try {
            const result = await uploadService.uploadFile(
              uploadFile.file,
              workspaceId,
              folderId,
              {
                onProgress: (progress) => {
                  setUploadingFiles(prev => {
                    const updated = new Map(prev);
                    const file = updated.get(id);
                    if (file) file.progress = progress;
                    return updated;
                  });
                },
                signal: controller.signal,
                skipNotifications: false
              }
            );

            if (result.success) {
              // Update to completed
              setUploadingFiles(prev => {
                const updated = new Map(prev);
                const file = updated.get(id);
                if (file) {
                  file.progress = 100;
                  file.status = 'success';
                }
                return updated;
              });
              
              onFileUploaded?.(result.data);
            } else {
              // Update to error
              setUploadingFiles(prev => {
                const updated = new Map(prev);
                const file = updated.get(id);
                if (file) {
                  file.status = 'error';
                  file.error = result.error || 'Upload failed';
                }
                return updated;
              });
            }
          } catch (error) {
            // Handle unexpected errors
            setUploadingFiles(prev => {
              const updated = new Map(prev);
              const file = updated.get(id);
              if (file) {
                file.status = 'error';
                file.error = error instanceof Error ? error.message : 'Upload failed';
              }
              return updated;
            });
          } finally {
            abortControllersRef.current.delete(id);
          }
        }
      }

      // Refresh data
      await queryClient.invalidateQueries({
        queryKey: workspaceQueryKeys.data(),
      });
      await queryClient.invalidateQueries({
        queryKey: ['storage-info'],
      });

      setIsUploading(false);
      clearFiles();
      
      // Only close if all succeeded
      const allSucceeded = Array.from(uploadingFiles.values()).every(
        f => f.status === 'success'
      );
      if (allSucceeded) {
        onClose?.();
      }
    },
    [pendingFiles, workspaceId, folderId, queryClient, onFileUploaded, clearFiles, onClose, isUploading, uploadingFiles]
  );

  /**
   * Cancel all uploads
   */
  const cancelAllUploads = useCallback(() => {
    // Use the service's cancelAll method
    const uploadService = new ClientUploadService();
    uploadService.cancelAll();
    
    // Also abort our local controllers
    abortControllersRef.current.forEach(controller => controller.abort());
    abortControllersRef.current.clear();
    
    // Clear state
    setUploadingFiles(new Map());
    setPendingFiles([]);
    setIsUploading(false);
    clearFiles();
  }, [clearFiles]);

  /**
   * Clear all files (pending and uploading) - used when modal closes
   */
  const clearAllFiles = useCallback(() => {
    // Clean up preview URLs before clearing
    setPendingFiles(prev => {
      prev.forEach(uploadFile => {
        if ('preview' in uploadFile.file && (uploadFile.file as any).preview) {
          URL.revokeObjectURL((uploadFile.file as any).preview);
        }
      });
      return [];
    });
    
    setUploadingFiles(prev => {
      prev.forEach(uploadFile => {
        if ('preview' in uploadFile.file && (uploadFile.file as any).preview) {
          URL.revokeObjectURL((uploadFile.file as any).preview);
        }
      });
      return new Map();
    });
    
    clearFiles();
  }, [clearFiles]);

  /**
   * Cleanup preview URLs on component unmount
   */
  useEffect(() => {
    return () => {
      // Clean up all preview URLs when the component unmounts
      pendingFiles.forEach(uploadFile => {
        if ('preview' in uploadFile.file && (uploadFile.file as any).preview) {
          URL.revokeObjectURL((uploadFile.file as any).preview);
        }
      });
      
      uploadingFiles.forEach(uploadFile => {
        if ('preview' in uploadFile.file && (uploadFile.file as any).preview) {
          URL.revokeObjectURL((uploadFile.file as any).preview);
        }
      });
      
      // Also abort any pending uploads
      abortControllersRef.current.forEach(controller => controller.abort());
      abortControllersRef.current.clear();
    };
  }, []); // Empty dependency array - only run on unmount

  /**
   * Get all files for UI display (pending + uploading)
   */
  const files = [...pendingFiles, ...Array.from(uploadingFiles.values())];

  return {
    // State
    files,
    isDragging,
    isUploading,
    fileInputRef,

    // Actions
    handleFileSelect,
    openFileDialog,
    removeFile: handleRemoveFile,
    cancelAllUploads,
    clearAllFiles,
    startUpload, // Now exposed for manual trigger
    
    // Drag handlers
    ...dragHandlers,
  };
}