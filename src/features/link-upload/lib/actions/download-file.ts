'use server';

import { linkUploadService } from '../services';
import type { ActionResult } from '@/types/actions';

interface DownloadFileParams {
  fileId: string;
}

export async function downloadFileAction({
  fileId,
}: DownloadFileParams): Promise<ActionResult<void>> {
  // Delegate to service layer
  return linkUploadService.trackFileDownload(fileId);
}