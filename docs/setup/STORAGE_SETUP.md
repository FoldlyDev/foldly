# Supabase Storage Setup

This guide explains how to set up Supabase Storage for file uploads in the Foldly application.

## Prerequisites

- Supabase project created and configured
- Environment variables set (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- Database schema already migrated

## Setup Steps

### 1. Run Storage SQL Setup

Execute the SQL script in your Supabase SQL Editor:

```bash
# Copy the contents of sql/create_storage_bucket.sql
# Paste and run in Supabase Dashboard > SQL Editor
```

This script will:

- Create the `files` storage bucket
- Set up Row Level Security (RLS) policies
- Configure file size limits and allowed MIME types
- Create storage usage tracking triggers
- Add helper functions for quota management

### 2. Verify Bucket Creation

After running the SQL script, check in your Supabase Dashboard:

1. Go to **Storage** section
2. Verify the `files` bucket exists
3. Check that it's configured as **private** (not public)
4. Confirm file size limit is set to 50MB

### 3. Test File Upload

The storage service will automatically initialize the bucket on first use, but you can test it manually:

```typescript
import { storageService } from '@/lib/services/shared/storage-service';

// Initialize bucket (happens automatically)
await storageService.initializeBucket();
```

## Storage Architecture

### File Organization

Files are organized in the bucket using this structure:

```
files/
├── {userId}/
│   ├── workspace/
│   │   └── {timestamp}_{filename}
│   └── folders/
│       └── {folderId}/
│           └── {timestamp}_{filename}
```

### Security

- **RLS Policies**: Users can only access their own files
- **Private Bucket**: No public access to files
- **Signed URLs**: Download links expire after 1 hour
- **File Validation**: MIME type and size validation

### Storage Limits

| Tier       | File Size Limit | Storage Limit |
| ---------- | --------------- | ------------- |
| Free       | 10MB            | 2GB           |
| Pro        | 100MB           | 50GB          |
| Business   | 500MB           | 200GB         |
| Enterprise | 1GB             | 1TB           |

## Usage in Code

### Upload a File

```typescript
import { uploadFileAction } from '@/features/workspace/lib/actions';

const result = await uploadFileAction(file, workspaceId, folderId);
```

### Download a File

```typescript
import { downloadFileAction } from '@/features/workspace/lib/actions';

const result = await downloadFileAction(fileId);
// result.data.downloadUrl - Signed URL for download
// result.data.expiresAt - URL expiration time
```

### Direct Storage Service Usage

```typescript
import { storageService } from '@/lib/services/shared/storage-service';

// Upload
const uploadResult = await storageService.uploadFile(file, 'path', userId);

// Download URL
const downloadResult = await storageService.getDownloadUrl(path);

// Delete
await storageService.deleteFile(path);
```

## Supported File Types

The storage service supports these file types:

- **Images**: All image formats (`image/*`)
- **Videos**: All video formats (`video/*`)
- **Audio**: All audio formats (`audio/*`)
- **Documents**: PDF, Word, Excel, PowerPoint
- **Text**: All text formats (`text/*`)
- **Archives**: ZIP, RAR, 7Z
- **Data**: JSON

## Error Handling

The storage service includes comprehensive error handling:

- **File size validation**: Prevents oversized uploads
- **Storage quota checks**: Prevents exceeding user limits
- **Cleanup on failure**: Removes orphaned files
- **Graceful degradation**: Database operations continue even if storage fails

## Monitoring

Storage usage is automatically tracked:

- **User storage usage**: Updated via database triggers
- **Download counting**: Incremented on each download
- **File metadata**: Stored in database for quick access

## Troubleshooting

### Common Issues

1. **Upload fails with "Bucket not found"**
   - Run the SQL setup script
   - Check bucket exists in Supabase Dashboard

2. **Permission denied errors**
   - Verify RLS policies are created
   - Check user authentication

3. **File size limit errors**
   - Check user subscription tier limits
   - Verify bucket configuration

### Debug Mode

Enable storage debugging by checking browser console logs:

```
✅ BUCKET_CREATED: files
✅ FILE_UPLOADED: user123/workspace/1234567890_document.pdf
✅ FILE_DELETED_FROM_STORAGE: user123/workspace/1234567890_document.pdf
```

## Production Considerations

1. **CDN Integration**: Consider adding CloudFlare or similar CDN
2. **Backup Strategy**: Set up automated backups
3. **Monitoring**: Add storage usage monitoring
4. **Rate Limiting**: Implement upload rate limiting
5. **Virus Scanning**: Add file virus scanning for production

## Development vs Production

| Feature         | Development | Production       |
| --------------- | ----------- | ---------------- |
| File Size Limit | 50MB        | Variable by tier |
| Storage Quota   | 2GB         | Variable by tier |
| Virus Scanning  | Disabled    | Recommended      |
| CDN             | None        | Recommended      |
| Backup          | Manual      | Automated        |
