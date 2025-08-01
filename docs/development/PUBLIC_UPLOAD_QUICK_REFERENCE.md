# 🚀 Public Upload Feature - Quick Reference

> **Quick reference guide for developers working with the public link upload feature**  
> **Feature**: Public file uploads to user links  
> **Last Updated**: February 2025

## 📍 **Feature Overview**

The public upload feature allows external users to upload files to user-created links without authentication. 

### **Link Types**
- **Base Links**: `foldly.com/[any-slug]` (user-chosen slug)
- **Custom Links**: `foldly.com/[any-slug]/[topic]`
- **Generated Links**: `foldly.com/[any-slug]/[generated-slug]`

## 🛠️ **Key Files & Locations**

### **Route Handler**
```
src/app/(public-upload)/[...slug]/page.tsx
```

> **Note**: The route uses a required catch-all pattern `[...slug]` to handle all upload paths while avoiding conflicts with the root route. The `(public-upload)` route group improves code organization without affecting URLs.

### **Feature Module**
```
src/features/link-upload/
├── components/         # UI components
├── lib/               # Server actions & utilities
├── stores/            # Zustand stores
├── hooks/             # React hooks
└── types/             # TypeScript types
```

### **Key Server Actions**
```typescript
// Link validation
import { validateLinkAccessAction } from '@/features/link-upload/lib/actions/validate-link-access';

// File upload
import { uploadFileToLinkAction } from '@/features/link-upload/lib/actions/upload-to-link';

// Public file listing
import { fetchPublicFiles } from '@/features/link-upload/lib/actions/fetch-public-files';

// File download
import { downloadFileAction } from '@/features/link-upload/lib/actions/download-file';
```

## 💻 **Common Development Tasks**

### **1. Testing a Public Link**
```bash
# Navigate to a public link
http://localhost:3000/testuser
http://localhost:3000/testuser/portfolio
```

### **2. Creating a Test Link**
```typescript
// Create a test link in the database
const testLink = await db.insert(links).values({
  user_id: 'test-user-id',
  workspace_id: 'test-workspace-id',
  slug: 'testuser',
  topic: 'portfolio',
  link_type: 'custom',
  title: 'Portfolio Upload',
  is_active: true,
  require_password: false,
  require_email: true,
  max_files: 100,
  max_file_size: 10 * 1024 * 1024, // 10MB
});
```

### **3. Debugging Upload Issues**

Check these common areas:
1. **Link Status**: Is the link active and not expired?
2. **Storage Quota**: Does the user have available storage?
3. **File Constraints**: Does the file meet size/type requirements?
4. **Authentication**: Are password/email requirements met?

### **4. Adding New Features**

Follow the feature-based architecture:
```typescript
// 1. Add server action in lib/actions/
export async function myNewAction() {
  'use server';
  // Implementation
}

// 2. Add hook in hooks/
export function useMyNewFeature() {
  // Hook implementation
}

// 3. Update components as needed
```

## 🔐 **Security Checklist**

- [ ] Always validate link access before allowing uploads
- [ ] Check file size and type constraints
- [ ] Sanitize file names to prevent path traversal
- [ ] Enforce storage quotas at multiple levels
- [ ] Log upload attempts for security monitoring

## 📊 **Database Tables Used**

### **Primary Tables**
- `links` - Link configuration and settings
- `files` - Uploaded file records
- `batches` - Upload batch tracking
- `users` - User storage quotas

### **Key Queries**
```sql
-- Get link with owner info
SELECT l.*, u.username, u.storage_used 
FROM links l
JOIN users u ON l.user_id = u.id
WHERE l.slug = ? AND l.topic = ?;

-- Get public files for a link
SELECT * FROM files 
WHERE link_id = ? 
ORDER BY uploaded_at DESC;
```

## 🧪 **Testing Commands**

```bash
# Run tests for link-upload feature
npm test src/features/link-upload

# Test specific functionality
npm test -- --testNamePattern="upload validation"
```

## 🚨 **Common Errors & Solutions**

### **"Link not found"**
- Check URL format matches link type
- Verify link exists and is active

### **"Storage quota exceeded"**
- Check user's storage_used vs plan limit
- Verify link-specific storage limits

### **"File type not allowed"**
- Check link.allowed_file_types configuration
- Ensure MIME type validation is working

### **"Authentication required"**
- Check link.require_password or link.require_email
- Ensure AuthenticationModal is showing

## 📈 **Performance Tips**

1. **Use React Query caching** for public file lists
2. **Implement chunked uploads** for large files
3. **Optimize file tree rendering** with virtualization
4. **Cache storage calculations** to reduce DB queries

## 🔗 **Related Documentation**

- [Multi-Link System Guide](../implementation/01-MULTI_LINK_SYSTEM.md)
- [File Upload System Guide](../implementation/03-FILE_UPLOAD_SYSTEM.md)
- [Database Schema Reference](../database/SCHEMA_REFERENCE.md)

---

**Quick Reference Status**: 📋 **Complete** - Essential information for developers  
**Use Case**: Public file uploads to user links  
**Architecture**: Feature-based with server actions