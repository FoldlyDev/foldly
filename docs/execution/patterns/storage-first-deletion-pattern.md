# Storage-First Deletion Pattern

## Overview

Critical architectural pattern for deleting files in paid storage platforms. **Delete storage FIRST, then database records** to prevent charging users for inaccessible files.

## Rationale

**Business Context**: Foldly charges users for storage space.

**Problem**: If database records are deleted before storage:
- Storage deletion might fail (network issues, quotas, provider downtime)
- Users are charged for files that don't exist in the database
- No way for users to access or delete the orphaned storage files
- **Result**: Unethical billing (charging for inaccessible resources)

**Solution**: Delete storage FIRST:
- If storage deletion fails → abort operation, user can retry
- If storage succeeds but DB fails → log orphaned record for cleanup (acceptable trade-off)
- **Result**: Users never pay for files they can't access

## Pattern Implementation

### Single File Deletion

```typescript
// CRITICAL: Delete from storage FIRST
try {
  await deleteFileFromStorage({
    gcsPath: file.storagePath,
    bucket: UPLOADS_BUCKET_NAME,
  });
} catch (error) {
  // Storage deletion failed - ABORT operation
  logger.error('Failed to delete file from storage - aborting operation', { ... });
  return { success: false, error: 'Failed to delete file from storage. Please try again.' };
}

// Storage deleted successfully - now delete database record
try {
  await deleteFile(fileId);
  logger.info('File deleted successfully (storage + DB)', { ... });
} catch (error) {
  // DB deletion failed but storage is already deleted
  logger.warn('Orphaned DB record (storage deleted, DB delete failed)', {
    fileId,
    requiresCleanup: true, // Flag for background job
  });
  // Still return success - file is deleted from storage (primary concern)
}

return { success: true };
```

### Bulk File Deletion

```typescript
// Delete storage for all files FIRST
const storageDeletePromises = files.map(async (file) => {
  try {
    await deleteFileFromStorage({ gcsPath: file.storagePath, bucket: UPLOADS_BUCKET_NAME });
    return { success: true, fileId: file.id };
  } catch (error) {
    return { success: false, fileId: file.id };
  }
});

const storageResults = await Promise.all(storageDeletePromises);

// Only delete database records for successfully deleted storage files
const successfulFileIds = storageResults.filter(r => r.success).map(r => r.fileId);
if (successfulFileIds.length > 0) {
  try {
    await bulkDeleteFiles(successfulFileIds);
  } catch (error) {
    logger.warn('Orphaned DB records (storage deleted, DB delete failed)', {
      fileIds: successfulFileIds,
      requiresCleanup: true,
    });
  }
}

return { success: true, data: { deletedCount: successfulFileIds.length } };
```

## When to Apply

### ✅ Use Storage-First Pattern

- **File deletion** (single or bulk) - Files have storage representation
- **All paid resource deletions** - Any billable resource (storage, compute, bandwidth)
- **Logo deletion** - Branding assets stored in GCS/Supabase Storage
- **Cleanup operations** - Background jobs removing files

### ❌ Do NOT Use Storage-First Pattern

- **Folder deletion** - Folders have no storage (pure database entities)
- **Database-only entities** - Links, permissions, users (no storage component)
- **Cascade deletions** - Handled by database foreign key constraints

## Implementation Files

**Actions**:
- `src/lib/actions/file.actions.ts` - `deleteFileAction`, `bulkDeleteFilesAction`
- `src/modules/links/lib/actions/branding.actions.ts` - `deleteLinkLogoAction`

**Queries**:
- `src/lib/database/queries/file.queries.ts` - `deleteFile`, `bulkDeleteFiles` (with documentation)

**Documentation**:
- `CLAUDE.md` (lines 416-479) - Project-wide standard

## Folder Deletion (Database-Only)

Folders do NOT follow storage-first pattern:

```typescript
// Folders have no storage - simple database deletion
export const deleteFolderAction = withAuthInput<DeleteFolderInput, void>(
  'deleteFolderAction',
  async (userId, input) => {
    // Verify ownership
    await verifyFolderOwnership(folderId, workspace.id, 'deleteFolderAction');

    // Delete from database only (CASCADE handles subfolders)
    await deleteFolder(folderId);

    return { success: true };
  }
);
```

**Why?**
- Folders are free organizational structures (no billing)
- Database CASCADE deletes subfolders automatically
- Files retain their storage (parent_folder_id set to NULL, preserving accessibility)

## Best Practices

### 1. Always Log Orphaned Records
```typescript
logger.warn('Orphaned DB record (storage deleted, DB delete failed)', {
  fileId,
  requiresCleanup: true, // Flag for background cleanup job
});
```

### 2. User-Friendly Error Messages
```typescript
// Encourage retry on storage failure
return {
  success: false,
  error: 'Failed to delete file from storage. Please try again.',
};
```

### 3. Graceful Partial Success
```typescript
// Bulk operations: Report actual deleted count (not all-or-nothing)
return {
  success: true,
  data: { deletedCount: successfulFileIds.length }
};
```

### 4. Security Validation BEFORE Deletion
```typescript
// Verify ownership for ALL files before ANY deletion
for (const fileId of fileIds) {
  await verifyFileOwnership(fileId, workspace.id, 'bulkDeleteFilesAction');
}
```

## Trade-Off Analysis

| Scenario | Storage-First | DB-First |
|----------|--------------|----------|
| **Storage fails** | ✅ Abort, user retries | ❌ Orphaned DB record, file still exists |
| **DB fails** | ✅ Orphaned DB record (fixable) | ❌ Orphaned storage file (unethical billing) |
| **Both succeed** | ✅ Clean deletion | ✅ Clean deletion |
| **User impact** | Never charged for inaccessible files | Charged for files they can't access |

**Verdict**: Orphaned DB records are acceptable (can be cleaned up). Orphaned storage files are unethical (users pay for nothing).

## Monitoring

**Alerts**:
- Orphaned DB records with `requiresCleanup: true` (threshold: >10 in 1 hour)
- Storage deletion failures (track provider health)
- Bulk operation partial success rates

**Cleanup Job**:
- Daily scan for orphaned DB records
- Delete records with `requiresCleanup` flag older than 7 days
- Log cleanup results

## Related Documentation

- [CLAUDE.md - Storage Operations](../../CLAUDE.md#storage-operations)
- [File Actions](../../src/lib/actions/file.actions.ts)
- [Action Organization Pattern](./action-organization-pattern.md)

---

**Status**: ✅ Implemented in workspace module (October 29, 2025)
**Version**: v1.0
