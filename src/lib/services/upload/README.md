# Upload Service Architecture

## Overview

This directory contains the unified upload service layer that coordinates file uploads across the application. The architecture follows a progressive enhancement strategy: starting with a lightweight manager that integrates with existing services, with a clear path to a full enterprise-grade upload pipeline when scale demands it.

## Current Database Architecture

### Core Tables
- **files**: Main file storage (id, file_name, file_size, storage_path, processing_status)
- **batches**: Upload batch tracking (id, status, total_files, processed_files)
- **folders**: Hierarchical organization (id, workspace_id, link_id, path)
- **links**: Share links with upload capabilities (id, storage_limit, storage_used)
- **workspaces**: User file spaces (id, user_id)
- **users**: User accounts with storage_used tracking

### Upload Flow
1. **Validation**: Check user quota via `canUserUpload()`
2. **Storage**: Upload to Supabase Storage bucket
3. **Database**: Create file record with proper context (workspace/link)
4. **Tracking**: Update storage usage on user/link records
5. **Notification**: Emit events via notification system

## Phase 1: Lightweight Upload Manager (Current Implementation)

### Architecture
```
┌─────────────────┐
│   UI Components │
└────────┬────────┘
         │
    ┌────▼────┐
    │  Hooks  │ (useFileUpload)
    └────┬────┘
         │
┌────────▼────────┐      ┌──────────────────┐
│ Upload Manager  │◄─────►│ Event Bus        │
│ (Coordinator)   │      │ (Notifications)  │
└────────┬────────┘      └──────────────────┘
         │
    ┌────▼────┐
    │Services │ (Existing upload actions)
    └────┬────┘
         │
    ┌────▼────┐
    │Supabase │ (Storage + Database)
    └─────────┘
```

### Key Features
- **Centralized coordination** without replacing existing services
- **AbortController support** for upload cancellation
- **Event-driven notifications** using existing event bus
- **Progress tracking** with real XMLHttpRequest implementation
- **Retry logic** with exponential backoff
- **Context-aware routing** (workspace vs link uploads)

### Implementation Details

#### UploadManager Class
```typescript
class UploadManager {
  // Singleton instance for global upload tracking
  private uploads: Map<string, UploadHandle>
  
  // Core methods
  upload(file: File, context: UploadContext): Promise<string>
  cancel(uploadId: string): void
  getProgress(uploadId: string): number
  retry(uploadId: string): Promise<void>
  
  // Event emission via existing notification system
  private emitProgress(uploadId: string, progress: number): void
  private emitComplete(uploadId: string, result: UploadResult): void
}
```

#### UploadHandle Structure
```typescript
interface UploadHandle {
  id: string
  file: File
  context: UploadContext
  controller: AbortController
  xhr?: XMLHttpRequest
  progress: number
  status: UploadStatus
  startTime: number
  retryCount: number
}
```

#### Integration Points
1. **Workspace Uploads**: Routes through `uploadFileAction()`
2. **Link Uploads**: Routes through `uploadFileToLinkAction()`
3. **Storage Service**: Uses `uploadFileWithTracking()`
4. **Notifications**: Emits to existing event bus

### Migration Strategy
```typescript
// Before (Direct service calls)
await uploadFileAction(file, workspaceId, folderId);

// After (Through manager)
const uploadManager = UploadManager.getInstance();
await uploadManager.upload(file, {
  type: 'workspace',
  workspaceId,
  folderId
});
```

### Benefits
- ✅ **Minimal refactoring** - Works with existing code
- ✅ **Cancellation support** - AbortController integration
- ✅ **Real progress** - XMLHttpRequest for actual progress
- ✅ **Centralized tracking** - Single source of truth
- ✅ **Event-driven UI** - Automatic notification updates

## Phase 2: Full Upload Pipeline (Future Architecture)

### When to Implement
Trigger points for full refactor:
- User base exceeds **10,000 active users**
- Upload volume exceeds **1TB/month**
- Concurrent uploads exceed **100/minute**
- Reliability requirements reach **99.9% SLA**
- Need for advanced features (chunking, resume, deduplication)

### Architecture
```
┌─────────────────┐
│   UI Components │
└────────┬────────┘
         │
    ┌────▼────┐
    │  Hooks  │
    └────┬────┘
         │
┌────────▼────────┐      ┌──────────────────┐
│ Upload Pipeline │◄─────►│ Message Queue    │
│   (Orchestrator)│      │ (Redis/RabbitMQ) │
└────────┬────────┘      └──────────────────┘
         │
    ┌────▼────┐          ┌──────────────────┐
    │ Workers │◄─────────►│ CDN/Edge Storage │
    └────┬────┘          └──────────────────┘
         │
    ┌────▼────┐          ┌──────────────────┐
    │Database │◄─────────►│ Cache Layer      │
    └─────────┘          └──────────────────┘
```

### Advanced Features

#### 1. Chunked Upload System
```typescript
interface ChunkedUpload {
  uploadId: string
  chunks: ChunkMetadata[]
  assemblyStatus: 'pending' | 'processing' | 'complete'
  checksums: Map<number, string>
}

class ChunkManager {
  splitFile(file: File, chunkSize: number): Chunk[]
  uploadChunk(chunk: Chunk, retries: number): Promise<void>
  assembleChunks(uploadId: string): Promise<void>
  verifyIntegrity(uploadId: string): Promise<boolean>
}
```

#### 2. Queue Management
```typescript
interface UploadQueue {
  add(job: UploadJob): Promise<void>
  process(): Promise<void>
  prioritize(uploadId: string): void
  pause(): void
  resume(): void
  
  // Advanced queue features
  setBandwidthLimit(bytesPerSecond: number): void
  setParallelism(maxConcurrent: number): void
  getQueueMetrics(): QueueMetrics
}
```

#### 3. Resumable Uploads
```typescript
interface ResumableUpload {
  uploadId: string
  sessionToken: string
  uploadedChunks: Set<number>
  lastActivity: Date
  expiresAt: Date
  
  resume(): Promise<void>
  getProgress(): UploadProgress
  extendSession(): Promise<void>
}
```

#### 4. Deduplication Service
```typescript
interface DeduplicationService {
  checksum(file: File): Promise<string>
  exists(checksum: string): Promise<boolean>
  link(checksum: string, targetPath: string): Promise<void>
  
  // Content-aware deduplication
  findSimilar(file: File): Promise<SimilarFile[]>
  suggestDedupe(files: File[]): DedupeStrategy
}
```

#### 5. Multi-Region Support
```typescript
interface RegionManager {
  selectOptimalRegion(userLocation: GeoPoint): Region
  replicateAcrossRegions(fileId: string, regions: Region[]): Promise<void>
  handleFailover(region: Region): Promise<void>
  
  // Edge optimization
  cacheAtEdge(fileId: string, locations: EdgeLocation[]): Promise<void>
  purgeFromEdge(fileId: string): Promise<void>
}
```

### Database Schema Enhancements

#### New Tables Required
```sql
-- Upload sessions for resumable uploads
CREATE TABLE upload_sessions (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  file_hash TEXT NOT NULL,
  total_size BIGINT NOT NULL,
  uploaded_size BIGINT NOT NULL,
  chunk_size INTEGER NOT NULL,
  completed_chunks JSONB,
  status upload_session_status NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Upload chunks for chunked uploads
CREATE TABLE upload_chunks (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES upload_sessions(id),
  chunk_index INTEGER NOT NULL,
  chunk_size BIGINT NOT NULL,
  checksum TEXT NOT NULL,
  storage_path TEXT,
  uploaded_at TIMESTAMPTZ,
  UNIQUE(session_id, chunk_index)
);

-- File deduplication tracking
CREATE TABLE file_checksums (
  checksum TEXT PRIMARY KEY,
  file_size BIGINT NOT NULL,
  storage_path TEXT NOT NULL,
  reference_count INTEGER DEFAULT 1,
  first_seen_at TIMESTAMPTZ DEFAULT NOW()
);

-- Upload metrics for analytics
CREATE TABLE upload_metrics (
  id UUID PRIMARY KEY,
  upload_id UUID NOT NULL,
  metric_type TEXT NOT NULL,
  value JSONB NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Performance Optimizations

#### 1. Connection Pooling
```typescript
class ConnectionPool {
  private pool: UploadConnection[]
  private maxConnections: number
  
  acquire(): Promise<UploadConnection>
  release(conn: UploadConnection): void
  
  // Adaptive pooling
  adjustPoolSize(metrics: PerformanceMetrics): void
  handleConnectionFailure(conn: UploadConnection): void
}
```

#### 2. Bandwidth Management
```typescript
class BandwidthManager {
  private currentUsage: number
  private limits: Map<UserId, number>
  
  allocateBandwidth(uploadId: string): number
  throttle(uploadId: string, bytesPerSecond: number): void
  
  // Fair queuing
  distributeFairly(uploads: Upload[]): BandwidthAllocation[]
  prioritizePremiumUsers(uploads: Upload[]): void
}
```

#### 3. Caching Strategy
```typescript
interface CacheStrategy {
  // Multi-tier caching
  l1Cache: MemoryCache      // In-memory (Redis)
  l2Cache: DiskCache        // Local disk
  l3Cache: CDNCache         // Edge locations
  
  get(key: string): Promise<CachedItem | null>
  set(key: string, value: any, ttl?: number): Promise<void>
  invalidate(pattern: string): Promise<void>
  
  // Smart caching
  preload(predictions: PredictedAccess[]): Promise<void>
  evict(strategy: EvictionStrategy): Promise<void>
}
```

### Monitoring & Analytics

#### Key Metrics to Track
```typescript
interface UploadMetrics {
  // Performance metrics
  uploadSpeed: number[]           // bytes/second over time
  successRate: number             // percentage
  avgUploadTime: number           // milliseconds
  p95UploadTime: number          // 95th percentile
  
  // Reliability metrics
  retryRate: number              // retries per upload
  failureReasons: Map<string, number>
  timeoutRate: number
  
  // Business metrics
  totalUploads: number
  totalBytes: number
  uniqueUsers: number
  peakConcurrency: number
  
  // Infrastructure metrics
  storageUtilization: number
  bandwidthUsage: number
  queueDepth: number
  workerUtilization: number
}
```

#### Monitoring Implementation
```typescript
class UploadMonitor {
  collectMetrics(): UploadMetrics
  detectAnomalies(): Anomaly[]
  generateAlerts(threshold: AlertThreshold): Alert[]
  
  // Real-time dashboards
  streamMetrics(ws: WebSocket): void
  exportToPrometheus(): PrometheusMetrics
  exportToDatadog(): DatadogMetrics
}
```

### Security Enhancements

#### 1. Virus Scanning
```typescript
interface VirusScanService {
  scan(file: File): Promise<ScanResult>
  quarantine(fileId: string): Promise<void>
  whitelist(checksum: string): void
  
  // Real-time protection
  scanStream(stream: ReadableStream): Promise<ScanResult>
  updateDefinitions(): Promise<void>
}
```

#### 2. Content Validation
```typescript
interface ContentValidator {
  validateMimeType(file: File): boolean
  detectMaliciousPatterns(content: Buffer): MaliciousPattern[]
  sanitizeMetadata(file: File): File
  
  // Advanced validation
  checkEmbeddedScripts(file: File): SecurityRisk[]
  validateImageDimensions(file: File): boolean
  enforceNamingConventions(filename: string): string
}
```

### Cost Optimization

#### Storage Tiering
```typescript
interface StorageTier {
  hot: 'immediate',    // Frequently accessed (SSD)
  warm: '1-hour',      // Regular access (HDD)
  cold: '12-hours',    // Infrequent access (Glacier)
  archive: '24-hours'  // Long-term storage (Deep Archive)
}

class StorageTieringService {
  analyzeAccessPatterns(fileId: string): AccessPattern
  recommendTier(pattern: AccessPattern): StorageTier
  migrate(fileId: string, targetTier: StorageTier): Promise<void>
  
  // Automatic tiering
  enableAutoTiering(rules: TieringRules): void
  calculateSavings(): CostSavings
}
```

### Migration Path

#### Phase 2.1: Queue System (3-4 weeks)
1. Implement Redis queue for upload jobs
2. Create worker pool for processing
3. Add retry logic with dead letter queue
4. Implement priority queuing

#### Phase 2.2: Chunked Uploads (2-3 weeks)
1. Implement file chunking algorithm
2. Create chunk upload endpoints
3. Add chunk assembly service
4. Implement integrity verification

#### Phase 2.3: Resumable Uploads (2 weeks)
1. Create session management
2. Implement progress persistence
3. Add resume capability
4. Handle session expiration

#### Phase 2.4: Deduplication (2 weeks)
1. Implement checksum calculation
2. Create deduplication database
3. Add content linking
4. Implement reference counting

#### Phase 2.5: CDN Integration (1-2 weeks)
1. Select CDN provider
2. Implement edge upload
3. Add cache invalidation
4. Setup monitoring

### Success Metrics

#### Technical Metrics
- Upload success rate > 99.9%
- Average upload speed > 10 MB/s
- P95 latency < 2 seconds
- Retry rate < 1%
- Deduplication ratio > 20%

#### Business Metrics
- User satisfaction score > 4.5/5
- Support tickets < 0.1% of uploads
- Storage costs reduced by 30%
- Bandwidth costs reduced by 25%

### Technology Stack

#### Current (Lightweight)
- **Runtime**: Node.js with native APIs
- **Storage**: Supabase Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Events**: Custom event bus
- **Progress**: XMLHttpRequest

#### Future (Enterprise)
- **Queue**: Redis/BullMQ or RabbitMQ
- **Workers**: Node.js cluster or containerized workers
- **Storage**: S3 with CloudFront CDN
- **Database**: PostgreSQL with read replicas
- **Cache**: Redis with clustering
- **Monitoring**: Prometheus + Grafana
- **Tracing**: OpenTelemetry
- **Stream Processing**: Apache Kafka (optional)

### Development Guidelines

#### Code Organization
```
src/lib/services/upload/
├── README.md                 # This file
├── index.ts                  # Public API exports
├── upload-manager.ts         # Main coordinator
├── types/                    # TypeScript definitions
│   ├── upload.types.ts
│   ├── context.types.ts
│   └── events.types.ts
├── handlers/                 # Context-specific handlers
│   ├── workspace-handler.ts
│   ├── link-handler.ts
│   └── base-handler.ts
├── utils/                    # Utility functions
│   ├── progress-tracker.ts
│   ├── retry-logic.ts
│   └── validation.ts
├── adapters/                 # Storage adapters
│   ├── supabase-adapter.ts
│   └── s3-adapter.ts
└── __tests__/               # Test files
    ├── upload-manager.test.ts
    └── handlers.test.ts
```

#### Best Practices
1. **Single Responsibility**: Each class/function has one clear purpose
2. **Dependency Injection**: Services receive dependencies, don't create them
3. **Event-Driven**: Use events for cross-cutting concerns
4. **Type Safety**: Full TypeScript coverage with strict mode
5. **Error Handling**: Graceful degradation with detailed logging
6. **Testing**: Unit tests for logic, integration tests for flows
7. **Documentation**: JSDoc comments for public APIs
8. **Performance**: Profile before optimizing

### Rollback Strategy

If issues arise with the new upload system:

1. **Feature flag control**: Toggle via environment variable
2. **Gradual rollout**: Percentage-based user allocation
3. **Instant revert**: One-line change to use old system
4. **Data compatibility**: Both systems use same database schema
5. **Zero downtime**: No migration required for rollback

### Support & Maintenance

#### Logging Strategy
```typescript
// Structured logging for debugging
logger.info('Upload started', {
  uploadId,
  userId,
  fileSize,
  context: uploadContext,
  timestamp: Date.now()
});

// Performance tracking
logger.metric('upload.duration', duration, {
  fileSize,
  uploadSpeed: fileSize / duration
});

// Error tracking with context
logger.error('Upload failed', error, {
  uploadId,
  retryCount,
  failureReason: error.code
});
```

#### Monitoring Alerts
- Upload success rate drops below 95%
- Average upload time exceeds 30 seconds
- Queue depth exceeds 1000 items
- Storage usage exceeds 80%
- Error rate spikes above baseline

### Conclusion

This architecture provides a clear evolution path from a lightweight upload manager that solves immediate needs (cancellation, progress, centralization) to a full enterprise-grade upload pipeline when scale demands it. The lightweight approach can be implemented in 3-4 hours and provides immediate value, while the full pipeline represents a 2-3 month project that would handle millions of uploads per day.

The key insight is that both architectures share the same interfaces and event system, making the transition seamless when the time comes. Start lightweight, measure everything, and evolve based on actual needs rather than anticipated ones.