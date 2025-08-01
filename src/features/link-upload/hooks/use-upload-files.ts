import { useCallback } from 'react';
import { useUploadStore } from '../stores/upload-store';
import { createBatchAction } from '../lib/actions/create-batch';
import { uploadFileAction } from '../lib/actions/upload-file';
import { completeBatchAction } from '../lib/actions/complete-batch';
import type { LinkWithOwner } from '../types';

export function useUploadFiles() {
  const {
    session,
    currentBatch,
    updateFileStatus,
    updateFileProgress,
    updateBatchStatus,
    updateBatchProgress,
    setIsUploading,
    reset,
  } = useUploadStore();

  const uploadFiles = useCallback(
    async (link: LinkWithOwner) => {
      if (!currentBatch || !session) return;

      setIsUploading(true);
      updateBatchStatus('uploading');

      try {
        // Create batch in database
        const batchResult = await createBatchAction({
          linkId: link.id,
          userId: link.user_id,
          uploaderName: session.uploaderName,
          uploaderEmail: session.uploaderEmail,
          uploaderMessage: session.uploaderMessage,
          totalFiles: currentBatch.files.length,
          totalSize: currentBatch.totalSize,
        });

        if (!batchResult.success || !batchResult.data) {
          throw new Error(batchResult.error || 'Failed to create batch');
        }

        const batchId = batchResult.data.id;
        let processedSize = 0;

        // Upload files one by one
        for (const uploadFile of currentBatch.files) {
          try {
            updateFileStatus(uploadFile.id, 'uploading');

            // Upload file with progress tracking
            const result = await uploadFileAction({
              file: uploadFile.file,
              linkId: link.id,
              batchId,
              userId: link.user_id,
              onProgress: (progress) => {
                updateFileProgress(uploadFile.id, progress);
              },
            });

            if (!result.success) {
              throw new Error(result.error || 'Upload failed');
            }

            updateFileStatus(uploadFile.id, 'completed');
            processedSize += uploadFile.file.size;
            updateBatchProgress(processedSize);

          } catch (error) {
            updateFileStatus(
              uploadFile.id,
              'failed',
              error instanceof Error ? error.message : 'Upload failed'
            );
          }
        }

        // Complete the batch
        await completeBatchAction({ batchId });
        
        updateBatchStatus('completed');
        
        // Reset after a delay to show completion
        setTimeout(() => {
          reset();
        }, 3000);

      } catch (error) {
        updateBatchStatus('failed');
        console.error('Batch upload error:', error);
      } finally {
        setIsUploading(false);
      }
    },
    [
      currentBatch,
      session,
      setIsUploading,
      updateBatchStatus,
      updateFileStatus,
      updateFileProgress,
      updateBatchProgress,
      reset,
    ]
  );

  return { uploadFiles };
}