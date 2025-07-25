# Supabase Dual Storage Setup

This guide explains how to set up Supabase Storage with separate buckets for workspace files and shared link files in the Foldly application.

## Why Dual Buckets?

We use separate storage buckets to provide:

- **Security Isolation**: Different access policies for workspace vs shared files
- **Performance Optimization**: Tailored indexing and caching strategies
- **Scalability**: Independent scaling for different use cases
- **Compliance**: Different data handling for personal vs shared content

## Prerequisites

- Supabase project created and configured
- Environment variables set (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- Database schema already migrated with users, workspaces, links, and files tables

## Setup Steps

### 1. Run Dual Storage SQL Setup

Execute the SQL script in your Supabase SQL Editor:

```bash
# Copy the contents of sql/create_dual_storage_buckets.sql
# Paste and run in Supabase Dashboard > SQL Editor
```

This script will:

- Create both `workspace-files` and `shared-files` storage buckets
- Set up Row Level Security (RLS) policies for each bucket
- Configure file size limits and allowed MIME types
- Create storage usage tracking triggers
- Add helper functions for quota management
- Create debugging views for file access

### 2. Verify Bucket Creation

After running the SQL script, check in your Supabase Dashboard:

1. Go to **Storage** section
2. Verify both buckets exist:
   - `workspace-files` (private workspace files)
   - `shared-files` (files shared via links)
3. Check that both are configured as **private** (not public)
4. Confirm file size limit is set to 50MB for both

### 3. Test File Upload

The storage service will automatically initialize both buckets on first use:

```typescript
import { storageService } from '@/lib/services/shared/storage-service';

// Initialize both buckets (happens automatically)
await storageService.initializeBuckets();
```

## Dual Bucket Architecture

### File Organization

Files are organized across two separate buckets:

**Workspace Files Bucket:**

```
workspace-files/
├── {userId}/
│   ├── workspace/
│   │   └── {timestamp}_{filename}
│   └── folders/
│       └── {folderId}/
│           └── {timestamp}_{filename}
```

**Shared Files Bucket:**

```
shared-files/
├── {linkId}/
│   ├── {timestamp}_{filename}
│   └── folders/
│       └── {folderId}/
│           └── {timestamp}_{filename}
```

### Security Models

**Workspace Files Security:**

- **Ultra-private**: Only file owner can access
- **Zero-trust**: No sharing capabilities
- **User isolation**: Files organized by user ID

**Shared Files Security:**

- **Controlled sharing**: Access based on link permissions
- **Public/private links**: Supports both access models
- **Link-based organization**: Files organized by link ID

## Usage in Code

### Upload Workspace File

```typescript
import { uploadFileAction } from '@/features/workspace/lib/actions';

// Uploads to workspace-files bucket
const result = await uploadFileAction(file, workspaceId, folderId);
```

### Upload Shared File (Future Implementation)

```typescript
import { storageService } from '@/lib/services/shared/storage-service';

// Direct upload to shared-files bucket
const result = await storageService.uploadFile(
  file,
  linkId,
  userId,
  'shared' // Context determines bucket
);
```

### Download Files

```typescript
import { downloadFileAction } from '@/features/workspace/lib/actions';

// Automatically uses correct bucket based on file metadata
const result = await downloadFileAction(fileId);
```

### Context-Aware Operations

```typescript
import { storageService } from '@/lib/services/shared/storage-service';

// The service automatically uses the right bucket
const isWorkspaceFile = true;
const context = storageService.determineStorageContext(isWorkspaceFile);

// Upload to appropriate bucket
await storageService.uploadFile(file, path, userId, context);

// Download from appropriate bucket
await storageService.getDownloadUrl(path, context);
```

## Storage Security Policies

### Workspace Files RLS Policies

```sql
-- Users can only access their own workspace files
CREATE POLICY "Users can upload to own workspace folder" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'workspace-files'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### Shared Files RLS Policies

```sql
-- Users can view files from public links or links they own
CREATE POLICY "Users can view shared files via links" ON storage.objects
FOR SELECT USING (
  bucket_id = 'shared-files'
  AND EXISTS (
    SELECT 1 FROM links l
    WHERE l.id = (storage.foldername(name))[1]::uuid
    AND (l.is_public = true OR l.user_id = auth.uid())
  )
);
```

## Storage Limits by Bucket

| Bucket Type     | Purpose                  | File Size Limit | Security Level     |
| --------------- | ------------------------ | --------------- | ------------------ |
| workspace-files | Personal workspace files | 50MB            | Ultra-private      |
| shared-files    | Files shared via links   | 50MB            | Controlled sharing |

## Supported File Types (Both Buckets)

- **Images**: All image formats (`image/*`)
- **Videos**: All video formats (`video/*`)
- **Audio**: All audio formats (`audio/*`)
- **Documents**: PDF, Word, Excel, PowerPoint
- **Text**: All text formats (`text/*`)
- **Archives**: ZIP, RAR, 7Z
- **Data**: JSON

## Storage Usage Tracking

Both buckets automatically track storage usage:

- **User storage**: Updated via database triggers
- **Bucket-aware**: Tracks usage across both buckets
- **Real-time**: Updates immediately on upload/delete
- **Quota enforcement**: Prevents exceeding user limits

## Monitoring & Debugging

### Debug Views

The setup creates helpful views for monitoring:

```sql
-- View workspace file access
SELECT * FROM workspace_file_access;

-- View shared file access
SELECT * FROM shared_file_access;
```

### Storage Usage Queries

```sql
-- Check user's storage usage across both buckets
SELECT
  u.email,
  u.storage_used,
  u.storage_limit,
  (u.storage_used::float / u.storage_limit * 100)::int as usage_percent
FROM users u
WHERE u.id = 'user-id';
```

## Migration from Single Bucket

If migrating from the single `files` bucket:

1. **Run the dual bucket setup script**
2. **Copy existing files** to appropriate bucket:
   - Workspace files → `workspace-files`
   - Shared files → `shared-files`
3. **Update file records** in database with new storage paths
4. **Remove old bucket** once migration is verified

## Troubleshooting

### Common Issues

1. **Upload fails with "Bucket not found"**
   - Run the dual bucket SQL setup script
   - Check both buckets exist in Supabase Dashboard

2. **Permission denied on shared files**
   - Verify link exists in database
   - Check link permissions (is_public flag)
   - Ensure RLS policies are created

3. **Storage usage not updating**
   - Check triggers are created
   - Verify file metadata includes size
   - Check user ID extraction from file paths

### Debug Commands

```typescript
// Test bucket initialization
await storageService.initializeBuckets();

// Check file info
await storageService.getFileInfo(path, 'workspace');
await storageService.getFileInfo(path, 'shared');

// List files in bucket
await storageService.listFiles('', 'workspace');
await storageService.listFiles('', 'shared');
```

## Production Considerations

1. **Backup Strategy**: Set up separate backup policies for each bucket
2. **Monitoring**: Monitor usage and performance per bucket
3. **CDN Integration**: Configure CDN for both buckets
4. **Rate Limiting**: Implement per-bucket rate limiting
5. **Cross-bucket Operations**: Plan for future cross-bucket file sharing

This dual bucket architecture provides a secure, scalable foundation for both private workspace files and shared link files, with clear separation of concerns and optimized access patterns.
