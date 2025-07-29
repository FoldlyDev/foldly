# 📋 Database Schema Reference

> **Complete field-by-field reference for all database tables**  
> **Schema Version**: 2025.1 Simplified MVP  
> **Last Updated**: January 2025

## 🗄️ **Complete Table Reference**

### **Subscription System Architecture (2025 Clerk Integration)**

**Modern Hybrid Clerk + Database Approach**:

- **Clerk 2025**: Source of truth for subscription state and real-time feature access control
- **Database**: Business intelligence metadata and subscription analytics tracking
- **Storage Tracking**: Real-time calculation from files table with intelligent caching
- **Analytics**: Comprehensive subscription business intelligence and revenue tracking

### **Users Table**

| Field                   | Type         | Constraints           | Default    | Description                    |
| ----------------------- | ------------ | --------------------- | ---------- | ------------------------------ |
| `id`                    | TEXT         | PRIMARY KEY, NOT NULL | -          | Clerk user ID (string format)  |
| `email`                 | VARCHAR(255) | UNIQUE, NOT NULL      | -          | User email address             |
| `username`              | VARCHAR(100) | UNIQUE, NOT NULL      | -          | Unique username for URLs       |
| `first_name`            | VARCHAR(100) | NULLABLE              | -          | User first name                |
| `last_name`             | VARCHAR(100) | NULLABLE              | -          | User last name                 |
| `avatar_url`            | TEXT         | NULLABLE              | -          | Profile image URL              |
| `subscription_tier`     | ENUM         | NOT NULL              | 'free'     | Current subscription level     |
| `storage_used`          | BIGINT       | NOT NULL              | 0          | Current storage usage in bytes |
| `storage_limit`         | BIGINT       | NOT NULL              | 1073741824 | Storage limit in bytes (1GB)   |
| `files_uploaded`        | INTEGER      | NOT NULL              | 0          | Total files uploaded counter   |
| `last_quota_warning_at` | TIMESTAMP    | NULLABLE              | -          | Last quota warning timestamp   |
| `created_at`            | TIMESTAMP    | NOT NULL              | NOW()      | Account creation timestamp     |
| `updated_at`            | TIMESTAMP    | NOT NULL              | NOW()      | Last update timestamp          |

**Indexes:**

- `users_username_idx` (UNIQUE) on `username`
- `users_email_idx` on `email`
- `users_subscription_idx` on `subscription_tier`

---

### **Workspaces Table**

| Field        | Type         | Constraints            | Default           | Description                 |
| ------------ | ------------ | ---------------------- | ----------------- | --------------------------- |
| `id`         | UUID         | PRIMARY KEY, NOT NULL  | gen_random_uuid() | Workspace unique identifier |
| `user_id`    | TEXT         | FK users(id), NOT NULL | -                 | Owner user ID               |
| `name`       | VARCHAR(255) | NOT NULL               | 'My Workspace'    | Workspace display name      |
| `created_at` | TIMESTAMP    | NOT NULL               | NOW()             | Creation timestamp          |
| `updated_at` | TIMESTAMP    | NOT NULL               | NOW()             | Last update timestamp       |

**Constraints:**

- `unique_user_workspace` (UNIQUE) on `user_id` - Enforces 1:1 relationship

**Indexes:**

- `workspaces_user_id_idx` on `user_id`
- `workspaces_created_at_idx` on `created_at`

---

### **Links Table**

| Field                | Type         | Constraints                 | Default           | Description                       |
| -------------------- | ------------ | --------------------------- | ----------------- | --------------------------------- |
| `id`                 | UUID         | PRIMARY KEY, NOT NULL       | gen_random_uuid() | Link unique identifier            |
| `user_id`            | TEXT         | FK users(id), NOT NULL      | -                 | Link owner user ID                |
| `workspace_id`       | UUID         | FK workspaces(id), NOT NULL | -                 | Associated workspace              |
| `slug`               | VARCHAR(100) | NOT NULL                    | -                 | URL slug (usually username)       |
| `topic`              | VARCHAR(100) | NULLABLE                    | -                 | Topic for custom links            |
| `link_type`          | ENUM         | NOT NULL                    | 'base'            | Link type (base/custom/generated) |
| `title`              | VARCHAR(255) | NOT NULL                    | -                 | Link display title                |
| `description`        | TEXT         | NULLABLE                    | -                 | Optional link description         |
| `require_email`      | BOOLEAN      | NOT NULL                    | FALSE             | Email requirement toggle          |
| `require_password`   | BOOLEAN      | NOT NULL                    | FALSE             | Password protection toggle        |
| `password_hash`      | TEXT         | NULLABLE                    | -                 | Hashed password for protection    |
| `is_public`          | BOOLEAN      | NOT NULL                    | TRUE              | Public visibility setting         |
| `is_active`          | BOOLEAN      | NOT NULL                    | TRUE              | Link enabled/disabled             |
| `max_files`          | INTEGER      | NOT NULL                    | 100               | Maximum files per upload          |
| `max_file_size`      | BIGINT       | NOT NULL                    | 104857600         | Max file size (100MB)             |
| `allowed_file_types` | JSON         | NULLABLE                    | -                 | Array of allowed MIME types       |
| `expires_at`         | TIMESTAMP    | NULLABLE                    | -                 | Optional expiration date          |
| `brand_enabled`      | BOOLEAN      | NOT NULL                    | FALSE             | Custom branding toggle            |
| `brand_color`        | VARCHAR(7)   | NULLABLE                    | -                 | Hex color code                    |
| `total_uploads`      | INTEGER      | NOT NULL                    | 0                 | Total upload sessions             |
| `total_files`        | INTEGER      | NOT NULL                    | 0                 | Total files uploaded              |
| `total_size`         | BIGINT       | NOT NULL                    | 0                 | Total size uploaded               |
| `last_upload_at`     | TIMESTAMP    | NULLABLE                    | -                 | Last upload timestamp             |
| `storage_used`       | BIGINT       | NOT NULL                    | 0                 | Current storage usage             |
| `storage_limit`      | BIGINT       | NOT NULL                    | 524288000         | Storage limit (500MB)             |
| `created_at`         | TIMESTAMP    | NOT NULL                    | NOW()             | Creation timestamp                |
| `updated_at`         | TIMESTAMP    | NOT NULL                    | NOW()             | Last update timestamp             |

**Constraints:**

- `links_slug_topic_unique` (UNIQUE) on `(user_id, slug, topic)` - Ensures unique URLs

**Indexes:**

- `links_user_id_idx` on `user_id`
- `links_workspace_id_idx` on `workspace_id`
- `links_slug_topic_idx` (UNIQUE) on `(user_id, slug, topic)`
- `links_active_idx` on `is_active`
- `links_stats_idx` on `(user_id, is_active, created_at DESC)`

---

### **Folders Table**

| Field              | Type         | Constraints                 | Default           | Description                      |
| ------------------ | ------------ | --------------------------- | ----------------- | -------------------------------- |
| `id`               | UUID         | PRIMARY KEY, NOT NULL       | gen_random_uuid() | Folder unique identifier         |
| `user_id`          | TEXT         | FK users(id), NOT NULL      | -                 | Folder owner user ID             |
| `workspace_id`     | UUID         | FK workspaces(id), NOT NULL | -                 | Associated workspace             |
| `link_id`          | UUID         | FK links(id), NULLABLE      | -                 | Associated link (if any)         |
| `parent_folder_id` | UUID         | FK folders(id), NULLABLE    | -                 | Parent folder (for hierarchy)    |
| `name`             | VARCHAR(255) | NOT NULL                    | -                 | Folder display name              |
| `path`             | TEXT         | NOT NULL                    | -                 | Materialized path (/docs/images) |
| `depth`            | SMALLINT     | NOT NULL                    | 0                 | Hierarchy depth level            |
| `created_at`       | TIMESTAMP    | NOT NULL                    | NOW()             | Creation timestamp               |

**Indexes:**

- `folders_parent_id_idx` on `parent_folder_id`
- `folders_link_path_idx` on `(link_id, path)`
- `folders_workspace_id_idx` on `workspace_id`
- `folders_tree_idx` on `(link_id, parent_folder_id, path)`

---

### **Batches Table**

| Field            | Type         | Constraints            | Default           | Description                               |
| ---------------- | ------------ | ---------------------- | ----------------- | ----------------------------------------- |
| `id`             | UUID         | PRIMARY KEY, NOT NULL  | gen_random_uuid() | Batch unique identifier                   |
| `link_id`        | UUID         | FK links(id), NOT NULL | -                 | Associated link                           |
| `user_id`        | TEXT         | FK users(id), NOT NULL | -                 | Link owner user ID                        |
| `uploader_name`  | VARCHAR(255) | NOT NULL               | -                 | Name of person uploading                  |
| `uploader_email` | VARCHAR(255) | NULLABLE               | -                 | Optional uploader email                   |
| `status`         | ENUM         | NOT NULL               | 'uploading'       | Batch status (uploading/completed/failed) |
| `total_files`    | INTEGER      | NOT NULL               | 0                 | Number of files in batch                  |
| `total_size`     | BIGINT       | NOT NULL               | 0                 | Total batch size in bytes                 |
| `created_at`     | TIMESTAMP    | NOT NULL               | NOW()             | Creation timestamp                        |

**Indexes:**

- `batches_link_id_idx` on `link_id`
- `batches_status_idx` on `status`
- `batches_created_at_idx` on `created_at DESC`

---

### **Files Table**

| Field               | Type         | Constraints              | Default           | Description                   |
| ------------------- | ------------ | ------------------------ | ----------------- | ----------------------------- |
| `id`                | UUID         | PRIMARY KEY, NOT NULL    | gen_random_uuid() | File unique identifier        |
| `link_id`           | UUID         | FK links(id), NOT NULL   | -                 | Associated link               |
| `batch_id`          | UUID         | FK batches(id), NOT NULL | -                 | Associated batch              |
| `user_id`           | TEXT         | FK users(id), NOT NULL   | -                 | Link owner user ID            |
| `folder_id`         | UUID         | FK folders(id), NULLABLE | -                 | Folder location (NULL = root) |
| `file_name`         | VARCHAR(255) | NOT NULL                 | -                 | Sanitized filename            |
| `original_name`     | VARCHAR(255) | NOT NULL                 | -                 | Original upload filename      |
| `file_size`         | BIGINT       | NOT NULL                 | -                 | File size in bytes            |
| `mime_type`         | VARCHAR(100) | NOT NULL                 | -                 | File MIME type                |
| `storage_path`      | TEXT         | NOT NULL                 | -                 | Supabase storage path         |
| `processing_status` | ENUM         | NOT NULL                 | 'pending'         | Processing status             |
| `is_safe`           | BOOLEAN      | NOT NULL                 | TRUE              | Security scan result          |
| `uploaded_at`       | TIMESTAMP    | NOT NULL                 | NOW()             | Upload timestamp              |

**Indexes:**

- `files_link_id_idx` on `link_id`
- `files_batch_id_idx` on `batch_id`
- `files_folder_id_idx` on `folder_id`
- `files_link_status_idx` on `(link_id, processing_status)`
- `files_uploaded_at_idx` on `uploaded_at DESC`
- `files_listing_idx` on `(link_id, folder_id, uploaded_at DESC)`

---

### **Subscription Plans Table (UI Metadata & Business Intelligence)**

| Field                  | Type          | Constraints           | Default | Description                                                |
| ---------------------- | ------------- | --------------------- | ------- | ---------------------------------------------------------- |
| `id`                   | SERIAL        | PRIMARY KEY, NOT NULL | -       | Plan unique identifier                                     |
| `plan_key`             | VARCHAR(50)   | UNIQUE, NOT NULL      | -       | Internal plan identifier ('free', 'pro', 'business')       |
| `plan_name`            | VARCHAR(100)  | NOT NULL              | -       | User-facing plan name ('Free', 'Pro', 'Business')          |
| `plan_description`     | TEXT          | NULLABLE              | -       | Plan description for UI display                            |
| `monthly_price_usd`    | DECIMAL(10,2) | NOT NULL              | -       | Monthly price for display purposes                         |
| `yearly_price_usd`     | DECIMAL(10,2) | NULLABLE              | -       | Yearly price for display purposes                          |
| `storage_limit_gb`     | INTEGER       | NOT NULL              | -       | Storage limit in GB (50, 500, -1 for unlimited)            |
| `highlight_features`   | JSONB         | NULLABLE              | -       | Array of feature names for display                         |
| `feature_descriptions` | JSONB         | NULLABLE              | -       | Detailed feature explanations with MVP status              |
| `is_popular`           | BOOLEAN       | NOT NULL              | FALSE   | Flag for "Most Popular" badge                              |
| `sort_order`           | INTEGER       | NOT NULL              | 0       | Display order in pricing tables                            |
| `is_active`            | BOOLEAN       | NOT NULL              | TRUE    | Plan availability for subscription                         |
| `mvp_status`           | VARCHAR(50)   | NULLABLE              | -       | MVP availability ('available', 'not_available_during_mvp') |
| `conversion_tracking`  | JSONB         | NULLABLE              | -       | A/B testing and conversion optimization data               |
| `created_at`           | TIMESTAMP     | NOT NULL              | NOW()   | Creation timestamp                                         |
| `updated_at`           | TIMESTAMP     | NOT NULL              | NOW()   | Last update timestamp                                      |

**Indexes:**

- `idx_subscription_plans_plan_key` (UNIQUE) on `plan_key`
- `idx_subscription_plans_active` on `is_active`
- `idx_subscription_plans_sort_order` on `sort_order`
- `idx_subscription_plans_mvp_status` on `mvp_status`

**Integration Notes:**

- **Clerk 2025**: Source of truth for subscription state via `user.has({ plan: 'plan_key' })`
- **UI Metadata**: Plan pricing, descriptions, and feature listings for pricing tables
- **Business Intelligence**: MVP status flags and conversion tracking for optimization

---

### **Subscription Analytics Table (Business Intelligence)**

| Field                | Type          | Constraints            | Default | Description                                                                    |
| -------------------- | ------------- | ---------------------- | ------- | ------------------------------------------------------------------------------ |
| `id`                 | SERIAL        | PRIMARY KEY, NOT NULL  | -       | Analytics record identifier                                                    |
| `user_id`            | TEXT          | FK users(id), NOT NULL | -       | User who performed the action                                                  |
| `plan_key`           | VARCHAR(50)   | NOT NULL               | -       | Plan involved in the event                                                     |
| `event_type`         | VARCHAR(50)   | NOT NULL               | -       | Type of event ('upgrade', 'downgrade', 'cancel', 'trial_start', 'trial_end')   |
| `previous_plan`      | VARCHAR(50)   | NULLABLE               | -       | Previous plan (for transitions)                                                |
| `new_plan`           | VARCHAR(50)   | NULLABLE               | -       | New plan (for transitions)                                                     |
| `revenue_impact`     | DECIMAL(10,2) | NULLABLE               | -       | Revenue change from this event                                                 |
| `conversion_source`  | VARCHAR(100)  | NULLABLE               | -       | Source of the conversion (e.g., 'pricing_page', 'usage_limit', 'feature_gate') |
| `user_behavior_data` | JSONB         | NULLABLE               | -       | Context about user behavior leading to this event                              |
| `a_b_test_variant`   | VARCHAR(50)   | NULLABLE               | -       | A/B testing variant for conversion optimization                                |
| `cohort_data`        | JSONB         | NULLABLE               | -       | User cohort information for analysis                                           |
| `created_at`         | TIMESTAMP     | NOT NULL               | NOW()   | Event timestamp                                                                |

**Indexes:**

- `idx_subscription_analytics_user_id` on `user_id`
- `idx_subscription_analytics_event_type` on `event_type`
- `idx_subscription_analytics_created_at` on `created_at DESC`
- `idx_subscription_analytics_conversion_source` on `conversion_source`
- `idx_subscription_analytics_cohort` on `((cohort_data->>'cohort_month')::date)`

**Business Intelligence Use Cases:**

- **Revenue Tracking**: Monitor MRR/ARR changes and revenue attribution
- **Conversion Optimization**: A/B testing and conversion funnel analysis
- **Churn Prediction**: User behavior patterns and retention analysis
- **Cohort Analysis**: User lifecycle tracking and LTV calculations

---

## 🔢 **Database Enums**

### **Link Type Enum**

```sql
CREATE TYPE link_type_enum AS ENUM ('base', 'custom', 'generated');
```

### **Batch Status Enum**

```sql
CREATE TYPE batch_status_enum AS ENUM ('uploading', 'completed', 'failed');
```

### **File Processing Status Enum**

```sql
CREATE TYPE file_processing_status_enum AS ENUM ('pending', 'processing', 'completed', 'failed');
```

### **Subscription Tier Enum**

```sql
CREATE TYPE subscription_tier_enum AS ENUM ('free', 'pro', 'business', 'enterprise');
```

### **Subscription Status Enum**

```sql
CREATE TYPE subscription_status_enum AS ENUM ('active', 'cancelled', 'past_due', 'unpaid');
```

---

## 📊 **Storage and Limits Reference**

### **2025 Subscription Tier Limits**

| Subscription Tier | Storage Limit | Max File Size | Max Links | Key Features                                             |
| ----------------- | ------------- | ------------- | --------- | -------------------------------------------------------- |
| **Free**          | 50GB          | 100MB         | 3         | Basic upload, public links, standard support             |
| **Pro**           | 500GB         | 500MB         | 10        | + Custom branding, password protection, priority support |
| **Business**      | Unlimited     | 2GB           | 50        | + Team features, analytics, API access                   |

**Modern Implementation Notes:**

- **Clerk Integration**: Plan limits enforced via `user.has({ plan: 'plan_key' })` real-time checking
- **Storage Tracking**: Real-time calculation from files table with intelligent caching
- **Feature Access**: Direct Clerk feature checking with `user.has({ feature: 'feature_name' })`
- **MVP Status**: Business tier marked as "Coming Soon" during MVP phase

### **File Type Restrictions**

```json
// Default allowed file types (can be customized per link)
{
  "images": ["image/jpeg", "image/png", "image/gif", "image/webp"],
  "documents": [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ],
  "archives": ["application/zip", "application/x-rar-compressed"],
  "videos": ["video/mp4", "video/quicktime", "video/x-msvideo"]
}
```

---

## 🔐 **Security Constraints**

### **Data Validation Rules**

```sql
-- Email format validation
ALTER TABLE users ADD CONSTRAINT valid_email
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Username format validation
ALTER TABLE users ADD CONSTRAINT valid_username
  CHECK (username ~* '^[a-zA-Z0-9_]{3,30}$');

-- Storage usage constraints
ALTER TABLE users ADD CONSTRAINT valid_storage_used
  CHECK (storage_used >= 0 AND storage_used <= storage_limit);

-- Password hash format (bcrypt)
ALTER TABLE links ADD CONSTRAINT valid_password_hash
  CHECK (password_hash IS NULL OR password_hash ~* '^\$2[aby]\$[0-9]{2}\$');

-- File size constraints
ALTER TABLE files ADD CONSTRAINT valid_file_size
  CHECK (file_size > 0 AND file_size <= 5368709120); -- 5GB absolute max

-- Folder depth limit
ALTER TABLE folders ADD CONSTRAINT valid_folder_depth
  CHECK (depth >= 0 AND depth <= 20); -- 20 levels max
```

### **Row Level Security Policies**

Each table has comprehensive RLS policies that ensure:

- Users can only access their own data
- Public links allow read access to files and folders
- Upload permissions are validated through link settings
- Administrative operations require proper authentication

---

## 📈 **Performance Characteristics**

### **Query Performance Targets**

| Operation Type         | Target Time | Index Strategy                    |
| ---------------------- | ----------- | --------------------------------- |
| User authentication    | < 25ms      | Primary key lookup                |
| Link URL resolution    | < 50ms      | Composite index on (slug, topic)  |
| File listing           | < 100ms     | Composite index with pagination   |
| Folder tree loading    | < 150ms     | Materialized path + recursive CTE |
| Upload validation      | < 75ms      | Foreign key indexes               |
| Statistics aggregation | < 200ms     | Background jobs + caching         |

### **Scalability Considerations**

- **Connection pooling**: 20 max connections for production
- **Index maintenance**: Automatic VACUUM and ANALYZE
- **Partition strategy**: Ready for time-based partitioning on large tables
- **Read replicas**: Architecture supports read-only replicas for scaling
- **Caching layer**: Redis-compatible with computed statistics

---

**Schema Reference Status**: 📋 **Complete** - All tables, fields, and constraints documented  
**Performance Status**: All indexes created and tested  
**Security Status**: RLS policies implemented and validated  
**Maintenance Status**: Automated maintenance procedures in place

**Last Updated**: January 2025 - Complete schema reference
