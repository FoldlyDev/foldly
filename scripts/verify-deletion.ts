/**
 * VERIFICATION SCRIPT: File Deletion Logic
 *
 * Tests that file deletion properly removes both storage and database records
 * Run this script manually to verify the deletion flow
 *
 * Usage:
 * 1. Create a test file in your workspace
 * 2. Get the file ID from the database
 * 3. Run: npx tsx scripts/verify-deletion.ts <file-id>
 * 4. Check Supabase dashboard to confirm deletion
 */

import { db } from '@/lib/database/connection';
import { files } from '@/lib/database/schemas';
import { eq } from 'drizzle-orm';
import { deleteFile as deleteFileFromStorage, fileExists } from '@/lib/storage/client';

async function verifyDeletion(fileId: string) {
  console.log('🔍 Starting deletion verification for file:', fileId);

  try {
    // 1. Get file from database
    const file = await db.query.files.findFirst({
      where: eq(files.id, fileId),
    });

    if (!file) {
      console.error('❌ File not found in database');
      return;
    }

    console.log('✅ File found in database:', {
      id: file.id,
      filename: file.filename,
      storagePath: file.storagePath,
      workspaceId: file.workspaceId,
    });

    // 2. Check if file exists in storage
    const storageExists = await fileExists({
      gcsPath: file.storagePath,
      bucket: process.env.SUPABASE_UPLOADS_BUCKET_NAME || 'foldly-uploads',
    });

    console.log('📦 Storage status BEFORE deletion:', storageExists ? '✅ EXISTS' : '❌ NOT FOUND');

    // 3. Delete from storage (FIRST - storage-first pattern)
    console.log('🗑️  Deleting from storage...');
    try {
      await deleteFileFromStorage({
        gcsPath: file.storagePath,
        bucket: process.env.SUPABASE_UPLOADS_BUCKET_NAME || 'foldly-uploads',
      });
      console.log('✅ Storage deletion successful');
    } catch (storageError) {
      console.error('❌ Storage deletion FAILED:', storageError);
      console.log('⚠️  ABORTING - Cannot verify full deletion (storage failed)');
      return;
    }

    // 4. Delete from database (SECOND - after storage succeeds)
    console.log('🗑️  Deleting from database...');
    try {
      await db.delete(files).where(eq(files.id, fileId));
      console.log('✅ Database deletion successful');
    } catch (dbError) {
      console.error('❌ Database deletion FAILED:', dbError);
      console.log('⚠️  ORPHANED DB RECORD - Storage deleted but DB record remains');
      return;
    }

    // 5. Verify deletion
    console.log('\n🔍 Verifying deletion...');

    const dbCheck = await db.query.files.findFirst({
      where: eq(files.id, fileId),
    });

    const storageCheck = await fileExists({
      gcsPath: file.storagePath,
      bucket: process.env.SUPABASE_UPLOADS_BUCKET_NAME || 'foldly-uploads',
    });

    console.log('\n📊 VERIFICATION RESULTS:');
    console.log('Database record:', dbCheck ? '❌ STILL EXISTS (BUG!)' : '✅ DELETED');
    console.log('Storage file:', storageCheck ? '❌ STILL EXISTS (BUG!)' : '✅ DELETED');

    if (!dbCheck && !storageCheck) {
      console.log('\n✅ ✅ ✅ DELETION VERIFIED - Both storage and database cleaned up successfully!');
    } else {
      console.log('\n❌ DELETION INCOMPLETE - Check above for details');
    }

  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    process.exit(0);
  }
}

// Get file ID from command line
const fileId = process.argv[2];

if (!fileId) {
  console.error('❌ Usage: npx tsx scripts/verify-deletion.ts <file-id>');
  process.exit(1);
}

verifyDeletion(fileId);
