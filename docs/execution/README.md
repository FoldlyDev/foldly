# Foldly V2 Execution Documentation

Last Updated: October 29, 2025

This directory tracks **what has been implemented** in Foldly V2. For planning and design decisions, see [`/docs/planning`](../planning).

---

## Overview

**Execution docs** contain technical specifications, implementation details, and documentation for features that have been built and deployed.

**Status**: 🚧 In Progress - Implementation Phase Started

---

## Directory Structure

```
execution/
├── README.md (this file)
├── database/
│   └── schema.md               - ✅ Database schema implementation
├── testing/
│   └── testing-guide.md        - ✅ Testing strategy & patterns
├── infrastructure/
│   └── email-and-redis.md      - ✅ Email service & Redis rate limiting
├── api/
│   └── (API endpoint specs)     - ⏳ Coming soon
└── components/
    └── (Component specs)        - ⏳ Coming soon
```

---

## Implementation Status

### Phase 1: Foundation (Week 1-2)

| Component | Status | Location | Notes |
|-----------|--------|----------|-------|
| **Database Schema** | ✅ Completed | `database/schema.md` | 6 tables implemented with Drizzle ORM |
| **Database Migration** | ✅ Completed | 3 migrations | Schema pushed to Supabase |
| **Global Actions & Hooks** | ✅ Completed | `src/lib/actions`, `src/hooks` | Cross-module data layer with user management |
| **Onboarding Flow** | ✅ Completed | `src/modules/auth` | Username capture, workspace & link creation |
| **Email Service System** | ✅ Completed | `infrastructure/email-and-redis.md` | Phases 1-4 complete (infrastructure, templates, actions, hooks) |
| **Links Module** | ✅ Completed | `src/lib/actions/link.actions.ts` | 7 actions with 18 tests (create, read, update, delete, validate) |
| **Permission Management** | ✅ Completed | `src/lib/actions/permission.actions.ts` | 4 actions with 23 tests |
| **Branding Module** | ✅ Completed | `src/modules/links/lib/actions/branding.actions.ts` | 3 actions with 17 tests (logo uploads & color customization) |
| **Storage Abstraction** | ✅ Completed | `src/lib/storage/client.ts` | Provider-agnostic layer (Supabase + GCS) |
| **Link Password Encryption** | ✅ Completed | `src/lib/utils/security.ts` | AES-256-GCM encryption for shareable access codes |
| Supabase Storage Setup | ✅ Completed | - | 2 buckets configured (branding, uploads) |
| GCS Setup | ✅ Completed | `src/lib/storage/gcs/client.ts` | Alternative provider implementation |
| Next.js Project | ✅ Completed | - | Next.js 15 + React 19 configured |
| Supabase Config | ✅ Completed | `.env.local` | Database connection configured |
| Clerk Auth | ✅ Completed | `.env.local` | Authentication configured |
| Base UI Components | ✅ Completed | `src/components/ui/shadcn/` | shadcn/ui + custom CTA buttons |

---

## Completed Features

### ✅ Database Schema & Migration (October 9, 2025)

**Implementation Files**:
- `src/lib/database/schemas/users.ts`
- `src/lib/database/schemas/workspaces.ts`
- `src/lib/database/schemas/links.ts`
- `src/lib/database/schemas/folders.ts`
- `src/lib/database/schemas/files.ts`
- `src/lib/database/schemas/permissions.ts`
- `src/lib/database/schemas/index.ts`
- `drizzle/schema.ts`
- `drizzle/0000_superb_sway.sql`

**Key Features**:
- 1:1 workspace-user relationship (MVP)
- Globally unique link slugs
- Hierarchical folder structure
- Email-centric file filtering
- Nullable uploader tracking (owner vs external)
- Flat GCS storage architecture

**Status**:
- ✅ Schemas implemented in Drizzle ORM
- ✅ Migration generated
- ✅ Schema pushed to Supabase (all 6 tables active)

**Documentation**: [Database Schema Spec](./database/schema.md)

### ✅ Global Actions & Hooks Layer (October 9, 2025)

**Implementation Files**:
- `src/lib/database/queries/workspace.queries.ts`
- `src/lib/database/queries/user.queries.ts`
- `src/lib/database/queries/permission.queries.ts`
- `src/lib/database/queries/index.ts`
- `src/lib/actions/onboarding.actions.ts`
- `src/lib/actions/workspace.actions.ts`
- `src/lib/actions/user.actions.ts`
- `src/lib/actions/index.ts`
- `src/hooks/data/use-onboarding.ts`
- `src/hooks/data/use-user-workspace.ts`
- `src/hooks/data/index.ts`
- `src/hooks/ui/use-scroll-position.ts`
- `src/hooks/ui/index.ts`
- `src/hooks/index.ts`

**Implemented Patterns**:
- Three-layer architecture: Client → Hooks → Actions → Queries
- Database queries layer for reusable operations
- Global server actions for cross-module functionality
- React Query hooks wrapping server actions
- Organized hooks structure (`data/` and `ui/` subdirectories)

**Cross-Module Functionality**:
- User Management: `createUserAction()`, `getUserAction()`, `updateUserProfileAction()`
- Workspace Operations: `getUserWorkspaceAction()`, `createUserWorkspaceAction()`
- Onboarding: `checkOnboardingStatus()`, `checkUsernameAvailability()`
- Permission Queries: `getPermissionsByLink()`, `createPermission()`, etc.
- Client Hooks: `useOnboardingStatus()`, `useUserWorkspace()`, `useCreateWorkspace()`

**Status**:
- ✅ Database queries layer implemented
- ✅ Global server actions created
- ✅ Global hooks layer established
- ✅ Broken imports fixed across codebase
- ✅ Type-checked and verified

---

### ✅ Onboarding Flow (October 11, 2025)

**Implementation Files**:
- `src/modules/auth/components/forms/OnboardingForm.tsx`
- `src/app/(auth)/onboarding/page.tsx`

**Key Features**:
- 4-step onboarding process with visual feedback
- Username availability checking with Clerk reverification
- Database user creation before workspace (foreign key dependency)
- Automatic workspace and first link creation
- Server-side completion check (redirects if already onboarded)
- Form validation with disabled state management

**Onboarding Flow**:
1. Check username availability in Clerk (with reverification)
2. Create user in database (required for foreign key)
3. Create workspace with auto-generated name
4. Create first link with owner permission
5. Sync username to Clerk (last step for rollback safety)

**Status**:
- ✅ Multi-step loader with 4 progress stages
- ✅ Username pre-fill from Clerk if provided during signup
- ✅ Submit button disabled when field empty or validation fails
- ✅ Server-side onboarding check implemented
- ✅ Proper error handling and validation

---

### ✅ Email Service Infrastructure (October 13, 2025)

**Implementation Files**:
- `src/lib/email/client.ts` - Resend client with error handling
- `src/lib/email/types.ts` - TypeScript type definitions (10 types)
- `src/lib/email/constants.ts` - Email configuration and constants
- `src/lib/redis/client.ts` - Upstash Redis client for distributed rate limiting
- `src/lib/middleware/rate-limit.ts` - Migrated to Redis-backed rate limiting
- `src/lib/utils/security.ts` - OTP generation and validation utilities

**Key Features**:
- Resend email client singleton with error handling wrapper
- Complete TypeScript type system for email operations (10 types)
- Email configuration constants (addresses, subjects, limits, OTP config)
- OTP utilities: `generateSecureOTP()`, `isValidOTPFormat()`, expiration helpers
- Distributed Redis rate limiting (replacing in-memory Map)
- Email-specific rate limit keys and presets

**Status**:
- ✅ Phase 1: Infrastructure complete (client, types, constants, OTP utilities)
- ✅ Phase 2: Email templates complete (6 templates including welcome email)
- ✅ Phase 3: Server actions complete (5 actions with 32 tests)
- ✅ Phase 4: React Query hooks complete (5 hooks with toast notifications)
- ✅ Redis integration complete (Upstash client, distributed rate limiting)

**Documentation**: [Email & Redis Infrastructure](./infrastructure/email-and-redis.md)

**Planning Reference**: [Email Service Plan](../planning/email-service-plan.md)

---

### ✅ Permission Management & Branding (October 20, 2025)

**Implementation Files**:
- `src/lib/actions/permission.actions.ts` (4 actions: add, remove, update, get)
- `src/lib/storage/client.ts` (Storage abstraction layer)
- `src/lib/storage/supabase/client.ts` (Supabase Storage implementation)
- `src/lib/storage/gcs/client.ts` (GCS implementation)
- `src/modules/links/lib/actions/branding.actions.ts` (3 actions: update, upload, delete)
- `src/modules/links/lib/validation/link-branding-schemas.ts`

**Key Features**:
- Email-based permission management (add, remove, update role, get permissions)
- Provider-agnostic storage abstraction (Supabase Storage + GCS)
- Supabase Storage: 2 buckets configured (foldly-link-branding, foldly-uploads)
- GCS: Optional alternative provider
- Branding logo uploads (5MB limit, PNG/JPEG/WebP support)
- Color customization (accent, background)
- Rate limiting on all branding operations

**Status**:
- ✅ 4 permission actions (23 tests, optimized: 55.33s)
- ✅ 3 branding actions (17 tests, 38.57s)
- ✅ Storage abstraction layer complete
- ✅ Comprehensive validation schemas

### ✅ Storage Abstraction & Link Password Encryption (October 27, 2025)

**Implementation Files**:
- `src/lib/storage/client.ts` - Main abstraction layer
- `src/lib/storage/supabase/client.ts` - Supabase Storage implementation
- `src/lib/storage/gcs/client.ts` - Google Cloud Storage implementation
- `src/lib/utils/security.ts` - AES-256-GCM encryption utilities

**Key Features**:
- **Storage Abstraction**:
  - Provider-agnostic API (uploadFile, deleteFile, getSignedUrl, fileExists)
  - Switch providers via `STORAGE_PROVIDER` environment variable
  - Supabase Storage as default (integrated with existing infrastructure)
  - GCS as optional alternative for higher storage requirements
  - Unified bucket configuration (branding, uploads)

- **Link Password Encryption**:
  - AES-256-GCM two-way encryption (replaces bcrypt one-way hashing)
  - Link passwords are shareable access codes, not user authentication
  - Owners can view/share passwords with external users
  - Encryption key stored in `LINK_PASSWORD_ENCRYPTION_KEY` environment variable
  - Format: "iv:authTag:ciphertext" (hex encoded, colon separated)

**Status**:
- ✅ Storage abstraction implemented and tested
- ✅ Supabase Storage buckets configured
- ✅ GCS alternative provider ready
- ✅ Link password encryption utilities complete
- ✅ 3 link actions updated to use encryption (create, update, validate)

### ✅ Workspace Module - File & Folder Operations (October 29, 2025)

**Implementation Files**:
- `src/lib/database/queries/folder.queries.ts` - 11 folder queries
- `src/lib/database/queries/file.queries.ts` - 13 file queries
- `src/lib/actions/folder.actions.ts` - 5 folder actions
- `src/lib/actions/file.actions.ts` - 6 file actions
- `src/hooks/data/use-folders.ts` - 5 folder hooks
- `src/hooks/data/use-files.ts` - 5 file hooks
- `src/lib/utils/authorization.ts` - Ownership verification (verifyFolderOwnership, verifyFileOwnership)

**Key Features**:
- **Database Queries**: 24 pure database operations (11 folder, 13 file) with full JSDoc
- **Server Actions**: 11 authenticated actions with rate limiting (5 folder, 6 file)
- **React Query Hooks**: 10 hooks with error handling (5 folder, 5 file)
- **Storage-First Deletion**: Ethical pattern preventing unethical billing (delete storage before DB)
- **Bulk Operations**: Security-validated bulk deletion with partial success handling
- **Folder Hierarchy**: Breadcrumb path building, depth validation (max 20 levels), circular reference prevention
- **Email Filtering**: Files queryable by uploader email (core V2 feature)
- **Search**: Cross-folder file search by filename or uploader email

**Architectural Patterns**:
- Three-layer architecture (Query → Action → Hook)
- Centralized query keys (`@/lib/config/query-keys.ts`)
- Generic resource ownership verification
- Rate limiting (100/min reads, 20/min writes)
- Storage-first deletion for paid resources

**Status**:
- ✅ All 24 database queries documented with examples
- ✅ Type safety: 0 TypeScript errors, explicit return types
- ✅ DRY: Centralized utilities (withAuth, transformActionError, verifyResourceOwnership)
- ✅ Security: Ownership verification, bulk operation validation
- ✅ Documentation: CLAUDE.md updated with storage-first deletion pattern
- ✅ Code Review: 9.2/10 - Production-ready
- ✅ Tech Lead Approval: 9.5/10 - Authorized for Phase 3

---

## In Progress

Nothing currently in progress.

**Recently Completed** (2025-10-29):
- ✅ Workspace Module (11 actions, 10 hooks, 24 queries)
- ✅ Storage-first deletion pattern (ethical safeguard)
- ✅ Total: 262 passing tests, 0 TypeScript errors
- ✅ Tech lead approval: Production-ready, authorized for Phase 3

---

## Upcoming Implementation

### Phase 3: UI Implementation (Week 3-4)

**File Browser**:
- [ ] File grid view component (useWorkspaceFiles)
- [ ] Email filter view (useFilesByEmail)
- [ ] Search functionality (useSearchFiles)
- [ ] File deletion (useDeleteFile, useBulkDeleteFiles)

**Folder Tree**:
- [ ] Folder tree component (useRootFolders)
- [ ] Breadcrumb navigation (useFolderHierarchy)
- [ ] Folder CRUD (useCreateFolder, useUpdateFolder, useDeleteFolder)
- [ ] Drag-and-drop folder move (useMoveFolder)

**File Upload**:
- [ ] Upload component integration (useUppyUpload + useCreateFileRecord)
- [ ] Progress tracking
- [ ] Folder selection

---

## Migration History

### Database Migrations

| Date | Migration | Description |
|------|-----------|-------------|
| October 9, 2025 | `0000_superb_sway.sql` | ✅ Created all 6 tables with indexes and constraints |
| October 14, 2025 | `0001_cloudy_ozymandias.sql` | ✅ Schema updates (email notification settings) |
| October 20, 2025 | `0002_cloudy_ezekiel_stane.sql` | ✅ Schema updates (branding support) |
| October 23, 2025 | `0003_typical_ben_urich.sql` | ✅ Link password protection support |
| October 25, 2025 | `0004_tidy_klaw.sql` | ✅ Link expiration and additional config |

---

## Testing Status

| Category | Status | Tests | Notes |
|----------|--------|-------|-------|
| Database Queries (User) | ✅ Completed | 28 tests | User CRUD operations |
| Database Queries (Workspace) | ✅ Completed | 6 tests | Workspace CRUD operations |
| Database Queries (Permission) | ✅ Completed | 12 tests | Permission management operations |
| Database Queries (Folder) | ✅ Completed | TBD | Folder CRUD operations |
| Database Queries (File) | ✅ Completed | TBD | File CRUD operations |
| Server Actions (User) | ✅ Completed | 21 tests | User creation & profile updates |
| Server Actions (Onboarding) | ✅ Completed | 10 tests | Onboarding status & username checks |
| Server Actions (Workspace) | ✅ Completed | 15 tests | Workspace actions, link creation, email fallback |
| Server Actions (Link) | ✅ Completed | 18 tests | Link CRUD operations |
| Server Actions (Permission) | ✅ Completed | 23 tests | Permission management (optimized: 55.33s) |
| Server Actions (Folder) | ✅ Completed | TBD | Folder management, hierarchy validation |
| Server Actions (File) | ✅ Completed | TBD | File operations, storage-first deletion |
| Module Actions (Branding) | ✅ Completed | 17 tests | Logo uploads & branding config (38.57s) |
| Security Utilities | ✅ Completed | 22 tests | Slug generation, sanitization |
| Module Actions (Uploads) | ✅ Completed | 8 tests | Link validation & access |
| Server Actions (Email) | ✅ Completed | 32 tests | Email service actions |
| **Total** | **✅ Active** | **262+ tests** | 13+ test suites, all passing |

**Documentation**: [Testing Guide](./testing/testing-guide.md)

---

## Deployment History

| Date | Environment | Version | Notes |
|------|-------------|---------|-------|
| _Not deployed_ | - | - | Development only |

---

## How to Use This Documentation

### For Developers

1. **Check implementation status** in the tables above
2. **Read detailed specs** in subdirectories (database/, api/, components/)
3. **Update docs** as you implement features
4. **Mark items complete** when deployed/merged

### For Product/Design

1. Compare against [Planning Docs](../planning) to see what's been built
2. Check implementation status for feature availability
3. Review specs to understand technical constraints

---

## Documentation Guidelines

When implementing a new feature:

1. ✅ Create detailed spec document in appropriate subdirectory
2. ✅ Update implementation status table above
3. ✅ Add migration history entry (if database changes)
4. ✅ Document any deviations from original plan
5. ✅ Include code location references
6. ✅ Update testing status

---

## Related Documentation

- [Planning Documentation](../planning) - Design decisions and features to build
- [Finalized Decisions](../planning/decisions/finalized-decisions.md) - Locked architectural choices
- [MVP Features](../planning/features/mvp-features.md) - What we're building in Phase 1
- [Tech Stack](../planning/architecture/tech-stack.md) - Technology choices

---

## Summary

**Current Phase**: Phase 2 Complete - Backend Production-Ready
**Progress**: Foundation + Backend Complete, UI Next
**Next Up**: Phase 3 UI Implementation

**Completed**:
- ✅ Database schema (6 tables, 5 migrations)
- ✅ Global infrastructure (actions, hooks, queries, auth, email, redis)
- ✅ **Links Module** (7 actions, 4 permission actions, 3 branding actions)
- ✅ **Workspace Module** (11 actions, 10 hooks, 24 queries)
- ✅ **Storage-First Deletion Pattern** (ethical safeguard for paid resources)
- ✅ Storage abstraction (Supabase Storage + GCS)
- ✅ Link password encryption (AES-256-GCM)
- ✅ **262+ passing tests**, 0 TypeScript errors
- ✅ Next.js 15 + React 19 + Clerk + Supabase configured
- ✅ Code Review: 9.2/10 - Production-ready
- ✅ Tech Lead Approval: 9.5/10 - Authorized for Phase 3

**In Progress**:
- None

**Blocked**:
- None

**Next Tasks**:
- Phase 3 UI implementation (file browser, folder tree, upload flows)
