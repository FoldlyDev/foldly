'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ClientUploadService } from '@/lib/services/upload/client-upload-service';
import { workspaceQueryKeys } from '../lib/query-keys';

// Upload file tracking type
export interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

interface UseFileUploadProps {
  workspaceId?: string;
  folderId?: string;
  onClose?: () => void;
  onFileUploaded?: (file: any) => void;
  initialFiles?: File[]; // Files passed from external drop handler
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
  initialFiles,
}: UseFileUploadProps) {
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, UploadFile>>(new Map());
  const [pendingFiles, setPendingFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    },
    []
  );

  /**
   * Remove a file from pending or cancel if uploading
   */
  const handleRemoveFile = useCallback((fileId: string) => {
    // Find the file to remove
    const fileToRemove = pendingFiles.find(f => f.id === fileId) || 
                        uploadingFiles.get(fileId);
    
    // Clean up preview URL if it exists
    if (fileToRemove && 'preview' in fileToRemove.file && (fileToRemove.file as any).preview) {
      URL.revokeObjectURL((fileToRemove.file as any).preview);
    }
    
    // Remove from pending files
    setPendingFiles(prev => prev.filter(f => f.id !== fileId));
    
    // If it's uploading, cancel it
    if (uploadingFiles.has(fileId)) {
      const controller = abortControllersRef.current.get(fileId);
      if (controller) {
        controller.abort();
        abortControllersRef.current.delete(fileId);
      }
      setUploadingFiles(prev => {
        const updated = new Map(prev);
        updated.delete(fileId);
        return updated;
      });
    }
  }, [pendingFiles, uploadingFiles]);

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
      
      // Close modal immediately after starting uploads
      // Files will appear in the tree as they complete in the background
      onClose?.();

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
                      // Don't call onFileUploaded here - it will be called in final results processing
                      // to avoid duplicate tree additions
                      // onFileUploaded?.(result.data);
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
                
                // Call onFileUploaded here for batch uploads to add to tree
                if (result.success && result.data) {
                  onFileUploaded?.(result.data);
                }
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
    },
    [pendingFiles, workspaceId, folderId, queryClient, onFileUploaded, onClose, isUploading, uploadingFiles]
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
  }, []);

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
  }, []);

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

  // Open file dialog helper
  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Process initial files if provided
  useEffect(() => {
    if (initialFiles && initialFiles.length > 0) {
      handleFileSelect(initialFiles);
    }
  }, [initialFiles, handleFileSelect]);

  return {
    // State
    files,
    isUploading,
    fileInputRef,

    // Actions
    handleFileSelect,
    openFileDialog,
    removeFile: handleRemoveFile,
    cancelAllUploads,
    clearAllFiles,
    startUpload, // Now exposed for manual trigger
  };
}