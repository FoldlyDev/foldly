# Storage Architecture Refactoring Plan

## Executive Summary

The current resumable upload implementation is **functionally complete** but suffers from **critical architectural violations** that create unsustainable technical debt. Code Reviewer and Tech Lead agents have identified HIGH and CRITICAL severity issues that must be resolved before production deployment.

**Status**: BLOCKED - Cannot proceed without refactoring
**Estimated Time**: 2-3 hours
**Test Updates**: Deprioritized per user request (fix last)

## Current Architecture Problems

### 1. Upload Orchestration Exposed at Form Layer (CRITICAL)

**Problem**: 50+ lines of upload orchestration logic duplicated in `CreateLinkForm.tsx`

```typescript
// ❌ CURRENT: Form has orchestration logic
const initiateUpload = useInitiateBrandingLogoUpload();
const completeUpload = useCompleteBrandingLogoUpload();

// 50+ lines of complex orchestration
if (data.brandingEnabled && data.logo.length > 0) {
  const session = await initiateUpload.mutateAsync(...);
  await uploadFileResumable(logoFile, session, onProgress);
  await completeUpload.mutateAsync(...);
}
```

**Impact**:
- Every upload form (file uploads, profile pictures, etc.) will duplicate this logic
- Violates DRY principle
- Difficult to maintain and test
- Cannot easily add features like retry logic or error recovery

**Required Fix**: Extract orchestration into `useFileUpload` hook following existing `useDataState` pattern

---

### 2. CORS Security Vulnerability (HIGH)

**Problem**: GCS client uses `origin: '*'` for resumable uploads

```typescript
// ❌ CURRENT: src/lib/storage/gcs/client.ts:98
await fileRef.createResumableUpload({
  origin: '*', // ANY website can upload to your bucket
});
```

**Impact**:
- External websites can upload files to your GCS bucket
- Potential for malicious file uploads
- Storage quota abuse
- Unauthorized data access

**Required Fix**: Restrict to specific application origins

---

### 3. Missing Input Validation (HIGH)

**Problem**: `uploadFileResumable` has no runtime input validation

```typescript
// ❌ CURRENT: Assumes file and session are valid
export async function uploadFileResumable(
  file: File,
  session: UploadSession,
  onProgress?: UploadProgressCallback
): Promise<void> {
  // No validation of file or session
  const { sessionUrl, chunkSize } = session;
  // ...
}
```

**Impact**:
- Runtime crashes if invalid inputs passed
- Difficult to debug errors
- Poor developer experience

**Required Fix**: Add comprehensive input validation with clear error messages

---

### 4. Production Console Statements (HIGH)

**Problem**: 15+ `console.log` statements in production code

**Files Affected**:
- `src/modules/links/components/forms/CreateLinkForm.tsx` (8 instances)
- `src/lib/utils/upload-helpers.ts` (5 instances)
- `src/modules/links/lib/actions/branding.actions.ts` (2 instances)

**Impact**:
- Performance overhead
- Cluttered browser console
- Potential security leaks (exposing internal state)

**Required Fix**: Replace with proper logger or remove entirely

---

### 5. No Error Recovery Patterns (HIGH)

**Problem**: No handling for common failure scenarios

**Missing Patterns**:
- Session expiration (TUS sessions expire after 24 hours)
- Upload interruption (network failures, browser close)
- Orphaned files in storage (upload initiated but never completed)
- Database transaction rollback (file uploaded but DB update fails)

**Impact**:
- Data corruption
- Wasted storage space
- Poor user experience (no retry mechanism)

**Required Fix**: Implement comprehensive error recovery

---

### 6. No Batch Upload Support (HIGH)

**Problem**: API tightly coupled to single file uploads

**Impact**:
- Cannot add multi-file uploads without major refactoring
- Violates scalability requirement
- Will require architectural changes when needed

**Required Fix**: Design batch-capable architecture now

---

## Target Architecture

### Hook-Based Orchestration Pattern

```typescript
// ✅ TARGET: Forms use simple orchestration hook
function CreateLinkForm() {
  const uploadFile = useFileUpload({
    bucket: 'branding',
    onSuccess: (url) => console.log('Uploaded:', url),
  });

  const handleSubmit = async (data) => {
    if (data.logo.length > 0) {
      await uploadFile.upload(data.logo[0].file, {
        linkId: link.id,
        path: `branding/${workspace.id}/${link.id}`,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {uploadFile.isUploading && (
        <Progress percent={uploadFile.progress} />
      )}
    </form>
  );
}
```

**Benefits**:
- ✅ Single source of truth for upload logic
- ✅ Reusable across all upload scenarios
- ✅ Easy to add retry logic, error recovery
- ✅ Easy to test in isolation
- ✅ Follows existing `useDataState` pattern

---

## Step-by-Step Refactoring Plan

### Phase 1: Create Orchestration Hook (Priority: CRITICAL)

**File**: `src/hooks/utility/use-file-upload.ts`

**Implementation**:
```typescript
import { useState } from 'react';
import { uploadFileResumable } from '@/lib/utils/upload-helpers';
import {
  initiateResumableUpload,
  verifyUpload
} from '@/lib/storage/client';
import type { UploadProgressCallback } from '@/lib/storage/types';

interface UseFileUploadOptions {
  bucket: string;
  onSuccess?: (url: string) => void;
  onError?: (error: Error) => void;
}

interface UseFileUploadReturn {
  upload: (file: File, options: {
    path: string;
    metadata?: Record<string, string>;
  }) => Promise<string>;
  isUploading: boolean;
  progress: number;
  error: Error | null;
  cancel: () => void;
}

export function useFileUpload(
  options: UseFileUploadOptions
): UseFileUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const upload = async (file: File, uploadOptions: {
    path: string;
    metadata?: Record<string, string>;
  }): Promise<string> => {
    try {
      setIsUploading(true);
      setProgress(0);
      setError(null);

      const controller = new AbortController();
      setAbortController(controller);

      // Step 1: Initiate resumable upload
      const session = await initiateResumableUpload({
        fileName: file.name,
        fileSize: file.size,
        contentType: file.type,
        bucket: options.bucket,
        path: uploadOptions.path,
        metadata: uploadOptions.metadata,
      });

      // Step 2: Upload file to storage with progress
      const onProgress: UploadProgressCallback = (percent) => {
        setProgress(percent);
      };

      await uploadFileResumable(file, session, onProgress, controller.signal);

      // Step 3: Verify upload completed
      const verification = await verifyUpload({
        uploadId: session.uploadId,
        bucket: options.bucket,
        path: session.finalPath,
      });

      if (!verification.success) {
        throw new Error('Upload verification failed');
      }

      setProgress(100);
      options.onSuccess?.(verification.url);

      return verification.url;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Upload failed');
      setError(error);
      options.onError?.(error);
      throw error;
    } finally {
      setIsUploading(false);
      setAbortController(null);
    }
  };

  const cancel = () => {
    abortController?.abort();
    setIsUploading(false);
    setProgress(0);
  };

  return {
    upload,
    isUploading,
    progress,
    error,
    cancel,
  };
}
```

**Acceptance Criteria**:
- ✅ Encapsulates all 3-step upload logic
- ✅ Provides progress tracking
- ✅ Supports cancellation
- ✅ Returns upload URL
- ✅ Handles errors gracefully
- ✅ Reusable across modules

---

### Phase 2: Update Upload Helper with Validation (Priority: HIGH)

**File**: `src/lib/utils/upload-helpers.ts`

**Changes**:
```typescript
export async function uploadFileResumable(
  file: File,
  session: UploadSession,
  onProgress?: UploadProgressCallback,
  signal?: AbortSignal // Add cancellation support
): Promise<void> {
  // ✅ ADD: Input validation
  if (!(file instanceof File)) {
    throw new Error('Invalid file: Expected File object');
  }

  if (!session || typeof session !== 'object') {
    throw new Error('Invalid session: Expected UploadSession object');
  }

  if (!session.sessionUrl || typeof session.sessionUrl !== 'string') {
    throw new Error('Invalid session: Missing or invalid sessionUrl');
  }

  if (!session.chunkSize || session.chunkSize <= 0) {
    throw new Error('Invalid session: chunkSize must be positive');
  }

  if (file.size === 0) {
    throw new Error('Cannot upload empty file');
  }

  // ✅ ADD: Cancellation support
  if (signal?.aborted) {
    throw new Error('Upload cancelled');
  }

  const { sessionUrl, chunkSize } = session;
  const totalChunks = Math.ceil(file.size / chunkSize);
  let uploadedBytes = 0;

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    // ✅ ADD: Check for cancellation
    if (signal?.aborted) {
      throw new Error('Upload cancelled');
    }

    const start = chunkIndex * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);

    // ✅ ADD: Retry logic
    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
      try {
        const response = await fetch(sessionUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/offset+octet-stream',
            'Content-Range': `bytes ${start}-${end - 1}/${file.size}`,
            'Upload-Offset': start.toString(),
            'Tus-Resumable': '1.0.0',
          },
          body: chunk,
          signal, // Pass cancellation signal to fetch
        });

        if (!response.ok) {
          throw new Error(`Chunk upload failed: ${response.statusText}`);
        }

        break; // Success, exit retry loop
      } catch (error) {
        retries++;
        if (retries === maxRetries) {
          throw new Error(`Chunk upload failed after ${maxRetries} retries`);
        }
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
      }
    }

    uploadedBytes = end;
    const percent = Math.round((uploadedBytes / file.size) * 100);
    onProgress?.(percent, uploadedBytes, file.size);
  }
}

// ✅ ADD: Validation utility
export function validateFileForUpload(
  file: File,
  options: {
    maxSize?: number;
    allowedTypes?: string[];
  } = {}
): { valid: boolean; error?: string } {
  if (!(file instanceof File)) {
    return { valid: false, error: 'Invalid file object' };
  }

  if (file.size === 0) {
    return { valid: false, error: 'File is empty' };
  }

  if (options.maxSize && file.size > options.maxSize) {
    const maxMB = Math.round(options.maxSize / 1024 / 1024);
    return { valid: false, error: `File size exceeds ${maxMB}MB limit` };
  }

  if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
    return { valid: false, error: 'File type not allowed' };
  }

  return { valid: true };
}
```

**Acceptance Criteria**:
- ✅ Validates all inputs
- ✅ Supports cancellation via AbortSignal
- ✅ Implements retry logic with exponential backoff
- ✅ Clear error messages
- ✅ No console.log statements

---

### Phase 3: Fix CORS Security Issue (Priority: HIGH)

**File**: `src/lib/storage/gcs/client.ts`

**Changes**:
```typescript
export async function initiateResumableUpload(
  params: InitiateUploadParams
): Promise<UploadSession> {
  const storage = getGCSClient();
  const bucketInstance = storage.bucket(params.bucket);
  const filePath = `${params.path}/${params.fileName}`;
  const fileRef = bucketInstance.file(filePath);

  // ✅ FIX: Restrict CORS to specific origins
  const allowedOrigins = process.env.NEXT_PUBLIC_ALLOWED_ORIGINS?.split(',') || [];

  if (allowedOrigins.length === 0) {
    logger.warn('No allowed origins configured for GCS uploads');
  }

  const [sessionUrl] = await fileRef.createResumableUpload({
    metadata: {
      contentType: params.contentType,
      metadata: {
        ...params.metadata,
        uploadedAt: new Date().toISOString(),
      },
    },
    // ✅ FIX: Use specific origins instead of wildcard
    origin: allowedOrigins[0] || undefined, // Use first allowed origin or undefined
  });

  return {
    uploadId: crypto.randomUUID(),
    sessionUrl,
    chunkSize: DEFAULT_CHUNK_SIZES.GCS,
    expiresAt: new Date(Date.now() + SESSION_EXPIRATION_MS),
    finalPath: filePath,
    bucket: params.bucket,
  };
}
```

**Environment Variable**:
```env
# .env.local
NEXT_PUBLIC_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

**Acceptance Criteria**:
- ✅ CORS restricted to specific origins
- ✅ Fallback to undefined if no origins configured
- ✅ Logs warning if origins missing

---

### Phase 4: Remove Production Console Statements (Priority: HIGH)

**Files to Update**:
1. `src/modules/links/components/forms/CreateLinkForm.tsx` (8 instances)
2. `src/lib/utils/upload-helpers.ts` (5 instances)
3. `src/modules/links/lib/actions/branding.actions.ts` (2 instances)

**Pattern**: Replace with proper logger or remove entirely

```typescript
// ❌ BEFORE
console.log("✅ Upload completed successfully");
console.error("❌ Upload failed:", error);

// ✅ AFTER (if logging needed)
import { logger } from '@/lib/utils/logger';
logger.info("Upload completed successfully", { uploadId, url });
logger.error("Upload failed", { error: error.message, uploadId });

// ✅ AFTER (if not needed)
// Remove entirely
```

**Acceptance Criteria**:
- ✅ Zero console.* statements in production code
- ✅ Use logger for important events only
- ✅ No performance overhead

---

### Phase 5: Update Form Components to Use Hook (Priority: CRITICAL)

**File**: `src/modules/links/components/forms/CreateLinkForm.tsx`

**Changes**:
```typescript
import { useFileUpload } from '@/hooks';

export function CreateLinkForm({ onCancel, onSuccess }: CreateLinkFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  const createLink = useCreateLink();

  // ✅ NEW: Use orchestration hook
  const logoUpload = useFileUpload({
    bucket: BRANDING_BUCKET_NAME,
    onSuccess: (url) => {
      setLoadingMessage("");
    },
    onError: (error) => {
      logger.error("Logo upload failed", { error: error.message });
    },
  });

  const handleFormSubmit = async (data: CreateLinkFormData) => {
    setIsSubmitting(true);
    setLoadingMessage("Creating your link...");

    try {
      // Create link
      const link = await createLink.mutateAsync(input);

      // Upload logo if provided
      if (data.brandingEnabled && data.logo.length > 0) {
        const logoFile = data.logo[0].file as File;

        setLoadingMessage("Uploading logo...");

        // ✅ SIMPLIFIED: Single hook call replaces 50+ lines
        await logoUpload.upload(logoFile, {
          path: generateBrandingPath(workspace.id, link.id),
          metadata: {
            workspaceId: workspace.id,
            linkId: link.id,
            originalFileName: logoFile.name,
          },
        });
      }

      setIsSubmitting(false);
      setLoadingMessage("");
      onSuccess?.(link);
    } catch (error) {
      setIsSubmitting(false);
      setLoadingMessage("");
    }
  };

  return (
    <>
      <MultiStepLoader
        loading={isSubmitting || logoUpload.isUploading}
        message={loadingMessage}
      />

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(handleFormSubmit)}>
          {/* ... form fields ... */}

          {logoUpload.isUploading && (
            <Progress percent={logoUpload.progress} />
          )}

          <FormActions onCancel={onCancel} isLoading={isSubmitting || logoUpload.isUploading} />
        </form>
      </FormProvider>
    </>
  );
}
```

**Acceptance Criteria**:
- ✅ Form logic reduced from 50+ lines to ~10 lines
- ✅ Progress tracking integrated
- ✅ Error handling delegated to hook
- ✅ Easy to add cancellation button

---

### Phase 6: Add Error Recovery Patterns (Priority: HIGH)

**File**: `src/hooks/utility/use-file-upload.ts`

**Enhancements**:
```typescript
export function useFileUpload(options: UseFileUploadOptions) {
  // ... existing state ...
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const upload = async (file: File, uploadOptions: UploadOptions): Promise<string> => {
    try {
      setIsUploading(true);
      setProgress(0);
      setError(null);

      // ✅ ADD: Session expiration check
      const session = await initiateResumableUpload({
        fileName: file.name,
        fileSize: file.size,
        contentType: file.type,
        bucket: options.bucket,
        path: uploadOptions.path,
        metadata: uploadOptions.metadata,
      });

      // Check if session is expired
      if (new Date() > session.expiresAt) {
        throw new Error('Upload session expired before upload started');
      }

      // ✅ ADD: Upload with interruption recovery
      await uploadFileResumable(file, session, onProgress, controller.signal);

      // ✅ ADD: Verify upload with retry
      let verification;
      let verifyRetries = 0;

      while (verifyRetries < 3) {
        verification = await verifyUpload({
          uploadId: session.uploadId,
          bucket: options.bucket,
          path: session.finalPath,
        });

        if (verification.success) break;

        verifyRetries++;
        await new Promise(resolve => setTimeout(resolve, 1000 * verifyRetries));
      }

      if (!verification?.success) {
        // ✅ ADD: Cleanup orphaned file
        try {
          await deleteFile({
            gcsPath: session.finalPath,
            bucket: options.bucket,
          });
        } catch (cleanupError) {
          logger.warn('Failed to cleanup orphaned file', { path: session.finalPath });
        }
        throw new Error('Upload verification failed after retries');
      }

      setProgress(100);
      options.onSuccess?.(verification.url);

      return verification.url;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Upload failed');

      // ✅ ADD: Retry logic for transient errors
      if (retryCount < maxRetries && isTransientError(error)) {
        setRetryCount(prev => prev + 1);
        await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1)));
        return upload(file, uploadOptions); // Recursive retry
      }

      setError(error);
      options.onError?.(error);
      throw error;
    } finally {
      setIsUploading(false);
      setAbortController(null);
    }
  };

  return { upload, isUploading, progress, error, cancel, retryCount };
}

// ✅ ADD: Transient error detection
function isTransientError(error: Error): boolean {
  const transientMessages = [
    'network error',
    'timeout',
    'ECONNRESET',
    'ETIMEDOUT',
    'socket hang up',
  ];

  return transientMessages.some(msg =>
    error.message.toLowerCase().includes(msg)
  );
}
```

**Acceptance Criteria**:
- ✅ Handles session expiration
- ✅ Retries transient errors
- ✅ Cleans up orphaned files
- ✅ Exponential backoff for retries

---

### Phase 7: Design Batch Upload Support (Priority: HIGH)

**File**: `src/hooks/utility/use-file-upload.ts`

**Enhancement**: Add batch upload capability

```typescript
interface UseFileUploadReturn {
  upload: (file: File, options: UploadOptions) => Promise<string>;
  uploadBatch: (files: File[], options: UploadOptions) => Promise<string[]>; // ✅ NEW
  isUploading: boolean;
  progress: number; // Aggregate progress for batch
  batchProgress: Record<string, number>; // ✅ NEW: Per-file progress
  error: Error | null;
  cancel: () => void;
}

export function useFileUpload(options: UseFileUploadOptions) {
  // ... existing state ...
  const [batchProgress, setBatchProgress] = useState<Record<string, number>>({});

  // ✅ NEW: Batch upload with parallel execution
  const uploadBatch = async (
    files: File[],
    uploadOptions: UploadOptions
  ): Promise<string[]> => {
    try {
      setIsUploading(true);
      setError(null);
      setBatchProgress({});

      // Initialize progress for each file
      const initialProgress = files.reduce((acc, file, index) => {
        acc[`file-${index}`] = 0;
        return acc;
      }, {} as Record<string, number>);
      setBatchProgress(initialProgress);

      // Upload files in parallel (max 3 concurrent)
      const maxConcurrent = 3;
      const results: string[] = [];

      for (let i = 0; i < files.length; i += maxConcurrent) {
        const batch = files.slice(i, i + maxConcurrent);

        const batchPromises = batch.map(async (file, batchIndex) => {
          const fileIndex = i + batchIndex;
          const fileKey = `file-${fileIndex}`;

          const session = await initiateResumableUpload({
            fileName: file.name,
            fileSize: file.size,
            contentType: file.type,
            bucket: options.bucket,
            path: `${uploadOptions.path}/${file.name}`,
            metadata: uploadOptions.metadata,
          });

          await uploadFileResumable(
            file,
            session,
            (percent) => {
              setBatchProgress(prev => ({
                ...prev,
                [fileKey]: percent,
              }));

              // Update aggregate progress
              const totalProgress = Object.values({
                ...prev,
                [fileKey]: percent,
              }).reduce((sum, p) => sum + p, 0) / files.length;
              setProgress(Math.round(totalProgress));
            },
            controller.signal
          );

          const verification = await verifyUpload({
            uploadId: session.uploadId,
            bucket: options.bucket,
            path: session.finalPath,
          });

          if (!verification.success) {
            throw new Error(`Failed to upload ${file.name}`);
          }

          return verification.url;
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      }

      setProgress(100);
      options.onSuccess?.(results[0]); // Call with first URL for backwards compat

      return results;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Batch upload failed');
      setError(error);
      options.onError?.(error);
      throw error;
    } finally {
      setIsUploading(false);
      setAbortController(null);
    }
  };

  return {
    upload,
    uploadBatch, // ✅ NEW
    isUploading,
    progress,
    batchProgress, // ✅ NEW
    error,
    cancel,
  };
}
```

**Acceptance Criteria**:
- ✅ Supports batch uploads
- ✅ Parallel execution (max 3 concurrent)
- ✅ Per-file progress tracking
- ✅ Aggregate progress calculation
- ✅ Cancellation affects all uploads
- ✅ Backwards compatible with single upload

---

### Phase 8: Update Module Exports (Priority: MEDIUM)

**File**: `src/hooks/index.ts`

```typescript
// ✅ ADD: Export new utility hook
export { useFileUpload } from './utility/use-file-upload';
```

**File**: `src/modules/links/lib/actions/branding.actions.ts`

**Changes**: Remove unused actions after hook refactor

```typescript
// ❌ REMOVE: These are now internal to useFileUpload hook
// export const initiateBrandingLogoUploadAction = ...
// export const completeBrandingLogoUploadAction = ...

// ✅ KEEP: Still needed for direct logo management
export const updateLinkBrandingAction = ...
export const deleteBrandingLogoAction = ...
```

**File**: `src/modules/links/hooks/use-link-branding.ts`

```typescript
// ❌ REMOVE: No longer needed, replaced by useFileUpload
// export function useInitiateBrandingLogoUpload() { ... }
// export function useCompleteBrandingLogoUpload() { ... }

// ✅ KEEP: Still needed for branding management
export function useUpdateLinkBranding() { ... }
export function useDeleteBrandingLogo() { ... }
```

**File**: `src/modules/links/index.ts`

```typescript
// ❌ REMOVE: No longer exported
// initiateBrandingLogoUploadAction,
// completeBrandingLogoUploadAction,
// useInitiateBrandingLogoUpload,
// useCompleteBrandingLogoUpload,
```

**Acceptance Criteria**:
- ✅ Clean module exports
- ✅ No unused actions/hooks
- ✅ Type checks pass

---

### Phase 9: Run Type Checks (Priority: HIGH)

**Command**: `npm run type-check`

**Expected Result**: 0 errors

**If Errors Found**:
1. Fix import paths
2. Update type definitions
3. Verify all consumers updated
4. Re-run type check

**Acceptance Criteria**:
- ✅ 0 TypeScript errors
- ✅ All imports resolve correctly
- ✅ No `any` types introduced

---

### Phase 10: Update Tests (Priority: DEPRIORITIZED)

**User Request**: "Except for the tests, the tests we will leave them for last"

**Files to Update** (LATER):
1. `src/modules/links/lib/actions/__tests__/branding.actions.test.ts` (12 failing tests)
2. `src/lib/utils/__tests__/upload-helpers.test.ts` (NEW - missing coverage)
3. `src/hooks/utility/__tests__/use-file-upload.test.ts` (NEW - missing coverage)

**Test Coverage Targets**:
- Upload helper: Input validation, chunking, retry logic, cancellation
- File upload hook: Orchestration, progress tracking, error recovery, batch uploads
- Branding actions: Keep existing tests, remove references to deleted actions

**Acceptance Criteria** (LATER):
- ✅ All tests passing
- ✅ >80% code coverage for new utilities
- ✅ Integration tests for upload flow

---

## File Changes Map

### Files to CREATE:
1. ✅ `src/hooks/utility/use-file-upload.ts` - Orchestration hook
2. ✅ `docs/STORAGE_REFACTOR_PLAN.md` - This document

### Files to MODIFY:
1. ✅ `src/lib/utils/upload-helpers.ts` - Add validation, retry, cancellation
2. ✅ `src/lib/storage/gcs/client.ts` - Fix CORS security
3. ✅ `src/modules/links/components/forms/CreateLinkForm.tsx` - Use new hook
4. ✅ `src/hooks/index.ts` - Export new hook
5. ✅ `src/modules/links/lib/actions/branding.actions.ts` - Remove console.log
6. ❌ `src/modules/links/hooks/use-link-branding.ts` - Remove unused hooks
7. ❌ `src/modules/links/index.ts` - Update exports

### Files to CONSIDER REMOVING:
- None (we keep infrastructure, remove only exports)

### Environment Variables to ADD:
```env
NEXT_PUBLIC_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

---

## Testing Strategy

### Manual Testing Checklist:

**Single File Upload**:
1. [ ] Upload small file (<1MB) → Success
2. [ ] Upload large file (>50MB) → Success with progress
3. [ ] Cancel during upload → Aborts cleanly
4. [ ] Network interruption → Retries successfully
5. [ ] Invalid file type → Shows error
6. [ ] File too large → Shows error

**Batch Upload**:
1. [ ] Upload 5 files → All succeed
2. [ ] Upload 10 files → Max 3 concurrent
3. [ ] Cancel batch → Aborts all
4. [ ] One file fails → Others continue
5. [ ] Per-file progress → Updates correctly
6. [ ] Aggregate progress → Calculates correctly

**Error Recovery**:
1. [ ] Session expires → Shows error
2. [ ] Upload interrupted → Retries automatically
3. [ ] Verification fails → Cleans up file
4. [ ] Transient error → Retries 3x then fails
5. [ ] Non-transient error → Fails immediately

**Security**:
1. [ ] CORS policy → Only allowed origins
2. [ ] Invalid session → Blocked
3. [ ] Expired session → Shows error

---

## Rollback Plan

If issues arise during refactoring:

### Quick Rollback (Emergency):
```bash
git checkout v2/link-module
git reset --hard <commit-before-refactor>
```

### Partial Rollback:
1. Revert `use-file-upload.ts` changes
2. Restore old action/hook pattern in `CreateLinkForm.tsx`
3. Re-export deleted actions/hooks
4. Run type check to verify

### Zero-Downtime Strategy:
1. Keep both old and new patterns temporarily
2. Add feature flag: `USE_NEW_UPLOAD_FLOW`
3. Test new flow in staging
4. Gradually migrate forms one at a time
5. Remove old pattern after all consumers migrated

---

## Success Criteria

Before considering refactor COMPLETE:

- ✅ All 6 HIGH/CRITICAL issues resolved
- ✅ `useFileUpload` hook implemented and tested
- ✅ All forms using new hook pattern
- ✅ CORS security fixed
- ✅ Input validation added
- ✅ Error recovery patterns implemented
- ✅ Batch upload support added
- ✅ Zero console.log statements in production
- ✅ Type checks pass (0 errors)
- ❌ Tests updated (DEPRIORITIZED per user)
- ✅ Tech Lead approval

---

## Timeline Estimate

| Phase | Task | Time Estimate |
|-------|------|---------------|
| 1 | Create orchestration hook | 30 minutes |
| 2 | Update upload helper | 20 minutes |
| 3 | Fix CORS security | 10 minutes |
| 4 | Remove console statements | 15 minutes |
| 5 | Update form components | 20 minutes |
| 6 | Add error recovery | 30 minutes |
| 7 | Design batch upload | 40 minutes |
| 8 | Update exports | 10 minutes |
| 9 | Run type checks | 5 minutes |
| **Total** | | **~3 hours** |

**Test Updates** (LATER): +2 hours

---

## Next Steps

1. ✅ Review this refactoring plan
2. ⏳ Run `code-simplifier` agent to execute plan
3. ⏳ Verify type checks pass after each phase
4. ⏳ Manual testing of upload flows
5. ⏳ Tech Lead final approval
6. ❌ Update tests (deprioritized per user)

---

## References

- **Agent Reports**: Code Reviewer + Tech Lead analysis (previous messages)
- **Codebase Structure**: `CLAUDE.md` - Hook organization patterns
- **Existing Patterns**: `src/hooks/utility/use-data-state.ts` - State machine pattern
- **Storage Abstraction**: `src/lib/storage/client.ts` - Provider-agnostic API
- **Validation Helpers**: `src/lib/utils/validation-helpers.ts` - Input validation patterns
