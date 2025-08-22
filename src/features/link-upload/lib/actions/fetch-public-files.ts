'use server';

import { linkUploadService } from '../services';
import type { ActionResult } from '@/types/actions';
import type { FileTreeNode } from '../../types';

interface FetchPublicFilesParams {
  linkId: string;
}

export async function fetchPublicFilesAction({
  linkId,
}: FetchPublicFilesParams): Promise<ActionResult<FileTreeNode[]>> {
  // Delegate to service layer
  return linkUploadService.fetchPublicFiles(linkId);
}