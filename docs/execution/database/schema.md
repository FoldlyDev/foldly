# Foldly V2 Database Schema

Last Updated: October 8, 2025
**Status**: ✅ Implemented

## Overview

This document describes the implemented database schema for Foldly V2, designed to support email-centric file organization with workspaces, shareable links, and hierarchical folder structures.

**Database:** PostgreSQL via Supabase
**ORM:** Drizzle ORM
**Storage:** Google Cloud Storage (GCS)
**Schema Location:** `src/lib/database/schemas/`

---

## Core Principles

1. **Email-Centric Filtering**: All uploaded content (files & folders) tagged with `uploader_email` for filtering
2. **Workspace as Container**: One workspace per user (MVP), acts as middle man between user and content
3. **Links ARE Folders**: Links define shareable endpoints, differentiated from folders by `link_id` field
4. **Flat Storage, Database Organization**: Storage path is flat, all logical organization in database
5. **Nullable Uploader Tracking**: `uploader_email = NULL` for owner-created content, NOT NULL for external uploads

---

## Entity Relationship Diagram

```
users (Clerk)
  ↓ 1:1 (cascade delete)
workspaces
  ↓ 1:many (cascade delete)
  ├── links (globally unique slugs)
  │     ↓ 1:many (cascade delete)
  │     └── permissions (email-based access control)
  │
  ├── folders (hierarchical, self-referencing)
  │     ↓ parent-child (set null on delete)
  │     └── folders (subfolders)
  │
  └── files (stored in GCS)

Relationships:
- folders.link_id → links.id (set null on link delete)
- folders.parent_folder_id → folders.id (self-reference)
- files.parent_folder_id → folders.id (set null on folder delete)
- files.link_id → links.id (set null on link delete)
```

---

## Tables

### 1. users

**File:** `src/lib/database/schemas/users.ts`
**Purpose**: Clerk user integration with subscription tracking

**Key Fields**:
- `id` (PK, text): Clerk user ID
- `email` (unique): User email
- `username` (unique): Used for first link slug
- `subscription_status`: Subscription tier tracking
- `storage_used`: Cached storage usage (bytes)
- `settings` (JSONB): User preferences

**Cascade**: User deletion → workspace deletion → all content deleted

---

### 2. workspaces

**File:** `src/lib/database/schemas/workspaces.ts`
**Purpose**: Container for all user content (1:1 with users in MVP)

**Schema**:
```typescript
{
  id: text (PK, UUID)
  user_id: text (FK → users.id, unique, cascade delete)
  name: varchar(255)
  created_at: timestamp
  updated_at: timestamp
}
```

**Constraints**:
- `user_id` is UNIQUE (enforces 1:1 relationship for MVP)

**Auto-generation**: Created on user signup with name like "Eddy's Workspace"

**Future-proofing**: Can remove unique constraint to support multiple workspaces per user

---

### 3. links

**File:** `src/lib/database/schemas/links.ts`
**Purpose**: Shareable upload endpoints (links ARE folders)

**Schema**:
```typescript
{
  id: text (PK, UUID)
  workspace_id: text (FK → workspaces.id, cascade delete)
  slug: varchar(100) (globally unique)
  name: varchar(255)
  is_public: boolean (default: false)
  is_active: boolean (default: true)
  custom_message: text (nullable)
  requires_name: boolean (default: false)
  requires_message: boolean (default: false)
  created_at: timestamp
  updated_at: timestamp
}
```

**Constraints**:
- `slug` is globally UNIQUE across all users

**URL Pattern**: `foldly.com/{username}/{slug}`

**Link Types**:
- **Public**: Anyone can upload, emails auto-appended to permissions
- **Dedicated**: Only whitelisted emails can upload

**Auto-generation**: First link created after onboarding with `slug = username`

**Deletion Behavior**: When link deleted, `link_id` set to NULL in folders/files (preserves content)

---

### 4. folders

**File:** `src/lib/database/schemas/folders.ts`
**Purpose**: Hierarchical folder structure (personal and shared)

**Schema**:
```typescript
{
  id: text (PK, UUID)
  workspace_id: text (FK → workspaces.id, cascade delete)
  link_id: text (FK → links.id, nullable, set null on delete)
  parent_folder_id: text (self-reference, nullable)
  name: varchar(255)
  uploader_email: varchar(255) (nullable)
  uploader_name: varchar(255) (nullable)
  created_at: timestamp
  updated_at: timestamp
}
```

**Constraints**:
- Unique `(parent_folder_id, name)` - folder names unique within same parent

**Uploader Tracking**:
- `uploader_email = NULL` → Created by workspace owner (personal folder)
- `uploader_email = email` → Created by external uploader

**Link Relationship**:
- `link_id = NULL` → Personal folder (not shared)
- `link_id = NOT NULL` → Shared folder (associated with a link)

**Root Folders**: `parent_folder_id = NULL`

**Auto-generation**: Root folder created with each link, named `{slug}-files`

---

### 5. files

**File:** `src/lib/database/schemas/files.ts`
**Purpose**: File metadata and storage references

**Schema**:
```typescript
{
  id: text (PK, UUID)
  workspace_id: text (FK → workspaces.id, cascade delete)
  parent_folder_id: text (FK → folders.id, nullable, set null on delete)
  link_id: text (FK → links.id, nullable, set null on delete)
  filename: varchar(500) (includes extension)
  file_size: bigint (bytes)
  mime_type: varchar(100)
  storage_path: text (GCS path)
  uploader_email: varchar(255) (nullable)
  uploader_name: varchar(255) (nullable)
  uploader_message: text (nullable)
  uploaded_at: timestamp
  updated_at: timestamp
}
```

**Constraints**:
- Unique `(parent_folder_id, filename)` - filenames unique within same parent

**Uploader Tracking** (same as folders):
- `uploader_email = NULL` → Uploaded by workspace owner
- `uploader_email = email` → Uploaded by external user

**Storage Pattern**:
- **Database**: Stores full `filename` (e.g., "contract.pdf") for downloads
- **GCS Path**: `{user_id}/{workspace_id}/{file_id}.{ext}`

**Root Files**: `parent_folder_id = NULL` (files can exist at workspace root)

---

### 6. permissions

**File:** `src/lib/database/schemas/permissions.ts`
**Purpose**: Email-based access control per link

**Schema**:
```typescript
{
  id: text (PK, UUID)
  link_id: text (FK → links.id, cascade delete)
  email: varchar(255)
  role: varchar(20) // 'owner' | 'editor' | 'uploader'
  is_verified: varchar(10) (default: 'false')
  verified_at: timestamp (nullable)
  last_activity_at: timestamp (nullable)
  created_at: timestamp
  updated_at: timestamp
}
```

**Constraints**:
- Unique `(link_id, email)` - one permission entry per email per link

**Roles**:
- `owner`: Workspace owner, full control (auto-created with link)
- `editor`: Can delete others' files, requires OTP verification
- `uploader`: Can only upload files (default for external users)

**Access Behavior**:
- **Public links**: Emails auto-appended on first upload
- **Dedicated links**: Only emails in permissions table can upload

**Role Promotion**: Uploader → Editor requires OTP verification

---

## Storage Architecture

### Flat Storage Path

```
gs://foldly-files/{user_id}/{workspace_id}/{file_id}.{ext}
```

**Why Flat?**:
- Simplifies file moves between folders (just update database references)
- No storage reorganization needed when moving files
- Database is source of truth for organization
- Easy to debug and manage

**Example**:
```
gs://foldly-files/
  ├── user_abc123/
  │   └── workspace_xyz789/
  │       ├── file_001.pdf
  │       ├── file_002.jpg
  │       └── file_003.docx
```

---

## Auto-Generation Flow (After Onboarding)

```
1. User signs up via Clerk
   ↓
2. User redirected to onboarding page
   ↓
3. User enters username during onboarding
   ↓
4. On onboarding completion, create user in database
   - id: Clerk user ID
   - email: from Clerk
   - username: from onboarding form
   ↓
5. Create workspace
   - name: "{firstName}'s Workspace" or "{username}'s Workspace"
   ↓
6. Create first link
   - slug: username (from onboarding)
   - name: username
   - is_public: false
   - is_active: true
   ↓
7. Create root folder for link
   - name: "{username}-files"
   - link_id: first link ID
   - parent_folder_id: NULL
   - uploader_email: NULL (owner-created)
   ↓
8. Create owner permission
   - link_id: first link ID
   - email: user's email
   - role: 'owner'
   - is_verified: 'true'
```

**Result**: User can immediately share `foldly.com/{username}` and start collecting files

**Note**: This flow is triggered programmatically during the onboarding process, NOT via Clerk webhook

---

## Deletion Cascades

### User Deletion
```
users (DELETE)
  → workspaces (CASCADE DELETE)
    → links (CASCADE DELETE)
      → permissions (CASCADE DELETE)
    → folders (CASCADE DELETE)
      → subfolders (CASCADE via parent_folder_id)
    → files (CASCADE DELETE)
```

### Link Deletion
```
links (DELETE)
  → permissions (CASCADE DELETE)
  → folders.link_id (SET NULL - preserves content as personal)
  → files.link_id (SET NULL - preserves content as personal)
```

### Folder Deletion
```
folders (DELETE)
  → subfolders.parent_folder_id (SET NULL)
  → files.parent_folder_id (SET NULL)
```

**No Soft Deletes**: All deletions are immediate and permanent

---

## Key Implementation Details

### Schema Files Structure

```
src/lib/database/schemas/
├── index.ts              (exports all schemas)
├── users.ts              (Clerk integration)
├── workspaces.ts         (1:1 with users)
├── links.ts              (globally unique slugs)
├── folders.ts            (hierarchical structure)
├── files.ts              (GCS file metadata)
└── permissions.ts        (email-based access)

drizzle/
└── schema.ts             (re-exports for drizzle-kit)
```

### Indexes Implemented

**Email Filtering (Core V2)**:
- `files_uploader_email_idx`
- `folders_uploader_email_idx`
- `files_workspace_uploader_idx` (composite)

**Foreign Keys**:
- `workspaces_user_id_idx` (unique)
- `links_slug_idx` (globally unique)
- All FK indexes for performance

### Unique Constraints

1. `workspaces.user_id` - Enforces 1:1 (MVP)
2. `links.slug` - Globally unique slugs
3. `(folders.parent_folder_id, folders.name)` - Unique folder names within parent
4. `(files.parent_folder_id, files.filename)` - Unique filenames within parent
5. `(permissions.link_id, permissions.email)` - One permission per email per link

---

## Next Steps

1. ✅ Schema files created
2. ✅ Migrations generated: `npm run generate`
3. ✅ Pushed to database: `npm run push`
4. ⏳ Build onboarding flow to capture username and trigger auto-generation
5. ⏳ Build API endpoints/server actions for CRUD operations
6. ⏳ Set up Google Cloud Storage bucket

---

## Summary

**6 Tables Total**:
1. ✅ users (Clerk integration)
2. ✅ workspaces (1:1 with users)
3. ✅ links (globally unique slugs)
4. ✅ folders (hierarchical, email-tracked)
5. ✅ files (email-tracked, GCS-stored)
6. ✅ permissions (email-based access)

**Key Features**:
- ✅ Email-centric filtering across all content
- ✅ Consistent uploader tracking (NULL = owner, NOT NULL = external)
- ✅ Flat storage with database-driven organization
- ✅ Links as folders (clean mental model)
- ✅ Flexible moving between personal/shared contexts
