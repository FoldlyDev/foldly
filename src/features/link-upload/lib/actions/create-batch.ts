'use server';

import { linkUploadService } from '../services';
import type { ActionResult } from '@/types/actions';

interface FileData {
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploaderName: string;
}

interface CreateBatchParams {
  linkId: string;
  files: FileData[];
  folderId?: string;
  uploaderName?: string;
  uploaderEmail?: string;
  uploaderMessage?: string;
}

interface BatchResponse {
  batchId: string;
  files: { id: string; fileName: string }[];
}

export async function createBatchAction(
  params: CreateBatchParams
): Promise<ActionResult<BatchResponse>> {
  // Delegate to service layer
  return linkUploadService.createBatch(params);
}