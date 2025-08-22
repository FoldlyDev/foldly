'use server';

import { linkUploadService } from '../services';
import type { ActionResult } from '@/types/actions';

interface CheckStorageParams {
  userId: string;
  requiredSpace: number;
}

interface StorageCheckResult {
  hasSpace: boolean;
  currentUsage: number;
  storageLimit: number;
  availableSpace: number;
}

export async function checkStorageAvailableAction({
  userId,
  requiredSpace,
}: CheckStorageParams): Promise<ActionResult<StorageCheckResult>> {
  // Delegate to service layer
  return linkUploadService.checkStorageAvailable(userId, requiredSpace);
}