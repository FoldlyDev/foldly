'use server';

import { createClient } from '@supabase/supabase-js';
import { db } from '@/lib/database/connection';
import { files, users, links } from '@/lib/database/schemas';
import { eq, sql } from 'drizzle-orm';
import type { ActionResult } from '@/types/actions';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface UploadFileParams {
  file: File;
  linkId: string;
  batchId: string;
  userId: string;
  folderId?: string;
  onProgress?: (progress: number) => void;
}

export async function uploadFileAction({
  file,
  linkId,
  batchId,
  userId,
  folderId,
}: UploadFileParams): Promise<ActionResult<{ id: string; path: string }>> {
  try {
    // Generate unique file path
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `${userId}/${linkId}/${timestamp}_${sanitizedName}`;

    // Convert File to ArrayBuffer then to Uint8Array for Supabase
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('files')
      .upload(storagePath, uint8Array, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return {
        success: false,
        error: 'Failed to upload file to storage',
      };
    }

    // Create file record in database
    const fileExtension = file.name.split('.').pop() || '';
    
    const fileResult = await db
      .insert(files)
      .values({
        link_id: linkId,
        batch_id: batchId,
        user_id: userId,
        folder_id: folderId,
        file_name: sanitizedName,
        original_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        extension: fileExtension,
        storage_path: uploadData.path,
        storage_provider: 'supabase',
        is_safe: true,
        virus_scan_result: 'clean',
        processing_status: 'completed',
        download_count: 0,
      })
      .returning({ id: files.id });

    if (fileResult.length === 0) {
      // Cleanup storage if database insert fails
      await supabase.storage.from('files').remove([storagePath]);
      return {
        success: false,
        error: 'Failed to create file record',
      };
    }

    // Update user storage usage
    await db
      .update(users)
      .set({
        storage_used: sql`${users.storage_used} + ${file.size}`,
        updated_at: new Date(),
      })
      .where(eq(users.id, userId));

    // Update link statistics
    await db
      .update(links)
      .set({
        total_files: sql`${links.total_files} + 1`,
        total_size: sql`${links.total_size} + ${file.size}`,
        storage_used: sql`${links.storage_used} + ${file.size}`,
        last_upload_at: new Date(),
        updated_at: new Date(),
      })
      .where(eq(links.id, linkId));

    return {
      success: true,
      data: {
        id: fileResult[0].id,
        path: uploadData.path,
      },
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    return {
      success: false,
      error: 'Failed to upload file',
    };
  }
}