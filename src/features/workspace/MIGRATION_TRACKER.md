# Workspace Upload Service Migration Tracker

## Overview
This document tracks the migration of the workspace feature from custom upload logic to the centralized upload service. The migration will be done in phases to minimize risk and ensure all functionality is preserved.

## Current State Analysis

### Files to Migrate
- **use-file-upload.ts** (830 lines) - Custom XMLHttpRequest upload logic
- **file-upload-area.tsx** (481 lines) - Already replaced by CentralizedFileUpload
- **upload-progress.tsx** - Redundant progress tracking
- **upload-validation.tsx** - Duplicate validation logic

### Critical Integration Points to Preserve
1. **File Tree Callback**: `onFileUploaded={treeInstance?.addFileToTree}`
2. **Drag & Drop State**: `droppedFiles` state pattern in workspace-container.tsx
3. **Storage Tracking**: `useLiveStorage` and `useStorageTracking` hooks
4. **Modal State Management**: Workspace modal store integration
5. **Notifications**: Upload progress and completion notifications

## Migration Phases

### Phase 1: Extend UploadManager with Batch Support ⏳
**Status**: Not Started  
**Estimated Time**: 2-3 hours  
**Risk Level**: Low

**Tasks**:
- [ ] Add `uploadBatch` method to UploadManager
- [ ] Implement concurrent upload control
- [ ] Add batch progress tracking
- [ ] Add individual file callbacks (onProgress, onComplete, onError)
- [ ] Test batch upload with different file counts

**Files to Modify**:
- `src/lib/services/upload/upload-manager.ts`
- `src/lib/services/upload/types.ts` (add batch types)

### Phase 2: Create Adapter Hook ⏳
**Status**: Not Started  
**Estimated Time**: 4-6 hours  
**Risk Level**: Medium

**Tasks**:
- [ ] Create `use-workspace-upload.ts` adapter hook
- [ ] Map existing UploadFile interface to new service
- [ ] Implement file preview generation for images
- [ ] Connect with live storage tracking
- [ ] Handle validation through centralized service
- [ ] Implement retry logic wrapper
- [ ] Add abort/cancel functionality

**Files to Create**:
- `src/features/workspace/hooks/use-workspace-upload.ts`

**Dependencies**:
- Requires Phase 1 completion
- Must maintain compatibility with existing UploadFile type

### Phase 3: Update Upload Modal ⏳
**Status**: Not Started  
**Estimated Time**: 1-2 hours  
**Risk Level**: Low

**Tasks**:
- [ ] Replace `useFileUpload` import with `useWorkspaceUpload`
- [ ] Verify all props are properly mapped
- [ ] Test initial files handling (drag & drop)
- [ ] Verify storage quota warnings still work
- [ ] Test upload progress display

**Files to Modify**:
- `src/features/workspace/components/modals/upload-modal.tsx`

### Phase 4: Integration Testing ⏳
**Status**: Not Started  
**Estimated Time**: 3-4 hours  
**Risk Level**: Medium

**Test Scenarios**:
- [ ] Single file upload
- [ ] Batch file upload (10+ files)
- [ ] Large file upload with chunking
- [ ] Upload cancellation
- [ ] Network error recovery
- [ ] Storage quota exceeded
- [ ] File tree update after upload
- [ ] Drag & drop from desktop
- [ ] Drag & drop within tree
- [ ] Upload progress notifications
- [ ] Live storage tracking updates

**Integration Points to Verify**:
- [ ] File tree receives uploaded files correctly
- [ ] Storage usage updates in real-time
- [ ] Notifications appear and dismiss properly
- [ ] Modal closes after successful upload
- [ ] Query invalidation triggers refresh

### Phase 5: Cleanup & Optimization ⏳
**Status**: Not Started  
**Estimated Time**: 2-3 hours  
**Risk Level**: Low

**Tasks**:
- [ ] Delete `use-file-upload.ts`
- [ ] Delete unused upload components
- [ ] Remove redundant types and interfaces
- [ ] Update imports throughout workspace feature
- [ ] Add deprecation notices to old code (temporary)
- [ ] Update workspace feature documentation

**Files to Delete**:
- `src/features/workspace/hooks/use-file-upload.ts`
- `src/features/workspace/components/upload/file-upload-area.tsx`
- `src/features/workspace/components/upload/upload-progress.tsx`

## Implementation Details

### Batch Upload Method Structure
```typescript
interface BatchUploadOptions extends UploadOptions {
  onProgress?: (fileId: string, progress: number) => void;
  onFileComplete?: (fileId: string, result: UploadResult) => void;
  onFileError?: (fileId: string, error: Error) => void;
  concurrency?: number;
}

uploadBatch(
  files: File[],
  context: UploadContext,
  options?: BatchUploadOptions
): Promise<Map<string, UploadResult>>
```

### Adapter Hook Interface
```typescript
interface UseWorkspaceUploadReturn {
  files: UploadFile[];
  isUploading: boolean;
  uploadValidation: ValidationResult | null;
  handleFileSelect: (files: FileList | File[] | null) => void;
  handleUpload: () => Promise<void>;
  handleRemoveFile: (fileId: string) => void;
  cancelUpload: (fileId: string) => void;
  cancelAllUploads: () => void;
  // Statistics
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  uploadProgress: number;
  // Storage
  storageInfo: StorageInfo;
  quotaStatus: QuotaStatus;
}
```

## Success Metrics

### Performance Improvements
- [ ] Upload time reduced by 20% (chunked uploads)
- [ ] Memory usage reduced (streaming vs buffering)
- [ ] Better retry success rate

### Code Quality
- [ ] 95% reduction in upload-related code
- [ ] Single source of truth for uploads
- [ ] Consistent error handling
- [ ] Type-safe throughout

### User Experience
- [ ] No regression in functionality
- [ ] Improved progress tracking
- [ ] Better error messages
- [ ] Smoother large file uploads

## Rollback Plan

If issues arise during migration:

1. **Phase 1-2**: No user impact, can abandon without effect
2. **Phase 3**: Keep old hook imported, switch back with single import change
3. **Phase 4**: Revert modal changes, restore old hook
4. **Phase 5**: Restore deleted files from git history

## Notes & Considerations

### Important Preservations
- The `onFileUploaded` callback MUST continue to work with file tree
- Preview URLs for images must be generated before upload
- Storage tracking must update in real-time during uploads
- Notification events must fire at correct times

### Known Challenges
1. The current XMLHttpRequest provides native progress - ensure chunked upload progress is smooth
2. Abort controllers need proper cleanup to prevent memory leaks
3. File validation happens client-side - must maintain same rules

### Future Enhancements (Post-Migration)
- Add upload queue visualization
- Implement pause/resume for large files
- Add bandwidth throttling options
- Create upload history view
- Add bulk retry for failed uploads

## Progress Log

### Week 1 (Current)
- ✅ Analyzed current implementation
- ✅ Identified redundant code
- ✅ Mapped integration points
- ✅ Created migration plan
- ⏳ Starting Phase 1 implementation

### Updates
- **2025-01-22**: Migration tracker created, analysis complete
- **Next Step**: Implement batch upload method in UploadManager

---

**Last Updated**: 2025-01-22  
**Migration Owner**: Development Team  
**Review Status**: Ready for implementation