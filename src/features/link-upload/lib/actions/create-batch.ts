'use server';

import { db } from '@/lib/database/connection';
import { batches } from '@/lib/database/schemas';
import type { ActionResult } from '@/types/actions';

interface CreateBatchParams {
  linkId: string;
  userId: string;
  uploaderName: string;
  uploaderEmail?: string;
  uploaderMessage?: string;
  totalFiles: number;
  totalSize: number;
}

export async function createBatchAction(
  params: CreateBatchParams
): Promise<ActionResult<{ id: string }>> {
  try {
    const result = await db
      .insert(batches)
      .values({
        link_id: params.linkId,
        user_id: params.userId,
        uploader_name: params.uploaderName,
        uploader_email: params.uploaderEmail,
        uploader_message: params.uploaderMessage,
        total_files: params.totalFiles,
        total_size: params.totalSize,
        status: 'uploading',
        processed_files: 0,
      })
      .returning({ id: batches.id });

    if (result.length === 0) {
      return {
        success: false,
        error: 'Failed to create batch',
      };
    }

    return {
      success: true,
      data: { id: result[0].id },
    };
  } catch (error) {
    console.error('Error creating batch:', error);
    return {
      success: false,
      error: 'Failed to create upload batch',
    };
  }
}