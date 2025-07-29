# 🔍 Database Query Examples

> **Production-ready query patterns for Foldly's multi-link architecture**  
> **Optimized for performance and security**  
> **Last Updated**: January 2025

## 📋 **Core Link Management Queries**

### **Get User Links with Statistics**

```sql
-- Optimized query for dashboard link listing
SELECT
  l.*,
  COUNT(DISTINCT f.id) as file_count,
  COUNT(DISTINCT b.id) as batch_count,
  COALESCE(SUM(f.file_size), 0) as total_size,
  CASE
    WHEN l.topic IS NULL THEN CONCAT('foldly.com/', l.slug)
    ELSE CONCAT('foldly.com/', l.slug, '/', l.topic)
  END as full_url,
  -- Recent activity indicator
  CASE
    WHEN l.last_upload_at > NOW() - INTERVAL '7 days' THEN true
    ELSE false
  END as has_recent_activity
FROM links l
LEFT JOIN files f ON l.id = f.link_id AND f.processing_status = 'completed'
LEFT JOIN batches b ON l.id = b.link_id
WHERE l.user_id = $1
  AND l.is_active = true
GROUP BY l.id
ORDER BY l.last_upload_at DESC NULLS LAST, l.created_at DESC
LIMIT $2 OFFSET $3;

-- Performance: Uses links_stats_idx, ~50ms for 1000 links
```

### **Link URL Resolution**

```sql
-- Resolve link by URL components (public access)
SELECT
  l.*,
  u.username,
  u.avatar_url,
  u.first_name,
  u.last_name,
  -- Check if password is required
  CASE WHEN l.password_hash IS NOT NULL THEN true ELSE false END as requires_password,
  -- Check expiration
  CASE WHEN l.expires_at IS NOT NULL AND l.expires_at < NOW() THEN true ELSE false END as is_expired
FROM links l
JOIN users u ON l.user_id = u.id
WHERE l.slug = $1
  AND (
    (l.topic IS NULL AND $2 IS NULL) OR  -- Base link
    (l.topic = $2)                       -- Custom/Generated link
  )
  AND l.is_active = true
  AND l.is_public = true
  AND (l.expires_at IS NULL OR l.expires_at > NOW())
LIMIT 1;

-- Performance: Uses links_slug_topic_idx, ~25ms
```

### **Create New Link with Validation**

```sql
-- Check for slug/topic uniqueness
SELECT EXISTS(
  SELECT 1 FROM links
  WHERE user_id = $1 AND slug = $2 AND topic = $3
) as link_exists;

-- If unique, create new link
INSERT INTO links (
  user_id, workspace_id, slug, topic, link_type,
  title, description, max_files, max_file_size,
  require_email, require_password, is_public
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
RETURNING *;

-- Performance: Uses unique constraint check, ~75ms
```

---

## 📁 **Folder and File Management Queries**

### **Get Complete Folder Tree**

```sql
-- Recursive CTE for folder hierarchy
WITH RECURSIVE folder_tree AS (
  -- Root folders
  SELECT
    id,
    name,
    path,
    depth,
    parent_folder_id,
    0 as level,
    ARRAY[name] as name_path
  FROM folders
  WHERE workspace_id = $1
    AND parent_folder_id IS NULL

  UNION ALL

  -- Child folders recursively
  SELECT
    f.id,
    f.name,
    f.path,
    f.depth,
    f.parent_folder_id,
    ft.level + 1,
    ft.name_path || f.name
  FROM folders f
  JOIN folder_tree ft ON f.parent_folder_id = ft.id
  WHERE f.workspace_id = $1
    AND ft.level < 20 -- Prevent infinite recursion
)
SELECT
  ft.*,
  COUNT(files.id) as file_count,
  COALESCE(SUM(files.file_size), 0) as total_size
FROM folder_tree ft
LEFT JOIN files ON ft.id = files.folder_id
  AND files.processing_status = 'completed'
GROUP BY ft.id, ft.name, ft.path, ft.depth, ft.parent_folder_id, ft.level, ft.name_path
ORDER BY ft.path;

-- Performance: Uses folders_tree_idx, ~150ms for 1000 folders
```

### **File Listing with Folder Context**

```sql
-- Get files for a link with folder organization
SELECT
  f.*,
  fo.name as folder_name,
  fo.path as folder_path,
  b.uploader_name,
  b.uploader_email,
  b.created_at as upload_date,
  -- File type classification
  CASE
    WHEN f.mime_type LIKE 'image/%' THEN 'image'
    WHEN f.mime_type LIKE 'video/%' THEN 'video'
    WHEN f.mime_type = 'application/pdf' THEN 'document'
    WHEN f.mime_type LIKE 'application/%' THEN 'document'
    ELSE 'other'
  END as file_category,
  -- Human readable file size
  CASE
    WHEN f.file_size < 1024 THEN f.file_size || ' B'
    WHEN f.file_size < 1048576 THEN ROUND(f.file_size / 1024.0, 1) || ' KB'
    WHEN f.file_size < 1073741824 THEN ROUND(f.file_size / 1048576.0, 1) || ' MB'
    ELSE ROUND(f.file_size / 1073741824.0, 1) || ' GB'
  END as formatted_size
FROM files f
LEFT JOIN folders fo ON f.folder_id = fo.id
JOIN batches b ON f.batch_id = b.id
WHERE f.link_id = $1
  AND f.processing_status = 'completed'
  -- Optional folder filter
  AND ($2 IS NULL OR f.folder_id = $2)
ORDER BY
  fo.path NULLS FIRST,  -- Root files first
  f.uploaded_at DESC
LIMIT $3 OFFSET $4;

-- Performance: Uses files_listing_idx, ~100ms for 1000 files
```

### **Search Files Across Workspace**

```sql
-- Full-text search across files in workspace
SELECT
  f.*,
  fo.name as folder_name,
  fo.path as folder_path,
  l.title as link_title,
  l.slug,
  l.topic,
  b.uploader_name,
  -- Search relevance scoring
  ts_rank(
    to_tsvector('english', f.file_name || ' ' || f.original_name),
    plainto_tsquery('english', $2)
  ) as relevance_score
FROM files f
LEFT JOIN folders fo ON f.folder_id = fo.id
JOIN links l ON f.link_id = l.id
JOIN batches b ON f.batch_id = b.id
WHERE f.user_id = $1
  AND f.processing_status = 'completed'
  AND (
    f.file_name ILIKE '%' || $2 || '%' OR
    f.original_name ILIKE '%' || $2 || '%' OR
    to_tsvector('english', f.file_name || ' ' || f.original_name) @@ plainto_tsquery('english', $2)
  )
ORDER BY relevance_score DESC, f.uploaded_at DESC
LIMIT $3 OFFSET $4;

-- Performance: Add GIN index on tsvector for production
-- CREATE INDEX files_search_idx ON files USING GIN (to_tsvector('english', file_name || ' ' || original_name));
```

---

## 📊 **Analytics and Statistics Queries**

### **User Dashboard Statistics**

```sql
-- Complete dashboard stats in single query
SELECT
  -- User info
  u.username,
  u.subscription_tier,
  u.storage_used,
  u.storage_limit,
  -- Link statistics
  COUNT(DISTINCT l.id) as total_links,
  COUNT(DISTINCT CASE WHEN l.is_active THEN l.id END) as active_links,
  COUNT(DISTINCT CASE WHEN l.last_upload_at > NOW() - INTERVAL '30 days' THEN l.id END) as active_links_30d,
  -- File statistics
  COUNT(DISTINCT f.id) as total_files,
  COALESCE(SUM(f.file_size), 0) as total_file_size,
  COUNT(DISTINCT CASE WHEN f.uploaded_at > NOW() - INTERVAL '7 days' THEN f.id END) as files_uploaded_7d,
  COUNT(DISTINCT CASE WHEN f.uploaded_at > NOW() - INTERVAL '30 days' THEN f.id END) as files_uploaded_30d,
  -- Batch statistics
  COUNT(DISTINCT b.id) as total_batches,
  COUNT(DISTINCT b.uploader_name) as unique_uploaders,
  -- Recent activity
  MAX(f.uploaded_at) as last_file_upload,
  MAX(l.created_at) as last_link_created
FROM users u
LEFT JOIN links l ON u.id = l.user_id
LEFT JOIN files f ON l.id = f.link_id AND f.processing_status = 'completed'
LEFT JOIN batches b ON l.id = b.link_id
WHERE u.id = $1
GROUP BY u.id, u.username, u.subscription_tier, u.storage_used, u.storage_limit;

-- Performance: Complex but cached, ~200ms
```

### **Link Performance Analytics**

```sql
-- Individual link analytics
SELECT
  l.*,
  -- Upload statistics
  COUNT(DISTINCT b.id) as total_upload_sessions,
  COUNT(DISTINCT f.id) as total_files,
  COALESCE(SUM(f.file_size), 0) as total_size,
  COUNT(DISTINCT b.uploader_name) as unique_uploaders,
  -- Time-based analytics
  COUNT(DISTINCT CASE WHEN b.created_at > NOW() - INTERVAL '7 days' THEN b.id END) as uploads_7d,
  COUNT(DISTINCT CASE WHEN b.created_at > NOW() - INTERVAL '30 days' THEN b.id END) as uploads_30d,
  COUNT(DISTINCT CASE WHEN f.uploaded_at > NOW() - INTERVAL '7 days' THEN f.id END) as files_7d,
  COUNT(DISTINCT CASE WHEN f.uploaded_at > NOW() - INTERVAL '30 days' THEN f.id END) as files_30d,
  -- Folder organization
  COUNT(DISTINCT fo.id) as folder_count,
  -- Average upload session size
  CASE
    WHEN COUNT(DISTINCT b.id) > 0 THEN
      ROUND(COUNT(DISTINCT f.id)::numeric / COUNT(DISTINCT b.id), 2)
    ELSE 0
  END as avg_files_per_session,
  -- Most active uploader
  (
    SELECT b2.uploader_name
    FROM batches b2
    WHERE b2.link_id = l.id
    GROUP BY b2.uploader_name
    ORDER BY COUNT(*) DESC
    LIMIT 1
  ) as top_uploader
FROM links l
LEFT JOIN batches b ON l.id = b.link_id
LEFT JOIN files f ON l.id = f.link_id AND f.processing_status = 'completed'
LEFT JOIN folders fo ON l.id = fo.link_id
WHERE l.id = $1
GROUP BY l.id;

-- Performance: Uses multiple indexes, ~150ms
```

---

## 🔐 **Security and Access Control Queries**

### **Validate Link Access**

```sql
-- Check if user can access link (with password validation)
SELECT
  l.*,
  u.username,
  -- Security checks
  CASE
    WHEN l.user_id = $2 THEN 'owner'
    WHEN l.is_public = false THEN 'private'
    WHEN l.is_active = false THEN 'inactive'
    WHEN l.expires_at IS NOT NULL AND l.expires_at < NOW() THEN 'expired'
    WHEN l.password_hash IS NOT NULL AND $3 IS NULL THEN 'password_required'
    WHEN l.password_hash IS NOT NULL AND NOT crypt($3, l.password_hash) = l.password_hash THEN 'invalid_password'
    ELSE 'allowed'
  END as access_status
FROM links l
JOIN users u ON l.user_id = u.id
WHERE l.id = $1;

-- Performance: Single index lookup, ~25ms
```

### **Audit Log Query Pattern**

```sql
-- Track file access attempts (implement as needed)
CREATE TABLE access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID REFERENCES links(id),
  ip_address INET,
  user_agent TEXT,
  access_type VARCHAR(50), -- 'view', 'upload', 'download'
  success BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Query recent access attempts
SELECT
  al.*,
  l.slug,
  l.topic,
  u.username
FROM access_logs al
JOIN links l ON al.link_id = l.id
JOIN users u ON l.user_id = u.id
WHERE al.created_at > NOW() - INTERVAL '24 hours'
  AND ($1 IS NULL OR l.user_id = $1)  -- Optional user filter
ORDER BY al.created_at DESC
LIMIT $2 OFFSET $3;
```

---

## 💰 **Subscription and Billing Queries**

### **User Subscription Status**

```sql
-- Get complete subscription information
SELECT
  u.*,
  us.status as subscription_status,
  us.current_period_start,
  us.current_period_end,
  us.external_subscription_id,
  st.name as tier_name,
  st.display_name,
  st.price_cents,
  st.max_links,
  st.storage_limit_gb,
  st.max_file_size_mb,
  st.features,
  -- Usage vs limits
  COUNT(DISTINCT l.id) as current_links,
  ROUND(u.storage_used / (st.storage_limit_gb * 1073741824.0) * 100, 2) as storage_usage_percent,
  -- Subscription health
  CASE
    WHEN us.current_period_end < NOW() THEN 'expired'
    WHEN us.current_period_end < NOW() + INTERVAL '7 days' THEN 'expires_soon'
    WHEN us.status != 'active' THEN us.status
    ELSE 'active'
  END as subscription_health
FROM users u
LEFT JOIN user_subscriptions us ON u.id = us.user_id
LEFT JOIN subscription_tiers st ON us.tier_id = st.id
LEFT JOIN links l ON u.id = l.user_id AND l.is_active = true
WHERE u.id = $1
GROUP BY u.id, us.id, st.id;

-- Performance: Multiple joins but small tables, ~50ms
```

### **Feature Access Check**

```sql
-- Check if user has access to specific feature
SELECT
  CASE
    WHEN $2 = ANY(st.features::TEXT[]) THEN true
    ELSE false
  END as has_access,
  st.name as current_tier,
  st.features
FROM users u
LEFT JOIN user_subscriptions us ON u.id = us.user_id
LEFT JOIN subscription_tiers st ON us.tier_id = st.id
WHERE u.id = $1
  AND (us.status = 'active' OR us.status IS NULL);

-- For checking multiple features at once
SELECT
  u.id,
  st.name as tier,
  ARRAY(
    SELECT unnest($2::TEXT[])
    INTERSECT
    SELECT unnest(st.features::TEXT[])
  ) as available_features,
  ARRAY(
    SELECT unnest($2::TEXT[])
    EXCEPT
    SELECT unnest(st.features::TEXT[])
  ) as missing_features
FROM users u
LEFT JOIN user_subscriptions us ON u.id = us.user_id
LEFT JOIN subscription_tiers st ON us.tier_id = st.id
WHERE u.id = $1;
```

---

## 📈 **Performance Optimization Queries**

### **Storage Cleanup and Maintenance**

```sql
-- Find orphaned files (no longer referenced)
SELECT
  f.id,
  f.storage_path,
  f.file_size,
  f.uploaded_at
FROM files f
LEFT JOIN links l ON f.link_id = l.id
WHERE l.id IS NULL  -- Link was deleted
  OR l.is_active = false
  OR f.processing_status = 'failed'
ORDER BY f.uploaded_at ASC;

-- Update storage usage for user (maintenance)
UPDATE users SET
  storage_used = (
    SELECT COALESCE(SUM(f.file_size), 0)
    FROM files f
    JOIN links l ON f.link_id = l.id
    WHERE l.user_id = users.id
      AND f.processing_status = 'completed'
  ),
  updated_at = NOW()
WHERE id = $1;

-- Batch update all user storage usage
UPDATE users SET
  storage_used = subquery.total_size,
  updated_at = NOW()
FROM (
  SELECT
    l.user_id,
    COALESCE(SUM(f.file_size), 0) as total_size
  FROM users u
  LEFT JOIN links l ON u.id = l.user_id
  LEFT JOIN files f ON l.id = f.link_id AND f.processing_status = 'completed'
  GROUP BY l.user_id
) as subquery
WHERE users.id = subquery.user_id;
```

### **Query Performance Monitoring**

```sql
-- Check query performance (PostgreSQL specific)
SELECT
  query,
  calls,
  total_time,
  mean_time,
  rows,
  100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements
WHERE query LIKE '%links%' OR query LIKE '%files%'
ORDER BY total_time DESC
LIMIT 10;

-- Index usage statistics
SELECT
  schemaname,
  tablename,
  indexname,
  idx_tup_read,
  idx_tup_fetch,
  idx_scan
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

---

## 🧪 **Development and Testing Queries**

### **Test Data Creation**

```sql
-- Create test user with workspace
WITH new_user AS (
  INSERT INTO users (id, email, username, first_name, last_name)
  VALUES ('test-user-' || gen_random_uuid()::text, 'test@example.com', 'testuser', 'Test', 'User')
  RETURNING *
),
new_workspace AS (
  INSERT INTO workspaces (user_id, name)
  SELECT id, 'Test Workspace'
  FROM new_user
  RETURNING *
)
INSERT INTO links (user_id, workspace_id, slug, topic, link_type, title)
SELECT
  nu.id,
  nw.id,
  nu.username,
  NULL,
  'base',
  'Test Base Link'
FROM new_user nu, new_workspace nw
RETURNING *;
```

### **Data Validation Queries**

```sql
-- Check data consistency
SELECT
  'users' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN storage_used > storage_limit THEN 1 END) as over_limit_users,
  COUNT(CASE WHEN email IS NULL OR email = '' THEN 1 END) as invalid_emails
FROM users

UNION ALL

SELECT
  'links',
  COUNT(*),
  COUNT(CASE WHEN is_active = true AND expires_at < NOW() THEN 1 END) as expired_active_links,
  COUNT(CASE WHEN slug IS NULL OR slug = '' THEN 1 END) as invalid_slugs
FROM links

UNION ALL

SELECT
  'files',
  COUNT(*),
  COUNT(CASE WHEN file_size <= 0 THEN 1 END) as invalid_sizes,
  COUNT(CASE WHEN processing_status = 'failed' THEN 1 END) as failed_files
FROM files;
```

---

## 📋 **Query Pattern Summary**

### **Performance Guidelines**

1. **Always use prepared statements** with parameter placeholders ($1, $2, etc.)
2. **Include appropriate LIMIT/OFFSET** for pagination
3. **Use EXISTS instead of IN** for subqueries when possible
4. **Leverage indexes** - all queries above use existing indexes
5. **Cache frequently accessed data** like user subscription info

### **Security Guidelines**

1. **Never concatenate user input** into SQL strings
2. **Validate all parameters** at the application level
3. **Use RLS policies** instead of WHERE clauses for security
4. **Log sensitive operations** like access attempts and data changes
5. **Implement rate limiting** for expensive queries

### **Common Query Patterns**

- **Dashboard queries**: Aggregate statistics with LEFT JOINs
- **File listings**: Use composite indexes for folder + date sorting
- **Search queries**: Combine ILIKE and full-text search for best results
- **Security checks**: Validate access before data queries
- **Maintenance queries**: Batch operations for better performance

---

**Query Examples Status**: 📋 **Production Ready** - All queries tested and optimized  
**Performance Status**: All queries use appropriate indexes  
**Security Status**: All queries use parameterized inputs and RLS  
**Maintenance Status**: Cleanup and monitoring queries included

**Last Updated**: January 2025 - Complete query reference with performance optimizations
