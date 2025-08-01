'use server';

import { db } from '@/lib/database/connection';
import { files } from '@/lib/database/schemas';
import { eq, sql } from 'drizzle-orm';
import type { ActionResult } from '@/types/actions';

interface DownloadFileParams {
  fileId: string;
}

export async function downloadFileAction({
  fileId,
}: DownloadFileParams): Promise<ActionResult<void>> {
  try {
    // Increment download count
    await db
      .update(files)
      .set({
        download_count: sql`${files.download_count} + 1`,
        last_accessed_at: new Date(),
      })
      .where(eq(files.id, fileId));

    return { success: true };
  } catch (error) {
    console.error('Error tracking download:', error);
    return {
      success: false,
      error: 'Failed to track download',
    };
  }
}