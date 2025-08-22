'use server';

import { linkUploadService } from '../services';
import type { ActionResult } from '@/types/actions';

interface UploadFileParams {
  batchId: string;
  fileId: string;
  file: File;
  folderId?: string;
  sortOrder?: number;
}

export async function uploadFileAction({
  batchId,
  fileId,
  file,
  folderId,
  sortOrder,
}: UploadFileParams): Promise<ActionResult<{ id: string; path: string }>> {
  // Delegate to service layer with sortOrder
  return linkUploadService.uploadFile({ 
    batchId, 
    fileId, 
    file, 
    folderId: folderId as string | undefined, 
    sortOrder 
  });
}