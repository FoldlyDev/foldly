'use server';

import { db } from '@/lib/database/connection';
import { batches } from '@/lib/database/schemas';
import { eq } from 'drizzle-orm';
import type { ActionResult } from '@/types/actions';

interface CompleteBatchParams {
  batchId: string;
}

export async function completeBatchAction({
  batchId,
}: CompleteBatchParams): Promise<ActionResult<void>> {
  try {
    await db
      .update(batches)
      .set({
        status: 'completed',
        upload_completed_at: new Date(),
        updated_at: new Date(),
      })
      .where(eq(batches.id, batchId));

    return { success: true };
  } catch (error) {
    console.error('Error completing batch:', error);
    return {
      success: false,
      error: 'Failed to complete batch',
    };
  }
}