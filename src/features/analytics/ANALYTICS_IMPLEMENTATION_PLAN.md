# Analytics Implementation Plan

## Overview
Comprehensive analytics system for the Foldly file-sharing platform to track user behavior, link performance, and platform health metrics.

## Phase 1: Foundation (Week 1-2)

### 1.1 Database Schema

#### Core Tables

```sql
-- 1. Add basic counters to existing links table
ALTER TABLE links 
ADD COLUMN IF NOT EXISTS total_views INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS unique_views INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMP WITH TIME ZONE;

-- 2. Create flexible analytics events table
CREATE TABLE analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Event identification
  event_type VARCHAR(50) NOT NULL,
  event_category VARCHAR(50),
  
  -- Associations (all optional for flexibility)
  link_id UUID REFERENCES links(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
  file_id UUID REFERENCES files(id) ON DELETE CASCADE,
  
  -- Event data (flexible JSON)
  properties JSONB,
  
  -- Visitor context
  visitor_id VARCHAR(16),
  session_id VARCHAR(32),
  country VARCHAR(2),
  region VARCHAR(100),
  city VARCHAR(100),
  device_type VARCHAR(20),
  browser VARCHAR(50),
  os VARCHAR(50),
  referrer TEXT,
  
  -- Timestamp
  occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create aggregated stats table (for performance)
CREATE TABLE link_analytics_summary (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  link_id UUID REFERENCES links(id) ON DELETE CASCADE,
  
  -- Time period
  period_type VARCHAR(10), -- 'hour', 'day', 'week', 'month'
  period_start TIMESTAMP WITH TIME ZONE,
  
  -- Metrics
  view_count INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  upload_sessions INTEGER DEFAULT 0,
  files_uploaded INTEGER DEFAULT 0,
  total_size_uploaded BIGINT DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  
  -- Conversion metrics
  view_to_upload_rate DECIMAL(5,2),
  avg_time_to_upload INTEGER, -- seconds
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(link_id, period_type, period_start)
);

-- Indexes for performance
CREATE INDEX idx_events_type_time ON analytics_events(event_type, occurred_at DESC);
CREATE INDEX idx_events_link_time ON analytics_events(link_id, occurred_at DESC);
CREATE INDEX idx_events_user_time ON analytics_events(user_id, occurred_at DESC);
CREATE INDEX idx_events_visitor ON analytics_events(visitor_id);
CREATE INDEX idx_events_properties ON analytics_events USING GIN(properties);
CREATE INDEX idx_summary_link_period ON link_analytics_summary(link_id, period_type, period_start DESC);
```

### 1.2 Event Types to Track

```typescript
enum AnalyticsEventType {
  // View events
  LINK_VIEWED = 'link_viewed',
  
  // Upload flow events
  UPLOAD_PAGE_VIEWED = 'upload_page_viewed',
  UPLOAD_STARTED = 'upload_started',
  UPLOAD_PROGRESS = 'upload_progress',
  UPLOAD_COMPLETED = 'upload_completed',
  UPLOAD_FAILED = 'upload_failed',
  
  // Interaction events
  LINK_COPIED = 'link_copied',
  QR_CODE_GENERATED = 'qr_generated',
  QR_CODE_DOWNLOADED = 'qr_downloaded',
  LINK_SHARED = 'link_shared',
  
  // File events
  FILE_DOWNLOADED = 'file_downloaded',
  FILE_DELETED = 'file_deleted',
  FILE_MOVED = 'file_moved',
  
  // Settings events
  LINK_SETTINGS_CHANGED = 'link_settings_changed',
  PASSWORD_ADDED = 'password_added',
  PASSWORD_REMOVED = 'password_removed',
  
  // Error events
  UPLOAD_ERROR = 'upload_error',
  QUOTA_EXCEEDED = 'quota_exceeded',
  LINK_EXPIRED_ACCESS = 'link_expired_access',
}
```

## Phase 2: Implementation (Week 2-3)

### 2.1 Server-Side Tracking

#### Core Analytics Service

```typescript
// src/features/analytics/lib/services/analytics-service.ts
import { db } from '@/lib/database/connection';
import { analyticsEvents } from '@/lib/database/schemas';
import { headers } from 'next/headers';
import UAParser from 'ua-parser-js';
import crypto from 'crypto';

export class AnalyticsService {
  static async trackEvent(params: {
    type: AnalyticsEventType;
    category?: string;
    linkId?: string;
    userId?: string;
    batchId?: string;
    fileId?: string;
    properties?: Record<string, any>;
    request?: Request;
  }) {
    try {
      const headersList = headers();
      
      // Parse user agent
      const userAgent = headersList.get('user-agent') || '';
      const parser = new UAParser(userAgent);
      const ua = parser.getResult();
      
      // Generate visitor ID (anonymous)
      const ip = headersList.get('x-forwarded-for') || '';
      const visitorId = crypto
        .createHash('sha256')
        .update(ip + userAgent)
        .digest('hex')
        .substring(0, 16);
      
      // Get geo data from Vercel headers
      const country = headersList.get('x-vercel-ip-country');
      const region = headersList.get('x-vercel-ip-country-region');
      const city = headersList.get('x-vercel-ip-city');
      
      // Insert event
      await db.insert(analyticsEvents).values({
        eventType: params.type,
        eventCategory: params.category,
        linkId: params.linkId,
        userId: params.userId,
        batchId: params.batchId,
        fileId: params.fileId,
        properties: params.properties,
        visitorId,
        sessionId: this.getSessionId(),
        country,
        region,
        city,
        deviceType: ua.device.type || 'desktop',
        browser: ua.browser.name,
        os: ua.os.name,
        referrer: headersList.get('referer'),
      });
      
      // Update real-time counters if it's a view event
      if (params.type === 'link_viewed' && params.linkId) {
        await this.updateLinkViewCount(params.linkId);
      }
    } catch (error) {
      console.error('Analytics tracking error:', error);
      // Don't throw - analytics should never break the app
    }
  }
  
  private static async updateLinkViewCount(linkId: string) {
    await db
      .update(links)
      .set({
        totalViews: sql`${links.totalViews} + 1`,
        lastViewedAt: new Date(),
      })
      .where(eq(links.id, linkId));
  }
}
```

#### Track Views in Public Link Page

```typescript
// app/[slug]/[[...topic]]/page.tsx
import { AnalyticsService } from '@/features/analytics/lib/services/analytics-service';

export default async function PublicLinkPage({ params }) {
  // Track view asynchronously
  AnalyticsService.trackEvent({
    type: 'link_viewed',
    category: 'engagement',
    linkId: link.id,
    properties: {
      slug: params.slug,
      topic: params.topic,
      hasPassword: link.requirePassword,
    }
  }).catch(console.error);
  
  // Rest of page...
}
```

### 2.2 Client-Side Tracking

#### React Hook for Event Tracking

```typescript
// src/features/analytics/hooks/use-analytics.ts
import { useCallback } from 'react';
import { trackEventAction } from '../lib/actions/track-event';

export function useAnalytics() {
  const trackEvent = useCallback(async (
    type: AnalyticsEventType,
    properties?: Record<string, any>
  ) => {
    try {
      await trackEventAction({
        type,
        properties,
        // Client-side context
        timestamp: new Date().toISOString(),
        url: window.location.href,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        }
      });
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }, []);
  
  return { trackEvent };
}
```

### 2.3 Aggregation & Performance

#### Cron Job for Aggregating Stats

```typescript
// app/api/cron/aggregate-analytics/route.ts
export async function GET(request: Request) {
  // Verify cron secret
  if (!verifyCronRequest(request)) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Aggregate last hour's data
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  const events = await db
    .select({
      linkId: analyticsEvents.linkId,
      eventType: analyticsEvents.eventType,
      visitorId: analyticsEvents.visitorId,
      count: count(),
    })
    .from(analyticsEvents)
    .where(gte(analyticsEvents.occurredAt, oneHourAgo))
    .groupBy(
      analyticsEvents.linkId,
      analyticsEvents.eventType,
      analyticsEvents.visitorId
    );
  
  // Process and store aggregated data
  for (const linkId of uniqueLinkIds) {
    const linkEvents = events.filter(e => e.linkId === linkId);
    
    await db.insert(linkAnalyticsSummary).values({
      linkId,
      periodType: 'hour',
      periodStart: oneHourAgo,
      viewCount: linkEvents.filter(e => e.eventType === 'link_viewed').length,
      uniqueVisitors: new Set(linkEvents.map(e => e.visitorId)).size,
      // ... other metrics
    }).onConflictDoUpdate({
      target: [linkAnalyticsSummary.linkId, linkAnalyticsSummary.periodType, linkAnalyticsSummary.periodStart],
      set: {
        viewCount: sql`EXCLUDED.view_count`,
        // ... update other fields
      }
    });
  }
  
  return NextResponse.json({ success: true });
}
```

## Phase 3: Analytics Dashboard (Week 3-4)

### 3.1 Dashboard Components

#### Main Analytics View

```typescript
// src/features/analytics/components/AnalyticsDashboard.tsx
export function AnalyticsDashboard({ linkId }: { linkId: string }) {
  const { data: analytics } = useAnalyticsQuery(linkId);
  
  return (
    <div className="analytics-dashboard">
      {/* Key Metrics */}
      <MetricsGrid metrics={analytics.summary} />
      
      {/* Conversion Funnel */}
      <ConversionFunnel data={analytics.funnel} />
      
      {/* Time Series Chart */}
      <ViewsChart data={analytics.timeSeries} />
      
      {/* Geographic Map */}
      <GeoMap data={analytics.geographic} />
      
      {/* Device Breakdown */}
      <DeviceBreakdown data={analytics.devices} />
      
      {/* Recent Activity */}
      <ActivityFeed events={analytics.recentEvents} />
    </div>
  );
}
```

### 3.2 Key Metrics to Display

1. **Engagement Metrics**
   - Total Views
   - Unique Visitors
   - Average Session Duration
   - Bounce Rate

2. **Conversion Metrics**
   - View to Upload Rate
   - Average Time to First Upload
   - Files per Upload Session
   - Repeat Uploaders

3. **Performance Metrics**
   - Upload Success Rate
   - Average Upload Speed
   - Error Rate
   - Storage Utilization

4. **Growth Metrics**
   - Daily Active Links
   - New vs Returning Visitors
   - Share Rate
   - Viral Coefficient

## Phase 4: Advanced Features (Week 4+)

### 4.1 Real-Time Analytics

```typescript
// Using Supabase Realtime
const channel = supabase
  .channel('analytics-updates')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'analytics_events',
    filter: `link_id=eq.${linkId}`
  }, (payload) => {
    // Update UI in real-time
    updateAnalytics(payload.new);
  })
  .subscribe();
```

### 4.2 Predictive Analytics

- Predict peak upload times
- Forecast storage needs
- Identify links likely to expire unused
- Detect anomalous activity patterns

### 4.3 A/B Testing Framework

```typescript
// Track experiments
interface Experiment {
  id: string;
  name: string;
  variants: string[];
  metrics: string[];
}

// Assign users to variants
function getVariant(experimentId: string, userId: string): string {
  const hash = hashString(experimentId + userId);
  return hash % 2 === 0 ? 'control' : 'variant';
}
```

## Phase 5: Privacy & Compliance

### 5.1 Privacy Features

- Anonymous visitor tracking (hashed IDs)
- Data retention policies (auto-delete after 90 days)
- GDPR compliance (right to deletion)
- Cookie consent management

### 5.2 Security Considerations

- Rate limiting on analytics endpoints
- Input validation for all tracked properties
- SQL injection prevention
- XSS protection in dashboard

## Performance Considerations

1. **Database Optimization**
   - Partition analytics_events table by month
   - Use materialized views for common queries
   - Index optimization based on query patterns

2. **Caching Strategy**
   - Cache aggregated stats for 5 minutes
   - Use Redis for real-time counters
   - CDN caching for dashboard assets

3. **Data Pipeline**
   - Queue events for batch processing
   - Use background jobs for heavy computations
   - Stream processing for real-time metrics

## Implementation Timeline

- **Week 1**: Database schema and migrations
- **Week 2**: Core tracking implementation
- **Week 3**: Basic dashboard UI
- **Week 4**: Advanced features and optimization
- **Ongoing**: Iterate based on usage patterns

## Success Metrics

- Analytics system adds <50ms latency to page loads
- Dashboard loads in <2 seconds
- 99.9% event capture rate
- <1% impact on database performance

## Future Enhancements

1. Machine learning for anomaly detection
2. Custom alerts and notifications
3. API for external analytics tools
4. Mobile app analytics SDK
5. Webhook integrations
6. Custom dashboard builder
7. Export to BigQuery/Snowflake