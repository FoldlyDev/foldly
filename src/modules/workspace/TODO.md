# Workspace Module - Implementation TODO

**Last Updated:** 2025-10-29
**Status:** Planning Phase
**Branch:** `v2/workspace-module`

---

## 🎯 Module Scope

The Workspace Module is the **primary user interface** for file collection management. It provides:
- Folder management (CRUD, hierarchy, navigation)
- File management (listing, filtering, bulk operations)
- Dashboard with 3 views: Files (grid), By Email (grouped), By Date (chronological)
- Cross-folder search and email-based filtering

---

## 📋 Implementation Principles

**All code MUST adhere to these principles:**

1. **Proper separation of concerns** - Workspace, folders, and files are distinct entities with separate responsibilities
2. **Correct implementation of DRY principles** - Reuse existing utilities and patterns
3. **Minimal to no code duplication** - Extract shared logic into utilities
4. **Efficient use of shared/global elements** - Leverage `lib/`, `hooks/`, and `actions/`
5. **Strict type safety** - Avoid `any` types, use proper TypeScript inference
6. **Maintainability** - Code should be easy to understand and modify
7. **Scalability** - Patterns should support growth (1000+ files, 100+ folders)
8. **Overall stability** - Comprehensive error handling and validation

**Reference existing implementations:**
- Links Module: `src/lib/actions/link.actions.ts`, `src/hooks/data/use-links.ts`
- Permission Module: `src/lib/actions/permission.actions.ts`
- User Module: `src/lib/actions/user.actions.ts`, `src/lib/database/queries/user.queries.ts`
- Global utilities: `src/lib/utils/action-helpers.ts`, `src/lib/utils/react-query-helpers.ts`

---

## ✅ What Already Exists

### Database Schemas
- ✅ `folders` table (hierarchical, uploader tracking, link relationship)
- ✅ `files` table (metadata, uploader tracking, GCS path)
- ✅ `workspaces` table (1:1 with users)

### Related Modules (Complete)
- ✅ Links Module (7 actions, 18 tests)
- ✅ Permission System (4 actions, 23 tests)
- ✅ Storage Abstraction (Supabase + GCS, upload/delete/signed URLs)
- ✅ Email Service (5 actions, 32 tests)

### Workspace Infrastructure
- ✅ `workspace.queries.ts` (getUserWorkspace, createWorkspace, updateWorkspaceName)
- ✅ `workspace.actions.ts` (getUserWorkspaceAction, createUserWorkspaceAction)
- ✅ `use-user-workspace.ts` (useUserWorkspace, useCreateWorkspace hooks)

---

## 🚧 What Needs to Be Built

### 1. Database Queries Layer

#### `src/lib/database/queries/folder.queries.ts` ✅ COMPLETE
**Pattern:** Follow `link.queries.ts` structure (pure database operations, no auth)

- [x] `getFolderById(folderId: string)` - Get single folder with relations
- [x] `getRootFolders(workspaceId: string)` - Get workspace root folders (parentFolderId = NULL)
- [x] `getSubfolders(parentFolderId: string)` - Get child folders
- [x] `getFolderHierarchy(folderId: string)` - Get folder + all ancestors (breadcrumb)
- [x] `createFolder(data: NewFolder)` - Create folder (personal or linked)
- [x] `updateFolder(folderId: string, data: Partial<Folder>)` - Update folder name/parent
- [x] `deleteFolder(folderId: string)` - Delete folder (cascade handled by DB)
- [x] `isFolderNameAvailable(workspaceId: string, name: string, parentFolderId?: string)` - Check uniqueness
- [x] `getFolderDepth(folderId: string)` - Calculate folder nesting depth (for 20-level limit enforcement)

**Notes:**
- Workspace is responsible for querying its own folders (`getRootFolders` takes `workspaceId`)
- Folders are queried independently, not through workspace object
- Follow existing query patterns (typed returns, error handling)
- Maximum nesting depth: **20 levels** (enforced in validation, not database schema)

#### `src/lib/database/queries/file.queries.ts` ✅ COMPLETE
**Pattern:** Follow `link.queries.ts` structure

- [x] `getFileById(fileId: string)` - Get single file with metadata
- [x] `getFolderFiles(folderId: string)` - Get files in specific folder
- [x] `getWorkspaceFiles(workspaceId: string)` - Get all workspace files (cross-folder)
- [x] `getFilesByEmail(workspaceId: string, uploaderEmail: string)` - Email-filtered files
- [x] `getFilesByDateRange(workspaceId: string, startDate: Date, endDate?: Date)` - Chronological files
- [x] `searchFiles(workspaceId: string, query: string)` - Search by filename/email
- [x] `createFile(data: NewFile)` - Create file record after upload
- [x] `updateFileMetadata(fileId: string, data: Partial<File>)` - Update file metadata
- [x] `deleteFile(fileId: string)` - Delete file record
- [x] `bulkDeleteFiles(fileIds: string[])` - Batch delete

**Notes:**
- File queries are separate from folder queries (separation of concerns)
- Workspace-level queries take `workspaceId` parameter (workspace fetches its own files)
- Follow existing patterns for return types and error handling

---

### 2. Global Validation Schemas

#### `src/lib/validation/folder-schemas.ts` ✅ COMPLETE
**Pattern:** Follow `link-schemas.ts` structure, use `base-schemas.ts` builders

- [x] `createFolderSchema` - Validation for folder creation (name, parentFolderId, linkId)
- [x] `updateFolderSchema` - Validation for folder updates (name, parentFolderId)
- [x] Reuse `nameSchema` from base-schemas.ts for folder names
- [x] Folder name validation rules (1-255 chars, no special chars)
- [x] Use `VALIDATION_LIMITS.FOLDER.MAX_NESTING_DEPTH` (20) from `constants/validation.ts` for depth checks
- [x] Additional schemas: `moveFolderSchema`, `deleteFolderSchema`, `getFolderHierarchySchema`

#### `src/lib/validation/file-schemas.ts` ✅ COMPLETE
**Pattern:** Follow `link-schemas.ts` structure

- [x] `createFileSchema` - Validation for file metadata (filename, size, contentType, folderId)
- [x] `updateFileMetadataSchema` - Validation for file metadata updates
- [x] File size limits validation (per file, per workspace)
- [x] File type validation (MIME types)
- [x] Additional schemas: `deleteFileSchema`, `bulkDeleteFilesSchema`, `searchFilesSchema`, `getFilesByEmailSchema`

**Notes:**
- Global schemas go in `src/lib/validation/` (consumed by global actions)
- Module-specific form validation goes in `src/modules/workspace/lib/validation/`

---

### 3. Server Actions Layer

#### `src/lib/actions/folder.actions.ts` (NEW FILE)
**Pattern:** Follow `link.actions.ts` structure (withAuth, withAuthInput, formatActionError)

- [ ] `createFolderAction(input: CreateFolderInput)` - Auth + ownership verification + create
- [ ] `updateFolderAction(input: UpdateFolderInput)` - Auth + ownership verification + update
- [ ] `deleteFolderAction(folderId: string)` - Auth + ownership verification + cascade delete
- [ ] `moveFolderAction(folderId: string, newParentId: string | null)` - Auth + ownership verification + move
- [ ] `getRootFoldersAction()` - Auth + get user workspace folders
- [ ] `getFolderHierarchyAction(folderId: string)` - Auth + ownership verification + get breadcrumb

**Notes:**
- Use `withAuth` HOF from `action-helpers.ts`
- Use `verifyResourceOwnership` from `authorization.ts`
- Follow existing error message patterns from `error-messages.ts`
- Rate limiting where appropriate (create/update/delete)
- **Depth validation**: `createFolderAction` and `moveFolderAction` must check parent depth ≤ 20 before allowing operation

#### `src/lib/actions/file.actions.ts` (NEW FILE)
**Pattern:** Follow `link.actions.ts` structure

- [ ] `createFileRecordAction(input: CreateFileInput)` - Auth + create file record after storage upload
- [ ] `deleteFileAction(fileId: string)` - Auth + ownership verification + delete from storage + delete record
- [ ] `bulkDeleteFilesAction(fileIds: string[])` - Auth + ownership verification + batch delete
- [ ] `getWorkspaceFilesAction(view: 'all' | 'byEmail' | 'byDate', filters?: FileFilters)` - Auth + get files with filtering
- [ ] `searchFilesAction(query: string)` - Auth + cross-folder search

**Notes:**
- File delete must trigger storage deletion (use storage client)
- Ownership verification on all mutations
- Follow existing action patterns (ActionResult return type)

#### `src/lib/actions/workspace.actions.ts` (EXTEND EXISTING)
**Current:** getUserWorkspaceAction, createUserWorkspaceAction

- [ ] `getWorkspaceStatsAction()` - Auth + aggregate stats (total files, storage used, active links)
- [ ] `getRecentActivityAction(limit?: number)` - Auth + get recent file uploads

**Notes:**
- Workspace is responsible for fetching workspace-level aggregations
- Use existing workspace queries + extend with new stats queries

---

### 4. React Query Hooks Layer

#### `src/hooks/data/use-folders.ts` (NEW FILE)
**Pattern:** Follow `use-links.ts` structure (transformQueryResult, transformActionError, createMutationErrorHandler)

- [ ] `useRootFolders()` - Query hook for workspace root folders
- [ ] `useFolderHierarchy(folderId: string)` - Query hook for folder breadcrumb
- [ ] `useCreateFolder()` - Mutation hook for folder creation
- [ ] `useUpdateFolder()` - Mutation hook for folder updates
- [ ] `useDeleteFolder()` - Mutation hook for folder deletion
- [ ] `useMoveFolder()` - Mutation hook for folder move

**Notes:**
- Import query keys from `src/lib/config/query-keys.ts` (centralized keys)
- Use `transformQueryResult` and `transformActionError` from `react-query-helpers.ts`
- Follow existing invalidation patterns (invalidate parent queries on mutations)
- Toast notifications on success/error using `createMutationErrorHandler`

#### `src/hooks/data/use-files.ts` (NEW FILE)
**Pattern:** Follow `use-links.ts` structure

- [ ] `useWorkspaceFiles(view: 'all' | 'byEmail' | 'byDate', filters?: FileFilters)` - Query hook for files with view switching
- [ ] `useSearchFiles(query: string)` - Query hook for file search
- [ ] `useDeleteFile()` - Mutation hook for file deletion
- [ ] `useBulkDeleteFiles()` - Mutation hook for batch deletion

**Notes:**
- Use centralized query keys from `query-keys.ts`
- Follow existing React Query patterns (caching, invalidation)
- File upload handled by storage module (`use-uppy-upload.ts`)

#### `src/hooks/data/use-workspace.ts` (EXTEND EXISTING - rename from use-user-workspace.ts)
**Current:** useUserWorkspace, useCreateWorkspace

- [ ] `useWorkspaceStats()` - Query hook for workspace stats
- [ ] `useRecentActivity(limit?: number)` - Query hook for recent activity feed

**Notes:**
- Rename `use-user-workspace.ts` → `use-workspace.ts` for consistency
- Workspace hooks fetch workspace-level data (stats, activity)

#### `src/lib/config/query-keys.ts` ✅ COMPLETE
**Add centralized query keys:**

- [x] `folderKeys` - Folder query key factory (all, lists, roots, subfolders, details, detail, hierarchy)
- [x] `fileKeys` - File query key factory (all, lists, workspace, folder, byEmail, byDate, search, details, detail)
- [x] `workspaceKeys` - Workspace query key factory (all, detail, stats, recentActivity)

**Pattern:**
```typescript
export const folderKeys = {
  all: ['folders'] as const,
  roots: (workspaceId: string) => [...folderKeys.all, 'roots', workspaceId] as const,
  hierarchy: (folderId: string) => [...folderKeys.all, 'hierarchy', folderId] as const,
} as const;
```

---

### 5. Workspace Module Components

#### Views (`src/modules/workspace/components/views/`)
**Pattern:** Follow `src/modules/links/components/views/` structure

- [ ] `WorkspaceDashboard.tsx` - Main dashboard with tab navigation, search bar, quick stats
- [ ] `FilesView.tsx` - Google Drive-style grid (root folders + files)
- [ ] `ByEmailView.tsx` - Files grouped by uploader email (expandable sections)
- [ ] `ByDateView.tsx` - Chronological file list (grouped by date ranges)

**Notes:**
- Use data hooks (`useWorkspaceFiles`, `useRootFolders`, etc.)
- Tab state managed by module-specific hook (`use-workspace-view.ts`)
- Follow existing view patterns (error boundaries, loading states)

#### Sections (`src/modules/workspace/components/sections/`)
**Pattern:** Follow `src/modules/links/components/sections/` structure

- [ ] `FolderGrid.tsx` - Grid layout component for folders/files
- [ ] `FolderDetails.tsx` - Sidebar details panel (name, size, access, actions)
- [ ] `SearchBar.tsx` - Search input with filters
- [ ] `QuickStats.tsx` - Stats cards (total files, storage, active links)
- [ ] `RecentActivity.tsx` - Recent uploads feed (last 20 items)

**Notes:**
- Sections are reusable across views
- Use existing UI primitives from shadcn/ui

#### UI Components (`src/modules/workspace/components/ui/`)
**Pattern:** Follow `src/modules/links/components/ui/` structure

- [ ] `FolderCard.tsx` - Folder item with 🔗 badge for linked folders, people count
- [ ] `FileCard.tsx` - File item with thumbnail preview, metadata
- [ ] `FilePreview.tsx` - Modal for image/PDF preview (use storage signed URLs)
- [ ] `BulkActionsBar.tsx` - Toolbar for multi-select operations
- [ ] `FolderContextMenu.tsx` - Right-click menu for folders
- [ ] `FileContextMenu.tsx` - Right-click menu for files
- [ ] `EmptyFolderState.tsx` - Empty state for folders with no content
- [ ] `EmptyFilesState.tsx` - Empty state for no files view

**Notes:**
- Use AnimateUI components from `@/components/ui/animateui`
- Follow existing card patterns from Links Module
- Context menus use Radix UI primitives

---

### 6. Module-Specific Hooks

#### `src/modules/workspace/hooks/` (NEW DIRECTORY)
**Pattern:** Follow `src/modules/links/hooks/` structure (composable primitives)

- [ ] `use-workspace-view.ts` - Tab state management (Files, By Email, By Date)
- [ ] `use-folder-selection.ts` - Multi-select state for folders
- [ ] `use-file-selection.ts` - Multi-select state for files
- [ ] `use-search-state.ts` - Search query and filter state
- [ ] `use-folder-navigation.ts` - Breadcrumb navigation state

**Notes:**
- These are UI state hooks (not data hooks)
- Composable primitives pattern (single responsibility)
- Similar to `use-link-form-primitives.ts` structure

---

### 7. Tests

#### Database Query Tests
- [ ] `folder.queries.test.ts` - 8-10 tests (CRUD operations, hierarchy, uniqueness)
- [ ] `file.queries.test.ts` - 10-12 tests (CRUD, filtering, search, bulk operations)

#### Server Action Tests
- [ ] `folder.actions.test.ts` - 10-12 tests (auth, ownership, validation, rate limiting)
- [ ] `file.actions.test.ts` - 12-15 tests (auth, ownership, storage integration, bulk operations)

**Pattern:** Follow existing test patterns from `link.actions.test.ts`
- Mock Clerk auth
- Mock database queries
- Test happy paths + error cases
- Test ownership verification
- Test rate limiting

---

## 📦 File Organization Summary

```
src/
├── lib/
│   ├── actions/
│   │   ├── folder.actions.ts        [NEW - 6 actions]
│   │   ├── file.actions.ts          [NEW - 5 actions]
│   │   └── workspace.actions.ts     [EXTEND - add 2 actions]
│   ├── database/
│   │   └── queries/
│   │       ├── folder.queries.ts    [NEW - 8 queries]
│   │       └── file.queries.ts      [NEW - 10 queries]
│   ├── validation/
│   │   ├── folder-schemas.ts        [NEW]
│   │   └── file-schemas.ts          [NEW]
│   └── config/
│       └── query-keys.ts            [EXTEND - add folderKeys, fileKeys]
├── hooks/
│   └── data/
│       ├── use-folders.ts           [NEW - 6 hooks]
│       ├── use-files.ts             [NEW - 4 hooks]
│       └── use-workspace.ts         [EXTEND - add 2 hooks]
└── modules/
    └── workspace/
        ├── components/
        │   ├── views/               [4 view components]
        │   ├── sections/            [5 section components]
        │   └── ui/                  [8 UI components]
        ├── hooks/                   [5 module-specific hooks]
        └── lib/
            └── validation/          [Module form schemas if needed]
```

---

## 🎯 Implementation Order

**Phase 1: Foundation (Week 1)**
1. Database queries (folder + file)
2. Validation schemas (folder + file)
3. Query keys extension

**Phase 2: Actions & Hooks (Week 1-2)**
4. Server actions (folder + file + workspace extensions)
5. React Query hooks (folder + file + workspace extensions)
6. Comprehensive tests for queries + actions

**Phase 3: UI Components (Week 2-3)**
7. Basic UI components (FolderCard, FileCard, context menus)
8. Module-specific hooks (view state, selection, navigation)
9. Section components (FolderGrid, FolderDetails, QuickStats)

**Phase 4: Dashboard Views (Week 3-4)**
10. FilesView (Google Drive-style grid)
11. ByEmailView (email grouping)
12. ByDateView (chronological)
13. WorkspaceDashboard (main dashboard with tabs)

**Phase 5: Polish & Features (Week 4+)**
14. Search functionality
15. File preview modal
16. Bulk operations
17. Empty states
18. Error handling refinements

---

## 📊 Success Criteria

**Foundation complete when:**
- ✅ All database queries implemented and tested (19 queries total: 9 folder + 10 file)
- ✅ All validation schemas created
- ✅ All server actions implemented and tested (13 actions total)
- ✅ All React Query hooks implemented (12 hooks total)
- ✅ 0 TypeScript errors
- ✅ 100+ tests passing

**UI complete when:**
- ✅ FilesView displays folders/files in grid layout
- ✅ ByEmailView groups files by uploader email
- ✅ ByDateView shows chronological file list
- ✅ Search works across all folders
- ✅ File preview works for images/PDFs
- ✅ Bulk operations work (multi-select + delete)
- ✅ Empty states display correctly

**MVP complete when:**
- ✅ User can create folders with up to 20 levels of nesting
- ✅ User can view all files in workspace (3 views)
- ✅ User can filter files by email across all folders
- ✅ User can search files by name/email
- ✅ User can delete files/folders with confirmation
- ✅ Dashboard loads in < 2 seconds with 100+ files
- ✅ All features work on mobile

---

**End of TODO**
