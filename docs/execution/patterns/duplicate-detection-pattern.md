# Duplicate File Detection Pattern

## Overview

Critical architectural pattern for preventing 409 "Resource already exists" errors during file uploads. **Check BOTH database AND storage** before initiating upload to prevent conflicts from orphaned storage files and abandoned TUS sessions.

## Rationale

**Problem**: File uploads fail with 409 errors when:
- Storage provider has orphaned files (uploaded but DB record creation failed)
- Previous TUS/Resumable upload sessions were initiated but never completed
- Storage path conflicts with abandoned upload attempts
- File exists in storage but not in database (orphaned storage files)

**Solution**: Dual-layer duplicate detection:
1. **Database Check**: Verify no file with same name exists in target folder
2. **Storage Check**: Verify no file exists at storage path (catches orphaned files)
3. **Unique Filename Generation**: If conflicts detected, generate Windows-style unique name
4. **Pre-Upload Validation**: Perform checks BEFORE initiating TUS/Resumable session

**Result**: Upload sessions never conflict with existing storage files, eliminating 409 errors.

## Pattern Implementation

### Server-Side (Upload Initiation)

```typescript
// src/lib/actions/storage.actions.ts - initiateUploadAction

// 1. Import required utilities
const { checkFilenameExists } = await import('@/lib/database/queries/file.queries');
const { generateUniqueFilename } = await import('@/lib/utils/file-helpers');
const { fileExists } = await import('@/lib/storage/client');

// 2. Generate unique filename with dual-layer validation
const uniqueFilename = await generateUniqueFilename(
  input.fileName,
  async (filename) => {
    // Layer 1: Check database for duplicate filenames in same folder
    const dbExists = await checkFilenameExists(input.parentFolderId ?? null, filename);
    if (dbExists) return true;

    // Layer 2: Check storage for existing file at same path
    // CRITICAL: This prevents 409 errors from orphaned storage files
    const storagePath = `${input.path}/${filename}`;
    const storageExists = await fileExists({
      gcsPath: storagePath,
      bucket: input.bucket,
    });

    return storageExists;
  }
);

// 3. Initiate upload with unique filename
const session = await storageInitiateUpload({
  fileName: uniqueFilename, // Use unique filename, not original
  fileSize: input.fileSize,
  contentType: input.contentType,
  bucket: input.bucket,
  path: input.path,
  metadata: input.metadata,
});

// 4. Return session with unique filename for DB record creation
return {
  success: true,
  data: {
    ...session,
    uniqueFileName: uniqueFilename, // Client needs this for DB record
  },
};
```

### Filename Generation Logic

```typescript
// src/lib/utils/file-helpers.ts - generateUniqueFilename

/**
 * Generates Windows-style unique filename: photo.jpg → photo (1).jpg → photo (2).jpg
 * Supports async checker functions for both DB and storage validation
 */
export async function generateUniqueFilename(
  baseFilename: string,
  checkExists: (filename: string) => Promise<boolean>
): Promise<string> {
  // Check if base filename is available
  const exists = await checkExists(baseFilename);
  if (!exists) return baseFilename;

  // Extract filename and extension
  const lastDotIndex = baseFilename.lastIndexOf('.');
  const hasExtension = lastDotIndex > 0 && lastDotIndex < baseFilename.length - 1;

  const nameWithoutExt = hasExtension
    ? baseFilename.substring(0, lastDotIndex)
    : baseFilename;
  const extension = hasExtension ? baseFilename.substring(lastDotIndex) : '';

  // Increment counter until available filename found
  let counter = 1;
  let candidateFilename: string;

  do {
    candidateFilename = `${nameWithoutExt} (${counter})${extension}`;
    counter++;

    // Safety limit to prevent infinite loop
    if (counter > 1000) {
      const timestamp = Date.now();
      candidateFilename = `${nameWithoutExt} (${timestamp})${extension}`;
      break;
    }
  } while (await checkExists(candidateFilename));

  return candidateFilename;
}
```

### Client-Side (Upload Execution)

```typescript
// src/hooks/utility/use-uppy-upload.ts

interface UploadOptions {
  path: string;
  parentFolderId?: string | null; // Required for duplicate detection
  metadata?: Record<string, string>;
}

interface UploadResult {
  uniqueFileName: string; // Actual filename used (may differ from original)
  storagePath: string;
  url: string;
}

// Usage in upload hook
const { upload } = useUppyUpload({ bucket: 'foldly-uploads' });

const result = await upload(file, {
  path: `uploads/${workspaceId}/${linkId}`,
  parentFolderId: folderId, // Critical for duplicate detection
  metadata: { linkId, workspaceId },
});

// Use uniqueFileName for database record
await createFileRecordAction({
  name: result.uniqueFileName, // NOT file.name (may be modified)
  storagePath: result.storagePath,
  // ...
});
```

### Database Record Creation

```typescript
// src/modules/workspace/components/modals/UploadFilesModal.tsx

// Upload returns uniqueFileName after duplicate detection
const uploadResult = await fileUpload.upload(file, {
  path: `uploads/${workspaceId}/${link.id}`,
  parentFolderId: selectedFolderId,
  metadata: { linkId: link.id, workspaceId },
});

// Create database record using actual uploaded filename
await createFileRecord.mutateAsync({
  name: uploadResult.uniqueFileName, // Server determined this is unique
  size: file.size,
  mimeType: file.type,
  storagePath: uploadResult.storagePath,
  parentFolderId: selectedFolderId,
  linkId: link.id,
  uploaderEmail: null,
});
```

## Type Definitions

```typescript
// src/lib/storage/types.ts

export interface UploadSession {
  uploadId: string;
  sessionUrl: string;
  chunkSize: number;
  expiresAt: Date;
  finalPath: string;
  bucket: string;
  uniqueFileName: string; // Added for duplicate detection
}

// src/hooks/utility/use-uppy-upload.ts

interface UploadOptions {
  path: string;
  parentFolderId?: string | null; // For duplicate detection
  metadata?: Record<string, string>;
}

interface UploadResult {
  uniqueFileName: string; // Actual filename after duplicate resolution
  storagePath: string;
  url: string;
}
```

## When to Apply

### ✅ Use Duplicate Detection

- **All file uploads** (authenticated and public)
- **Resumable uploads** (TUS/GCS Resumable protocols)
- **Operations that create storage files** (uploads, imports)
- **Multi-file uploads** (batch processing)

### ❌ Not Applicable

- **Direct storage operations** (deleteFile, getSignedUrl) - No conflict risk
- **Database-only operations** (folders, links) - No storage involved
- **File overwrites** (explicit replace operations) - Intentional conflict

## Validation Flow

```
Client Upload Request
        ↓
1. Server receives fileName: "photo.jpg"
        ↓
2. Check Database: checkFilenameExists(folderId, "photo.jpg")
   Result: false (not in DB)
        ↓
3. Check Storage: fileExists("uploads/.../photo.jpg")
   Result: true (orphaned file in storage!)
        ↓
4. Generate Unique: generateUniqueFilename("photo.jpg", checker)
   Result: "photo (1).jpg" (both checks pass)
        ↓
5. Initiate Upload Session: TUS/Resumable with "photo (1).jpg"
        ↓
6. Return UploadSession with uniqueFileName: "photo (1).jpg"
        ↓
7. Client uploads file as "photo (1).jpg"
        ↓
8. Verify upload success
        ↓
9. Create DB record with name: "photo (1).jpg"
        ↓
✅ No 409 error - storage file and DB record aligned
```

## Implementation Files

**Server Actions**:
- `src/lib/actions/storage.actions.ts` - `initiateUploadAction` (dual-layer validation)
- `src/lib/actions/storage.actions.ts` - `initiatePublicUploadAction` (same pattern for public uploads)

**Database Queries**:
- `src/lib/database/queries/file.queries.ts` - `checkFilenameExists(folderId, filename)`

**Storage Layer**:
- `src/lib/storage/client.ts` - `fileExists({ gcsPath, bucket })`

**Utilities**:
- `src/lib/utils/file-helpers.ts` - `generateUniqueFilename(baseFilename, checkExists)`

**Client Hooks**:
- `src/hooks/utility/use-uppy-upload.ts` - Returns `UploadResult` with `uniqueFileName`

**Type Definitions**:
- `src/lib/storage/types.ts` - `UploadSession` interface with `uniqueFileName` field

**Components**:
- `src/modules/workspace/components/modals/UploadFilesModal.tsx` - Uses `uniqueFileName` for DB records

## Best Practices

### 1. Always Pass parentFolderId

```typescript
// ✅ CORRECT: Provides folder context for duplicate detection
const result = await upload(file, {
  path: uploadPath,
  parentFolderId: folderId, // Required for DB check
  metadata,
});

// ❌ INCORRECT: Missing folder context (DB check incomplete)
const result = await upload(file, {
  path: uploadPath,
  metadata,
});
```

### 2. Use Returned uniqueFileName for DB Records

```typescript
// ✅ CORRECT: Use server-determined unique filename
await createFileRecord({
  name: uploadResult.uniqueFileName, // Server resolved conflicts
  storagePath: uploadResult.storagePath,
});

// ❌ INCORRECT: Use original filename (may conflict)
await createFileRecord({
  name: file.name, // Original filename may be "photo.jpg"
  storagePath: uploadResult.storagePath, // Storage has "photo (1).jpg"
});
```

### 3. Dual-Layer Validation is Non-Negotiable

```typescript
// ✅ CORRECT: Check both database AND storage
const uniqueFilename = await generateUniqueFilename(fileName, async (name) => {
  const dbExists = await checkFilenameExists(folderId, name);
  if (dbExists) return true;

  const storageExists = await fileExists({ gcsPath: `${path}/${name}`, bucket });
  return storageExists;
});

// ❌ INCORRECT: Database check only (misses orphaned storage files)
const uniqueFilename = await generateUniqueFilename(fileName, async (name) => {
  return await checkFilenameExists(folderId, name);
});
```

### 4. Handle Async Checkers Correctly

```typescript
// ✅ CORRECT: Async checker function with proper await
const checker = async (filename: string) => {
  const dbCheck = await checkFilenameExists(folderId, filename);
  const storageCheck = await fileExists({ gcsPath, bucket });
  return dbCheck || storageCheck;
};

// ❌ INCORRECT: Sync checker (cannot perform async DB/storage checks)
const checker = (filename: string) => {
  return checkFilenameExists(folderId, filename); // Returns Promise, not boolean!
};
```

## Trade-Off Analysis

| Approach | Pros | Cons | Result |
|----------|------|------|--------|
| **Dual-Layer (Current)** | ✅ No 409 errors<br>✅ Handles orphaned files<br>✅ Prevents conflicts | ⚠️ Extra DB/storage query<br>⚠️ Slightly slower initiation | **Reliable uploads** |
| **Database-Only** | ✅ Faster (one query) | ❌ 409 errors from orphaned storage<br>❌ Fails on abandoned TUS sessions | **Frequent failures** |
| **Storage-Only** | ✅ Fast (one query) | ❌ Database conflicts<br>❌ Duplicate DB records | **Data inconsistency** |
| **No Validation** | ✅ Fastest | ❌ High 409 error rate<br>❌ Overwrites existing files | **Unacceptable** |

**Verdict**: Extra validation queries (<100ms overhead) prevent 409 errors that block entire upload operations (user-facing failures). Trade-off strongly favors reliability.

## Error Prevention

### Orphaned Storage Files Scenario

```
1. User uploads "report.pdf" successfully to storage
2. Network error during DB record creation
3. Database has no record, but storage has file
4. User retries upload with same "report.pdf"
   ↓
Without Dual-Layer Detection:
   - initiate TUS session for "report.pdf"
   - TUS/GCS responds: 409 Conflict (file exists)
   - Upload fails, user frustrated
   ↓
With Dual-Layer Detection:
   - Check DB: No record for "report.pdf" ✓
   - Check Storage: File exists at path ✗
   - Generate unique: "report (1).pdf" ✓
   - Initiate TUS session for "report (1).pdf"
   - Upload succeeds
   - DB record created as "report (1).pdf"
   - User sees both files (can delete orphaned one later)
```

### Abandoned TUS Sessions Scenario

```
1. User initiates upload for "photo.jpg"
2. TUS session created, reserves storage path
3. User cancels upload or browser crashes
4. TUS session expired but path may still be reserved
5. User retries upload with same "photo.jpg"
   ↓
Without Duplicate Detection:
   - Attempt to create TUS session at same path
   - 409 Conflict (path still reserved)
   ↓
With Duplicate Detection:
   - Storage check detects path conflict
   - Generate "photo (1).jpg"
   - New TUS session succeeds
```

## Monitoring

**Metrics to Track**:
- Frequency of unique filename generation (indicates conflict rate)
- 409 errors before/after pattern implementation (should drop to zero)
- Storage orphan detection rate (files in storage but not DB)
- Average time added by validation queries (<100ms expected)

**Alerts**:
- 409 errors still occurring (pattern not fully implemented)
- High unique filename generation rate (>10% of uploads) - Investigate orphan cleanup
- Slow validation queries (>500ms) - Optimize DB/storage indexes

## Related Documentation

- [CLAUDE.md - Storage Operations](../../CLAUDE.md#storage-operations)
- [Storage-First Deletion Pattern](./storage-first-deletion-pattern.md)
- [Storage Actions](../../src/lib/actions/storage.actions.ts)

---

**Status**: ✅ Implemented in workspace module (October 30, 2025)
**Version**: v1.0
