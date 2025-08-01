'use server';

import { db } from '@/lib/database/connection';
import { files, batches, folders } from '@/lib/database/schemas';
import { eq } from 'drizzle-orm';
import { createClient } from '@supabase/supabase-js';
import type { ActionResult } from '@/types/actions';
import type { FileTreeNode } from '../../types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface FetchPublicFilesParams {
  linkId: string;
}

export async function fetchPublicFilesAction({
  linkId,
}: FetchPublicFilesParams): Promise<ActionResult<FileTreeNode[]>> {
  try {
    // Fetch all files for this link with batch info
    const filesResult = await db
      .select({
        file: files,
        batch: {
          id: batches.id,
          uploader_name: batches.uploader_name,
          created_at: batches.created_at,
        },
      })
      .from(files)
      .innerJoin(batches, eq(files.batch_id, batches.id))
      .where(eq(files.link_id, linkId))
      .orderBy(files.created_at);

    // Organize files by uploader and date
    const tree: FileTreeNode[] = [];
    const uploaderMap = new Map<string, FileTreeNode>();

    for (const { file, batch } of filesResult) {
      // Create uploader folder if doesn't exist
      if (!uploaderMap.has(batch.uploader_name)) {
        const uploaderNode: FileTreeNode = {
          id: `uploader-${batch.uploader_name}`,
          name: batch.uploader_name,
          type: 'folder',
          children: [],
        };
        uploaderMap.set(batch.uploader_name, uploaderNode);
        tree.push(uploaderNode);
      }

      const uploaderNode = uploaderMap.get(batch.uploader_name)!;

      // Create date folder
      const uploadDate = new Date(batch.created_at);
      const dateStr = uploadDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      
      let dateNode = uploaderNode.children?.find(
        (child) => child.id === `date-${batch.uploader_name}-${dateStr}`
      );

      if (!dateNode) {
        dateNode = {
          id: `date-${batch.uploader_name}-${dateStr}`,
          name: dateStr,
          type: 'folder',
          children: [],
        };
        uploaderNode.children!.push(dateNode);
      }

      // Generate signed URL for download
      const { data: signedUrlData } = await supabase.storage
        .from('files')
        .createSignedUrl(file.storage_path, 3600); // 1 hour expiry

      // Add file to date folder
      const fileNode: FileTreeNode = {
        id: file.id,
        name: file.original_name,
        type: 'file',
        size: Number(file.file_size),
        mimeType: file.mime_type,
        downloadUrl: signedUrlData?.signedUrl,
        uploadedAt: new Date(file.uploaded_at),
        uploaderName: batch.uploader_name,
      };

      dateNode.children!.push(fileNode);
    }

    return {
      success: true,
      data: tree,
    };
  } catch (error) {
    console.error('Error fetching public files:', error);
    return {
      success: false,
      error: 'Failed to fetch files',
    };
  }
}