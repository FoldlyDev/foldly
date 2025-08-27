'use client';

import { useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { validateMultipleFilesAction } from '../lib/actions';
import { formatBytes } from '../lib/utils/storage-utils';

export function usePreUploadValidation() {
  const { user } = useUser();

  return useCallback(
    async (
      files: File[] | FileList
    ): Promise<{
      valid: boolean;
      reason?: string;
      totalSize: number;
      exceedsLimit: boolean;
      invalidFiles?: Array<{
        file: File;
        reason: string;
      }>;
      maxFileSize?: number;
    }> => {
      const fileArray = Array.from(files);
      const fileSizes = fileArray.map(file => file.size);
      const totalSize = fileSizes.reduce((sum, size) => sum + size, 0);

      if (totalSize === 0) {
        return {
          valid: false,
          reason: 'No files selected',
          totalSize: 0,
          exceedsLimit: false,
        };
      }

      if (!user?.id) {
        return {
          valid: false,
          reason: 'User not authenticated',
          totalSize,
          exceedsLimit: true,
        };
      }

      // Call server action without planKey - it gets plan from Clerk
      const result = await validateMultipleFilesAction(fileSizes);

      // If server returned invalid files, enhance the data with file references
      if (result.data?.invalidFiles && result.data.invalidFiles.length > 0) {
        const invalidFilesWithDetails = result.data.invalidFiles
          .map((invalid: any) => {
            const file = fileArray[invalid.index];
            if (!file) {
              return null;
            }
            return {
              file,
              reason: `${file.name} (${formatBytes(invalid.size)}) exceeds the plan limit`,
            };
          })
          .filter(
            (item: any): item is { file: File; reason: string } => item !== null
          );

        const response: {
          valid: boolean;
          reason?: string;
          totalSize: number;
          exceedsLimit: boolean;
          invalidFiles?: Array<{ file: File; reason: string }>;
          maxFileSize?: number;
        } = {
          valid: result.data.valid,
          totalSize: result.data.totalSize,
          exceedsLimit: result.data.exceedsLimit,
        };

        if (result.data.reason) response.reason = result.data.reason;
        if (result.data.maxFileSize)
          response.maxFileSize = result.data.maxFileSize;
        if (invalidFilesWithDetails.length > 0)
          response.invalidFiles = invalidFilesWithDetails;

        return response;
      }

      if (!result.data) {
        return {
          valid: false,
          reason: result.error || 'Validation failed',
          totalSize,
          exceedsLimit: true,
        };
      }

      const response: {
        valid: boolean;
        reason?: string;
        totalSize: number;
        exceedsLimit: boolean;
        invalidFiles?: Array<{ file: File; reason: string }>;
        maxFileSize?: number;
      } = {
        valid: result.data.valid,
        totalSize: result.data.totalSize,
        exceedsLimit: result.data.exceedsLimit,
      };

      if (result.data.reason) response.reason = result.data.reason;
      if (result.data.maxFileSize)
        response.maxFileSize = result.data.maxFileSize;

      return response;
    },
    [user?.id]
  );
}
