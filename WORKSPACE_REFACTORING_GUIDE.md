# Workspace Feature Refactoring Guide

## Overview
This guide documents the refactoring strategy to eliminate redundant quota checks and validation logic in the workspace feature by leveraging existing centralized services.

## Centralized Services Available

### 1. StorageQuotaService (`src/lib/services/storage/storage-quota-service.ts`)
- **checkUserQuota(userId, fileSize, clientIp?)** - Complete quota validation with rate limiting
- **getUserStorageInfo(userId)** - Get storage metrics without validation
- **updateUserStorageUsage(userId, bytes, useBackground?)** - Update storage with background processing

### 2. Storage Actions (`src/lib/actions/storage-actions.ts`)
- **getUserStorageInfoAction()** - Server action for storage info
- **checkUserQuotaAction(fileSize, clientIp?)** - Server action for quota checks

### 3. File System Services
- **FileService** (`src/lib/services/file-system/file-service.ts`) - File CRUD operations
- **FolderService** (`src/lib/services/file-system/folder-service.ts`) - Folder management

## Completed Refactoring Steps

### ✅ 1. Created Missing Validation Actions
**File**: `src/features/workspace/lib/actions/validation-actions.ts`
- `validateMultipleFilesAction(fileSizes[])` - Batch file validation
- `checkFileUploadQuotaAction(fileSize, clientIp?)` - Single file quota check

These actions use the centralized `StorageQuotaService` instead of duplicating logic.

### ✅ 2. Enhanced Storage Actions
**File**: `src/lib/actions/storage-actions.ts`
- Added `checkUserQuotaAction()` for centralized quota checking

### ✅ 3. Updated Exports
**File**: `src/features/workspace/lib/actions/index.ts`
- Exported new validation actions for use in workspace hooks

## Next Refactoring Steps

### Phase 1: Remove Redundant Quota Checks

#### 1.1 Update `file-actions.ts`
Replace direct quota checks with centralized service calls:

```typescript
// BEFORE (line 552):
const uploadResult = await storageService.uploadFileWithQuotaCheck(...)

// AFTER:
import { checkUserQuotaAction } from '@/lib/actions/storage-actions';

// Check quota first using centralized service
const quotaCheck = await checkUserQuotaAction(file.size, clientIp);
if (!quotaCheck.success || !quotaCheck.data?.allowed) {
  return createErrorResponse(quotaCheck.data?.message || 'Quota exceeded');
}

// Then upload without redundant checks
const uploadResult = await storageService.uploadFile(...);
```

#### 1.2 Fix Hardcoded Plan References
Search for `'free'` hardcoded references and replace with dynamic plan fetching:

```typescript
// BEFORE:
const plan = 'free'; // TODO: Get from user subscription

// AFTER:
const storageInfo = await getUserStorageInfoAction();
const plan = storageInfo.data?.plan || 'free';
```

### Phase 2: Simplify Hooks

#### 2.1 Refactor `use-file-upload.ts`
Break down the 977-line hook into focused responsibilities:

```typescript
// NEW: use-file-selection.ts
export function useFileSelection() {
  // Only file selection and drag-drop logic
}

// NEW: use-upload-processor.ts
export function useUploadProcessor() {
  // Only upload processing and retry logic
}

// NEW: use-upload-validation.ts
export function useUploadValidation() {
  // Use validateMultipleFilesAction
  const validate = useCallback(async (files: File[]) => {
    const sizes = files.map(f => f.size);
    return validateMultipleFilesAction(sizes);
  }, []);
  
  return { validate };
}
```

#### 2.2 Update `use-pre-upload-validation.ts`
The hook now works correctly with the new `validateMultipleFilesAction`.

### Phase 3: Component Cleanup

#### 3.1 Move Business Logic from Components
Extract business logic from `workspace-container.tsx`:

```typescript
// BEFORE: Complex logic in component
const result = await createFolderAction(folderName.trim(), item.id);
if (result.success && result.data) {
  if (treeInstance?.addFolderToTree) {
    treeInstance.addFolderToTree(result.data);
  }
  // Notification logic...
}

// AFTER: Use a dedicated action
const result = await createAndAddFolderAction(folderName, item.id);
// Component only handles UI updates
```

### Phase 4: Service Layer Integration

#### 4.1 Use Dependency Injection
Instead of instantiating services in actions:

```typescript
// BEFORE:
const fileService = new FileService();

// AFTER: Create singleton instances
import { fileService } from '@/lib/services/file-system';
```

#### 4.2 Create Service Index Files
```typescript
// src/lib/services/index.ts
export { storageQuotaService } from './storage/storage-quota-service';
export { fileService } from './file-system/file-service';
export { folderService } from './file-system/folder-service';
```

## Benefits of This Refactoring

### 1. **Eliminated Redundancy**
- Single source of truth for quota validation
- No duplicate storage calculations
- Consistent error messages

### 2. **Improved Performance**
- Fewer database queries
- Background processing for non-critical updates
- Better caching through centralized services

### 3. **Enhanced Maintainability**
- Clear separation of concerns
- Easier to update quota rules
- Better testability

### 4. **Consistent Security**
- Rate limiting applied uniformly
- Plan verification in one place
- Audit logging centralized

## Testing Checklist

After refactoring, verify:

- [ ] File uploads respect quota limits
- [ ] Multiple file validation works correctly
- [ ] Storage usage updates properly
- [ ] Rate limiting prevents abuse
- [ ] Error messages are consistent
- [ ] Background updates process correctly
- [ ] Plan limits are enforced properly

## Migration Path

1. **Week 1**: Implement validation actions and update critical paths
2. **Week 2**: Refactor hooks and remove redundant checks
3. **Week 3**: Clean up components and complete service integration
4. **Week 4**: Testing and optimization

## Notes

- The `StorageQuotaService` already integrates with Clerk for billing
- Background storage updates improve performance
- Rate limiting is built into the quota service
- All quota checks now go through a single service