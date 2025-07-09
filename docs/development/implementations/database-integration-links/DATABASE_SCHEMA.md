# 🗄️ Database Schema - Links Feature Integration

**Schema Version:** 2025.1 Simplified MVP  
**Database:** PostgreSQL via Supabase  
**Documentation Date:** January 2025  
**Integration Target:** Links Feature

## 🎯 Schema Overview

This document outlines the database schema specifically for the links feature integration, following the **simplified MVP approach** while supporting the sophisticated multi-link system architecture.

## 📋 Links Feature Tables

### **Core Tables for Links Feature**

```sql
-- ========================================
-- USERS TABLE - Authentication & Profile
-- ========================================
CREATE TABLE users (
  id UUID PRIMARY KEY,                    -- Clerk user ID (direct mapping)
  email VARCHAR(255) UNIQUE NOT NULL,     -- User email from Clerk
  username VARCHAR(100) UNIQUE NOT NULL,  -- Unique username for links
  first_name VARCHAR(100),                -- Display name components
  last_name VARCHAR(100),
  avatar_url TEXT,                        -- Profile image URL
  subscription_tier VARCHAR(20) DEFAULT 'free', -- Billing tier
  storage_used BIGINT DEFAULT 0,          -- Current storage usage
  storage_limit BIGINT DEFAULT 2147483648, -- 2GB default limit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- WORKSPACES TABLE - User Data Container
-- ========================================
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL DEFAULT 'My Files',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- LINKS TABLE - Multi-Link Architecture
-- ========================================
CREATE TABLE links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Multi-Link URL Components
  slug VARCHAR(100) NOT NULL,              -- Base identifier (username)
  topic VARCHAR(100),                      -- NULL for base links, topic for custom
  link_type VARCHAR(20) NOT NULL DEFAULT 'base'
    CHECK (link_type IN ('base','custom','generated')),

  -- Link Display & Metadata
  title VARCHAR(255) NOT NULL DEFAULT
    COALESCE(topic || ' Collection', 'Personal Collection'),
  description TEXT,                        -- Optional description

  -- Access Control
  require_email BOOLEAN DEFAULT FALSE,     -- Email collection required
  require_password BOOLEAN DEFAULT FALSE,  -- Password protection
  password_hash TEXT,                      -- Hashed password if protected
  is_public BOOLEAN DEFAULT TRUE,          -- Public visibility
  is_active BOOLEAN DEFAULT TRUE,          -- Link enabled/disabled

  -- Upload Constraints
  max_files INTEGER DEFAULT 100,           -- File upload limit
  max_file_size BIGINT DEFAULT 104857600,  -- 100MB per file
  allowed_file_types JSON,                 -- Array of allowed MIME types (NULL = all types)
  expires_at TIMESTAMP WITH TIME ZONE,     -- Optional expiration

  -- Branding (Simplified for MVP)
  brand_enabled BOOLEAN DEFAULT FALSE,     -- Custom branding toggle
  brand_color VARCHAR(7),                  -- Hex color code

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint for multi-link system
  UNIQUE (user_id, slug, topic)
);

-- ========================================
-- FOLDERS TABLE - File Organization
-- ========================================
CREATE TABLE folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  parent_folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  link_id UUID REFERENCES links(id) ON DELETE SET NULL, -- Associated link

  name VARCHAR(255) NOT NULL,              -- Folder display name
  path TEXT NOT NULL,                      -- Materialized path (e.g., "/documents/images")
  depth SMALLINT NOT NULL DEFAULT 0,       -- Hierarchy depth for queries

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- BATCHES TABLE - Upload Grouping
-- ========================================
CREATE TABLE batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES links(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  uploader_name VARCHAR(255) NOT NULL,     -- Name of person uploading
  uploader_email VARCHAR(255),             -- Optional email collection
  status VARCHAR(12) NOT NULL DEFAULT 'uploading'
    CHECK (status IN ('uploading','completed','failed')),

  total_files INT DEFAULT 0,               -- Files in this batch
  total_size BIGINT DEFAULT 0,             -- Total batch size

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- FILES TABLE - Uploaded Files
-- ========================================
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES links(id) ON DELETE CASCADE,
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES folders(id) ON DELETE SET NULL, -- NULL = root level

  file_name VARCHAR(255) NOT NULL,         -- Sanitized filename
  original_name VARCHAR(255) NOT NULL,     -- Original upload name
  file_size BIGINT NOT NULL,               -- File size in bytes
  mime_type VARCHAR(100) NOT NULL,         -- File MIME type
  storage_path TEXT NOT NULL,              -- Supabase storage path

  processing_status VARCHAR(20) DEFAULT 'pending'
    CHECK (processing_status IN ('pending','processing','completed','failed')),
  is_safe BOOLEAN DEFAULT TRUE,            -- Security scan result

  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔗 Multi-Link System Architecture

### **Link Type Patterns**

```typescript
// Link URL Pattern Examples
export const LINK_PATTERNS = {
  BASE: 'foldly.com/{username}', // foldly.com/johnsmith
  CUSTOM: 'foldly.com/{username}/{topic}', // foldly.com/johnsmith/portfolio
  GENERATED: 'foldly.com/{username}/{folder}', // Auto-generated from folder
} as const;

// Database Implementation
export const LINK_TYPES = {
  BASE: 'base', // One per user, slug = username, topic = NULL
  CUSTOM: 'custom', // Multiple allowed, slug = username, topic = custom
  GENERATED: 'generated', // Auto-created, slug = username, topic = folder_name
} as const;
```

### **Multi-Link Database Examples**

```sql
-- Example 1: Base Link (Primary collection)
INSERT INTO links (user_id, workspace_id, slug, topic, link_type, title)
VALUES (
  'user-123', 'workspace-456', 'johnsmith', NULL, 'base',
  'John Smith - Personal Collection'
);
-- Result: foldly.com/johnsmith

-- Example 2: Custom Topic Link
INSERT INTO links (user_id, workspace_id, slug, topic, link_type, title)
VALUES (
  'user-123', 'workspace-456', 'johnsmith', 'portfolio', 'custom',
  'Portfolio Collection'
);
-- Result: foldly.com/johnsmith/portfolio

-- Example 3: Generated Folder Link
INSERT INTO links (user_id, workspace_id, slug, topic, link_type, title)
VALUES (
  'user-123', 'workspace-456', 'johnsmith', 'project-files', 'generated',
  'Project Files Collection'
);
-- Result: foldly.com/johnsmith/project-files
```

## 🎯 Links Feature Queries

### **Core Link Management Queries**

```sql
-- ========================================
-- GET USER LINKS WITH STATS
-- ========================================
SELECT
  l.*,
  COUNT(DISTINCT f.id) as file_count,
  COUNT(DISTINCT b.id) as batch_count,
  COALESCE(SUM(f.file_size), 0) as total_size,
  CASE
    WHEN l.topic IS NULL THEN CONCAT('foldly.com/', l.slug)
    ELSE CONCAT('foldly.com/', l.slug, '/', l.topic)
  END as full_url
FROM links l
LEFT JOIN files f ON l.id = f.link_id
LEFT JOIN batches b ON l.id = b.link_id
WHERE l.user_id = $1
  AND l.is_active = true
GROUP BY l.id
ORDER BY l.created_at DESC;

-- ========================================
-- CREATE NEW LINK WITH VALIDATION
-- ========================================
-- Check for unique slug/topic combination
SELECT EXISTS(
  SELECT 1 FROM links
  WHERE user_id = $1 AND slug = $2 AND topic = $3
);

-- Insert new link (if unique)
INSERT INTO links (
  user_id, workspace_id, slug, topic, link_type,
  title, description, max_files, max_file_size
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
RETURNING *;

-- ========================================
-- GET LINK BY URL COMPONENTS
-- ========================================
SELECT l.*, u.username, u.avatar_url
FROM links l
JOIN users u ON l.user_id = u.id
WHERE l.slug = $1
  AND (
    (l.topic IS NULL AND $2 IS NULL) OR
    (l.topic = $2)
  )
  AND l.is_active = true
  AND l.is_public = true;

-- ========================================
-- GET LINK FILES WITH FOLDER STRUCTURE
-- ========================================
SELECT
  f.*,
  fo.name as folder_name,
  fo.path as folder_path,
  b.uploader_name,
  b.uploader_email
FROM files f
LEFT JOIN folders fo ON f.folder_id = fo.id
JOIN batches b ON f.batch_id = b.id
WHERE f.link_id = $1
  AND f.processing_status = 'completed'
ORDER BY fo.path NULLS FIRST, f.uploaded_at DESC;
```

## 🗂️ Folder System Integration

### **Folder Hierarchy Support**

```sql
-- ========================================
-- CREATE FOLDER HIERARCHY
-- ========================================
-- Create root folder
INSERT INTO folders (user_id, workspace_id, link_id, name, path, depth)
VALUES ($1, $2, $3, 'Documents', '/documents', 1);

-- Create nested folder
INSERT INTO folders (
  user_id, workspace_id, link_id, parent_folder_id,
  name, path, depth
) VALUES (
  $1, $2, $3, $4,
  'Images', '/documents/images', 2
);

-- ========================================
-- GET FOLDER TREE FOR LINK
-- ========================================
WITH RECURSIVE folder_tree AS (
  -- Root folders
  SELECT id, name, path, depth, parent_folder_id, 0 as level
  FROM folders
  WHERE link_id = $1 AND parent_folder_id IS NULL

  UNION ALL

  -- Child folders
  SELECT f.id, f.name, f.path, f.depth, f.parent_folder_id, ft.level + 1
  FROM folders f
  JOIN folder_tree ft ON f.parent_folder_id = ft.id
  WHERE f.link_id = $1
)
SELECT * FROM folder_tree ORDER BY path;

-- ========================================
-- FILE UPLOAD TO FOLDER
-- ========================================
-- Root level upload (folder_id = NULL)
INSERT INTO files (
  link_id, batch_id, user_id, folder_id,
  file_name, original_name, file_size, mime_type, storage_path
) VALUES ($1, $2, $3, NULL, $4, $5, $6, $7, $8);

-- Folder-specific upload
INSERT INTO files (
  link_id, batch_id, user_id, folder_id,
  file_name, original_name, file_size, mime_type, storage_path
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
```

## 🔐 Row Level Security (RLS)

### **Security Policies for Links Feature**

```sql
-- ========================================
-- ENABLE RLS ON ALL TABLES
-- ========================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE links ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- ========================================
-- USER POLICIES - Own Data Only
-- ========================================
CREATE POLICY "Users manage own data" ON users
FOR ALL USING (id = auth.jwt()->>'sub'::uuid);

CREATE POLICY "Users manage own workspaces" ON workspaces
FOR ALL USING (user_id = auth.jwt()->>'sub'::uuid);

-- ========================================
-- LINK POLICIES - Owner + Public Read
-- ========================================
-- Link owners can manage their links
CREATE POLICY "Users manage own links" ON links
FOR ALL USING (user_id = auth.jwt()->>'sub'::uuid);

-- Public can read active public links
CREATE POLICY "Public can read public links" ON links
FOR SELECT USING (is_public = true AND is_active = true);

-- ========================================
-- FILE POLICIES - Owner + Link Access
-- ========================================
-- Link owners can manage files
CREATE POLICY "Users manage files in own links" ON files
FOR ALL USING (user_id = auth.jwt()->>'sub'::uuid);

-- Public can read files in public links
CREATE POLICY "Public can read files in public links" ON files
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM links l
    WHERE l.id = files.link_id
      AND l.is_public = true
      AND l.is_active = true
  )
);

-- ========================================
-- FOLDER POLICIES - Inherit from Links
-- ========================================
CREATE POLICY "Users manage folders in own links" ON folders
FOR ALL USING (user_id = auth.jwt()->>'sub'::uuid);

CREATE POLICY "Public can read folders in public links" ON folders
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM links l
    WHERE l.id = folders.link_id
      AND l.is_public = true
      AND l.is_active = true
  )
);

-- ========================================
-- BATCH POLICIES - Upload Session Management
-- ========================================
CREATE POLICY "Users manage batches in own links" ON batches
FOR ALL USING (user_id = auth.jwt()->>'sub'::uuid);

-- Allow batch creation for public uploads (with link validation)
CREATE POLICY "Public can create batches for public links" ON batches
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM links l
    WHERE l.id = batches.link_id
      AND l.is_public = true
      AND l.is_active = true
  )
);
```

## 📊 Database Indexes for Performance

### **Optimized Indexes for Links Feature**

```sql
-- ========================================
-- LINKS TABLE INDEXES
-- ========================================
-- URL lookup optimization
CREATE UNIQUE INDEX idx_links_unique_url ON links (user_id, slug, topic);
CREATE INDEX idx_links_slug_topic ON links (slug, topic) WHERE is_active = true;
CREATE INDEX idx_links_user_active ON links (user_id) WHERE is_active = true;

-- ========================================
-- FILES TABLE INDEXES
-- ========================================
-- Link file queries
CREATE INDEX idx_files_link_id ON files (link_id);
CREATE INDEX idx_files_batch_id ON files (batch_id);
CREATE INDEX idx_files_folder_id ON files (folder_id);

-- File search and filtering
CREATE INDEX idx_files_link_status ON files (link_id, processing_status);
CREATE INDEX idx_files_uploaded_at ON files (uploaded_at DESC);

-- ========================================
-- FOLDERS TABLE INDEXES
-- ========================================
-- Hierarchy traversal
CREATE INDEX idx_folders_parent_id ON folders (parent_folder_id);
CREATE INDEX idx_folders_link_path ON folders (link_id, path);
CREATE INDEX idx_folders_workspace_id ON folders (workspace_id);

-- ========================================
-- BATCHES TABLE INDEXES
-- ========================================
-- Batch management
CREATE INDEX idx_batches_link_id ON batches (link_id);
CREATE INDEX idx_batches_status ON batches (status);
CREATE INDEX idx_batches_created_at ON batches (created_at DESC);

-- ========================================
-- COMPOSITE INDEXES FOR COMPLEX QUERIES
-- ========================================
-- Link statistics queries
CREATE INDEX idx_links_stats ON links (user_id, is_active, created_at DESC);

-- File listing with folder info
CREATE INDEX idx_files_listing ON files (link_id, folder_id, uploaded_at DESC);

-- Folder tree queries
CREATE INDEX idx_folders_tree ON folders (link_id, parent_folder_id, path);
```

## 🎯 Database Integration Points

### **TypeScript Integration Types**

```typescript
// Database row types (generated from schema)
export interface DatabaseLink {
  id: string;
  user_id: string;
  workspace_id: string;
  slug: string;
  topic: string | null;
  link_type: 'base' | 'custom' | 'generated';
  title: string;
  description: string | null;
  require_email: boolean;
  require_password: boolean;
  password_hash: string | null;
  is_public: boolean;
  is_active: boolean;
  max_files: number;
  max_file_size: number;
  expires_at: string | null;
  brand_enabled: boolean;
  brand_color: string | null;
  created_at: string;
  updated_at: string;
}

// Enhanced link with computed properties
export interface LinkWithStats extends DatabaseLink {
  file_count: number;
  batch_count: number;
  total_size: number;
  full_url: string;
}

// File upload integration
export interface DatabaseFile {
  id: string;
  link_id: string;
  batch_id: string;
  user_id: string;
  folder_id: string | null;
  file_name: string;
  original_name: string;
  file_size: number;
  mime_type: string;
  storage_path: string;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  is_safe: boolean;
  uploaded_at: string;
}
```

## 📈 Performance Considerations

### **Query Optimization Strategies**

1. **Link Statistics Aggregation**
   - Denormalized counts for fast dashboard loading
   - Background jobs for heavy aggregations
   - Cached computed properties

2. **File Listing Pagination**
   - Cursor-based pagination for large file lists
   - Lazy loading for folder contents
   - Optimized sorting strategies

3. **Real-time Updates**
   - Selective subscriptions by user/link
   - Efficient change detection
   - Minimal payload broadcasts

4. **Storage Management**
   - Automatic cleanup of orphaned files
   - Batch deletion for performance
   - Storage quota enforcement

---

**Result**: 🚀 **A production-ready database schema that supports the sophisticated multi-link architecture while maintaining excellent performance and security for the links feature integration.**
