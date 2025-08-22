'use server';

import { linkUploadService } from '../services';
import type { ActionResult } from '@/types/actions';

export async function completeBatchAction(
  batchId: string
): Promise<ActionResult<void>> {
  // Delegate to service layer
  return linkUploadService.completeBatch(batchId);
}