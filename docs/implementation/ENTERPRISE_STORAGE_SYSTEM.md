# Enterprise Storage System Implementation

> **Implementation Date**: January 2025  
> **Status**: ✅ Complete  
> **Impact**: Enterprise-grade storage management with security, reliability, and performance enhancements

## Overview

This document details the comprehensive enterprise storage system implementation that enhances Foldly's file storage capabilities with advanced quota management, automatic retry mechanisms, background processing, and maintenance services.

The system consists of five major components:

1. **Enterprise-Level Quota Checking System** - Real-time quota enforcement with security auditing
2. **Upload Retry Logic** - Intelligent retry mechanism with exponential backoff
3. **Storage Cleanup Service** - Automated cleanup of partial uploads and orphaned files
4. **Background Storage Service** - Asynchronous storage usage updates for performance
5. **Security Enhancements** - Comprehensive audit logging and rate limiting

---

## 🛡️ Enterprise-Level Quota Checking System

### Overview

The quota checking system (`/src/lib/services/storage/storage-quota-service.ts`) provides enterprise-grade storage management with real-time plan verification through Clerk integration, comprehensive security checks, and detailed audit logging.

### Key Features

#### 1. **Real-Time Plan Verification**

```typescript
// Integration with Clerk for live plan detection
const planType = await ClerkBillingIntegrationService.getCurrentUserPlan();
const storageLimit = this.getStorageLimitForPlan(planType);

// Storage limits by plan
private getStorageLimitForPlan(plan: string): number {
  switch (plan) {
    case 'free': return 50 * 1024 * 1024 * 1024;      // 50 GB
    case 'pro': return 500 * 1024 * 1024 * 1024;      // 500 GB
    case 'business': return 2 * 1024 * 1024 * 1024 * 1024; // 2 TB
    default: return 50 * 1024 * 1024 * 1024;
  }
}
```

#### 2. **Rate Limiting Protection**

- **Limit**: 10 uploads per minute per user
- **Window**: 60-second rolling window
- **Implementation**: In-memory tracking with automatic cleanup

```typescript
// Rate limit check
const now = Date.now();
const userAttempts = StorageQuotaService.uploadAttempts.get(userId) || [];
const recentAttempts = userAttempts.filter(
  timestamp => now - timestamp < StorageQuotaService.RATE_LIMIT_WINDOW
);

if (recentAttempts.length >= StorageQuotaService.MAX_UPLOADS_PER_MINUTE) {
  return {
    allowed: false,
    error: 'Rate limit exceeded. Maximum 10 uploads per minute.',
    securityChecks: { rateLimitPassed: false }
  };
}
```

#### 3. **Security Audit Logging**

Every quota check generates a comprehensive audit log:

```typescript
interface QuotaAuditLog {
  userId: string;
  action: 'quota_check' | 'storage_update';
  fileSize: number;
  result: 'allowed' | 'denied';
  reason?: string;
  planType: string;
  timestamp: Date;
  ip?: string;  // Client IP for security tracking
}
```

#### 4. **No Bypass Mechanisms**

- All quota checks are enforced without exceptions
- No backdoors or admin overrides
- Consistent enforcement across all upload paths
- Server-side validation prevents client manipulation

### Usage Example

```typescript
import { storageQuotaService } from '@/lib/services/storage';

// Check quota before upload
const quotaCheck = await storageQuotaService.checkUserQuota(
  userId,
  fileSize,
  clientIp
);

if (!quotaCheck.success || !quotaCheck.data?.allowed) {
  throw new Error(quotaCheck.data?.error || 'Storage quota exceeded');
}

// Proceed with upload...
```

### Security Considerations

1. **Double Validation**: Quota checked both client and server-side
2. **IP Tracking**: All requests logged with client IP for audit trails
3. **Plan Verification**: Real-time verification prevents subscription fraud
4. **Rate Limiting**: Prevents abuse and ensures fair usage

---

## 🔄 Upload Retry Logic

### Overview

The upload retry system (`/src/features/workspace/hooks/use-file-upload.ts`) provides automatic retry capabilities for failed uploads with intelligent error detection and exponential backoff strategies.

### Key Features

#### 1. **Automatic Retry Detection**

Retryable errors are automatically identified:

```typescript
const isRetryableError = 
  errorMessage.includes('Network error') ||
  errorMessage.includes('status 502') ||
  errorMessage.includes('status 503') ||
  errorMessage.includes('timeout');
```

#### 2. **Exponential Backoff Strategy**

```typescript
// Exponential backoff with maximum delay
const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
// Delays: 1s, 2s, 4s, 8s, 10s (max)
```

#### 3. **Retry Configuration**

- **Maximum Retries**: 3 attempts per file
- **Retry Count Tracking**: Visual feedback in UI
- **State Preservation**: Upload progress maintained between retries

#### 4. **Parallel Batch Processing**

```typescript
// Process files in batches for optimal performance
const BATCH_SIZE = 3;
const batches = [];
for (let i = 0; i < files.length; i += BATCH_SIZE) {
  batches.push(files.slice(i, i + BATCH_SIZE));
}

// Upload batches sequentially, files within batch in parallel
for (const batch of batches) {
  await Promise.all(
    batch.map(file => uploadSingleFile(file))
  );
}
```

### User Experience

1. **Visual Feedback**: Users see retry attempts in real-time
2. **Progress Preservation**: Upload doesn't restart from zero
3. **Error Messages**: Clear indication of retry status
4. **Final Failure**: Detailed error after all retries exhausted

---

## 🧹 Storage Cleanup Service

### Overview

The cleanup service (`/src/lib/services/storage/storage-cleanup-service.ts`) maintains storage health by removing partial uploads and orphaned files that may accumulate due to interrupted uploads or system errors.

### Key Features

#### 1. **Partial Upload Detection**

Identifies incomplete uploads older than 24 hours:

```typescript
const partialFiles = await db
  .select()
  .from(files)
  .where(
    and(
      isNull(files.checksum),  // No checksum = incomplete
      lt(files.uploadedAt, cutoffTime),
      eq(files.processingStatus, 'pending')
    )
  );
```

#### 2. **Orphaned File Removal**

Cleans files that exist in storage but not in database:

```typescript
// List all files in storage bucket
const { data: storageFiles } = await supabase.storage
  .from('user-uploads')
  .list('', { limit: 1000, offset });

// Cross-reference with database
const orphaned = storageFiles.filter(
  file => !dbPaths.has(file.name)
);
```

#### 3. **Safe Deletion Process**

- Transaction-based cleanup for consistency
- Storage usage updates after cleanup
- Detailed logging of all operations
- Dry-run capability for testing

#### 4. **API Endpoint Integration**

```typescript
// Cron job endpoint: /api/cron/storage-cleanup
export async function GET(request: Request) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const result = await storageCleanupService.runFullCleanup();
  return Response.json(result);
}
```

### Scheduled Cleanup

Configure with your hosting provider's cron service:

```bash
# Daily cleanup at 3 AM UTC
0 3 * * * curl -H "Authorization: Bearer $CRON_SECRET" https://yourdomain.com/api/cron/storage-cleanup
```

---

## ⚡ Background Storage Service

### Overview

The background service (`/src/lib/services/storage/storage-background-service.ts`) optimizes upload performance by queuing storage usage updates for asynchronous processing, preventing database bottlenecks during bulk uploads.

### Key Features

#### 1. **Queue-Based Updates**

```typescript
// Queue updates instead of immediate database writes
queueStorageUpdate(userId: string, bytesToAdd: number): void {
  const currentBytes = this.updateQueue.get(userId) || 0;
  this.updateQueue.set(userId, currentBytes + bytesToAdd);
}
```

#### 2. **Batch Processing**

- **Interval**: Processes queue every 5 seconds
- **Batching**: Combines multiple updates per user
- **Efficiency**: Single database update per user per cycle

```typescript
// Process all queued updates in one transaction
await db.transaction(async (tx) => {
  for (const [userId, bytes] of updates) {
    await tx
      .update(users)
      .set({
        storageUsed: sql`${users.storageUsed} + ${bytes}`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }
});
```

#### 3. **Graceful Shutdown**

```typescript
// Flush pending updates on shutdown
async shutdown(): Promise<void> {
  this.stopProcessing();
  
  if (this.updateQueue.size > 0) {
    console.log('Flushing pending storage updates...');
    await this.processQueue();
  }
}

// Register shutdown handler
process.on('SIGTERM', () => {
  storageBackgroundService.shutdown();
});
```

#### 4. **Error Resilience**

- Failed updates are retried in next cycle
- Individual user failures don't affect others
- Detailed error logging for debugging

### Performance Benefits

1. **Reduced Latency**: Uploads complete faster without waiting for DB updates
2. **Better Throughput**: Bulk operations handle high upload volumes
3. **Database Efficiency**: Fewer write operations reduce lock contention
4. **Scalability**: Queue can handle thousands of concurrent uploads

---

## 🔐 Security Enhancements

### Client IP Extraction

Robust IP extraction for various deployment scenarios:

```typescript
function extractClientIp(request: Request): string | undefined {
  const headers = request.headers;
  
  // Check various headers in order of preference
  const ipHeaders = [
    'x-real-ip',
    'x-forwarded-for',
    'x-client-ip',
    'cf-connecting-ip',  // Cloudflare
    'x-vercel-forwarded-for',  // Vercel
  ];

  for (const header of ipHeaders) {
    const value = headers.get(header);
    if (value) {
      // Handle comma-separated list (first IP is client)
      return value.split(',')[0].trim();
    }
  }

  return undefined;
}
```

### Comprehensive Audit Trail

Every storage operation generates audit logs with:

1. **User Identification**: User ID and plan type
2. **Action Details**: Operation type and parameters
3. **Security Context**: IP address and timestamp
4. **Result Tracking**: Success/failure with reasons
5. **Quota Information**: Current usage and limits

### Integration Points

1. **Clerk Authentication**: All requests validated through Clerk
2. **Supabase RLS**: Row-level security on all database operations
3. **Service Role Keys**: Admin operations use secure service keys
4. **Environment Validation**: All services verify required env vars

---

## 📊 Monitoring and Observability

### Key Metrics to Track

1. **Quota Checks**
   - Total checks per hour
   - Denial rate by plan type
   - Rate limit violations

2. **Upload Performance**
   - Average retry count
   - Success rate by attempt
   - Time to successful upload

3. **Cleanup Operations**
   - Files cleaned per run
   - Storage recovered
   - Orphaned file detection rate

4. **Background Processing**
   - Queue depth over time
   - Processing latency
   - Update batch sizes

### Logging Strategy

```typescript
// Structured logging for better analysis
console.log(JSON.stringify({
  service: 'storage-quota',
  action: 'quota_check',
  userId,
  result: quotaResult.allowed ? 'allowed' : 'denied',
  planType,
  storageUsed,
  storageLimit,
  fileSize,
  timestamp: new Date().toISOString(),
  ip: clientIp,
}));
```

---

## 🚀 Implementation Guide

### 1. Environment Variables

Required environment variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Security
CRON_SECRET=your-secure-cron-secret

# Database
DATABASE_URL=your-database-url
```

### 2. Service Initialization

```typescript
// Initialize services on application start
import { storageQuotaService } from '@/lib/services/storage/storage-quota-service';
import { storageBackgroundService } from '@/lib/services/storage/storage-background-service';
import { storageCleanupService } from '@/lib/services/storage/storage-cleanup-service';

// Services are singleton instances, automatically initialized
```

### 3. Integration Points

#### Upload Flow Integration

```typescript
// In your upload handler
export async function uploadFile(request: Request) {
  const { userId, file } = await parseRequest(request);
  const clientIp = extractClientIp(request);
  
  // 1. Check quota
  const quotaCheck = await storageQuotaService.checkUserQuota(
    userId,
    file.size,
    clientIp
  );
  
  if (!quotaCheck.success || !quotaCheck.data?.allowed) {
    return Response.json(
      { error: quotaCheck.data?.error },
      { status: 403 }
    );
  }
  
  // 2. Upload file (with retry logic in client)
  const result = await uploadToStorage(file);
  
  // 3. Queue storage update (non-blocking)
  storageBackgroundService.queueStorageUpdate(userId, file.size);
  
  return Response.json({ success: true, fileId: result.id });
}
```

#### Cleanup Cron Setup

```typescript
// app/api/cron/storage-cleanup/route.ts
import { storageCleanupService } from '@/lib/services/storage/storage-cleanup-service';

export async function GET(request: Request) {
  // Verify cron authentication
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  try {
    const result = await storageCleanupService.runFullCleanup();
    return Response.json({
      success: true,
      cleaned: result.data?.cleaned || 0,
      orphaned: result.data?.orphaned || 0,
    });
  } catch (error) {
    return Response.json(
      { success: false, error: 'Cleanup failed' },
      { status: 500 }
    );
  }
}
```

---

## 🧪 Testing Considerations

### Unit Testing

```typescript
// Test quota enforcement
describe('StorageQuotaService', () => {
  it('should enforce storage limits', async () => {
    const result = await storageQuotaService.checkUserQuota(
      'user-123',
      100 * 1024 * 1024 * 1024, // 100GB
      '192.168.1.1'
    );
    
    expect(result.data?.allowed).toBe(false);
    expect(result.data?.error).toContain('exceeds available space');
  });
  
  it('should enforce rate limits', async () => {
    // Simulate 11 rapid requests
    for (let i = 0; i < 11; i++) {
      await storageQuotaService.checkUserQuota('user-123', 1024, '192.168.1.1');
    }
    
    const result = await storageQuotaService.checkUserQuota('user-123', 1024, '192.168.1.1');
    expect(result.data?.allowed).toBe(false);
    expect(result.data?.error).toContain('Rate limit exceeded');
  });
});
```

### Integration Testing

```typescript
// Test full upload flow with retries
describe('Upload with retry', () => {
  it('should retry on network errors', async () => {
    // Mock network failure then success
    mockUploadApi
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ success: true });
    
    const result = await uploadWithRetry(file);
    expect(result.success).toBe(true);
    expect(mockUploadApi).toHaveBeenCalledTimes(2);
  });
});
```

---

## 🔧 Troubleshooting

### Common Issues

1. **Rate Limit Errors**
   - **Symptom**: "Rate limit exceeded" errors
   - **Solution**: Implement client-side throttling or increase limit

2. **Storage Updates Delayed**
   - **Symptom**: Usage not updating immediately
   - **Solution**: Check background service logs, ensure it's running

3. **Cleanup Not Running**
   - **Symptom**: Storage usage growing beyond actual files
   - **Solution**: Verify cron job configuration and CRON_SECRET

4. **Quota Check Failures**
   - **Symptom**: Uploads failing with quota errors
   - **Solution**: Check Clerk integration and plan detection

### Debug Mode

Enable detailed logging:

```typescript
// Set in environment
STORAGE_DEBUG=true

// In services
if (process.env.STORAGE_DEBUG) {
  console.log('Detailed quota check:', {
    userId,
    fileSize,
    storageUsed,
    storageLimit,
    planType,
    checks: securityChecks,
  });
}
```

---

## 📈 Future Enhancements

### Planned Improvements

1. **Predictive Quota Warnings**
   - Alert users when approaching limits
   - Suggest upgrade paths proactively

2. **Smart Compression**
   - Automatic file optimization
   - Format conversion for efficiency

3. **Global CDN Integration**
   - Edge caching for faster access
   - Geographic redundancy

4. **Advanced Analytics**
   - Usage patterns and trends
   - Cost optimization recommendations

5. **Multi-Region Support**
   - Storage location selection
   - Compliance with data residency

---

## Related Documentation

- [Storage Tracking and Modal System](./STORAGE_TRACKING_AND_MODAL_SYSTEM.md)
- [Service Integration Guide](./SERVICE_INTEGRATION_GUIDE.md)
- [Billing Feature Documentation](../billing/BILLING_FEATURE_FIXES_SUMMARY.md)
- [Database Architecture](../database/SCHEMA_REFERENCE.md)