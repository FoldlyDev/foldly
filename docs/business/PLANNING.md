# Foldly - 2025 Advanced SaaS Development Plan & Multi-Link Architecture

## 🎯 Project Overview

**Foldly** is a next-generation file collection SaaS platform with **multiple link types**, **advanced organization**, and **flexible security controls** for professional file management workflows.

### Core Value Proposition

#### **Multi-Link Architecture**

- **Base Links**: `foldly.com/username` - General data dump area for any uploads
- **Custom Topic Links**: `foldly.com/username/topic_or_folder` - Project-specific with auto-organization
- **Smart Generation**: Right-click any folder to create targeted upload links

#### **Advanced Organization System**

- **Pre-Upload**: Uploaders can create folder structures before submission
- **Post-Upload**: Recipients have full reorganization capabilities
- **Organization Workflow**: Recipients must first drag received files into their personal workspace/repo area before they can organize/reorganize them
- **Batch Management**: Smart grouping with `[Uploader Name] (Batch Name) [Date]` format
- **Auto-Sorting**: Custom links automatically route to designated folders

#### **Flexible Security & UX**

- **Zero-Friction Core**: Only name required, no forced logins
- **Recipient-Controlled**: Optional email requirements, password protection
- **Visibility Controls**: Public/private settings per link or folder
- **Smart Warnings**: Alerts for potentially risky file types

### Business Model

- **Freemium SaaS**: $0 → $8 → $25 → $40/month tiers
- **Target Market**: Creative agencies, consultants, project managers, legal/HR teams
- **Revenue Streams**: Multi-link plans, advanced organization tools, white-label branding

## 🏗️ Modern 2025 Tech Stack (Enterprise-Grade Security)

> **Architecture**: Full-stack Next.js application with Clerk authentication and Supabase backend optimized for multi-link handling

### Frontend Stack

- **Framework**: Next.js 15+ (App Router) - handles both frontend and backend
- **Language**: TypeScript 5+
- **Styling**: TailwindCSS 4.0 (JIT compilation)
- **UI Components**: Shadcn/ui + Radix UI primitives
- **Animations**: Framer Motion 11+
- **State Management**: Zustand (lightweight, no Redux complexity)
- **Form Handling**: React Hook Form + Zod validation
- **Real-time Features**: Socket.io (for live upload progress and notifications)

### Backend & Database (Supabase + Clerk Integration)

- **Authentication**: Clerk (enterprise-grade auth with RBAC)
  - _Why_: Enterprise security, GDPR compliance, advanced user management
  - _Cost_: Free tier → $25/month for production features
- **Database**: Supabase PostgreSQL (with Row Level Security)
  - _Why_: Real-time capabilities, built-in security, no vendor lock-in
  - _Cost_: Free tier → $25/month for production
- **File Storage**: Supabase Storage (with CDN)
  - _Why_: Integrated with database, automatic optimization, secure access
  - _Integration_: Works seamlessly with Clerk JWT authentication
- **ORM**: Drizzle ORM (lightweight, type-safe)
- **Email**: Resend (modern, developer-friendly)
- **Payments**: Clerk Billing + Stripe (zero-integration billing)
  - _Why_: Instant setup, built-in UI, feature-based access control
  - _Benefits_: -60% code complexity, real-time feature updates, simplified architecture
  - _Cost_: 3.6% + 30¢ per transaction (includes 0.7% Clerk fee)
- **Real-time**: Socket.io + Supabase Realtime subscriptions

### Infrastructure & DevOps

- **Hosting**: Vercel (seamless Next.js integration)
- **Database & Storage**: Supabase (unified backend platform)
- **Monitoring**: Sentry (error tracking)
- **Analytics**: Posthog (open-source alternative to Mixpanel)
- **CI/CD**: GitHub Actions + Vercel deployment
- **Domain**: Cloudflare (DNS + security)

### Development Tools

- **Package Manager**: pnpm (faster, more efficient)
- **Code Quality**: ESLint + Prettier + Husky
- **Testing**: Vitest + React Testing Library + Playwright
- **Type Safety**: TypeScript strict mode
- **API**: tRPC (end-to-end type safety) + Supabase client

## 📊 Advanced Architecture Decisions & Rationale

### Multi-Link System Design

**Choice: Dynamic URL Routing with Database Resolution**

- **Base Links**: Simple user slug resolution (`/[username]`)
- **Topic Links**: Nested path resolution (`/[username]/[topic]`)
- **Database Integration**: Real-time link validation and permission checking
- **Security Layer**: Row Level Security for all link access patterns

**Benefits:**

- **SEO-Friendly**: Clean, memorable URLs for all link types
- **Scalable**: Database-driven routing handles infinite custom links
- **Secure**: Per-link permission controls with RLS
- **Fast**: Cached link resolution with Vercel Edge

### Advanced Organization Architecture

**Choice: Hierarchical Folder System with Metadata**

- **Pre-Upload Organization**: Frontend folder creation interface
- **Database Schema**: Nested folder structures with parent/child relationships
- **Real-time Sync**: Live updates during folder creation and file uploads
- **Batch Grouping**: Automatic batch metadata with uploader information

### Permission & Security System

**Choice: Granular Controls with Sensible Defaults**

- **Default Behavior**: Minimal friction (name only)
- **Progressive Security**: Recipient can add email requirements, passwords
- **Visibility Layers**: Public/private per link with database enforcement
- **Access Logging**: Complete audit trail for security compliance

## 🔧 Advanced Database Schema Design

### Core Tables with Multi-Link Support

```sql
-- Users table with SaaS subscription management
CREATE TABLE users (
  id UUID PRIMARY KEY,              -- Clerk user ID
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url TEXT,
  subscription_tier VARCHAR(20) DEFAULT 'free'
    CHECK (subscription_tier IN ('free', 'pro', 'business', 'enterprise')),
  storage_used BIGINT DEFAULT 0,
  storage_limit BIGINT DEFAULT 2147483648, -- 2GB
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workspaces (1:1 with users for MVP)
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL DEFAULT 'My Files',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced links with multi-type support
CREATE TABLE links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- URL Components
  slug VARCHAR(100) NOT NULL,      -- always the username
  topic VARCHAR(100),              -- NULL for base links
  link_type VARCHAR(20) NOT NULL DEFAULT 'base'
    CHECK (link_type IN ('base','custom','generated')),

  -- Display
  title VARCHAR(255) NOT NULL DEFAULT (COALESCE(topic, 'Personal base link')),
  description TEXT,

  -- Security controls
  require_email BOOLEAN DEFAULT FALSE,
  require_password BOOLEAN DEFAULT FALSE,
  password_hash TEXT, -- bcrypt hash if password required
  is_public BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,

  -- Limits and expiration
  max_files INTEGER DEFAULT 100,
  max_file_size BIGINT DEFAULT 104857600, -- 100MB default
  allowed_file_types TEXT[] DEFAULT ARRAY['*']::TEXT[],
  expires_at TIMESTAMP WITH TIME ZONE,

  -- Branding (Pro+ features)
  brand_enabled BOOLEAN DEFAULT FALSE,
  brand_color VARCHAR(7),                   -- e.g. #6c47ff
  accent_color VARCHAR(7),                  -- optional secondary
  brand_logo_url TEXT,
  brand_banner_url TEXT,

  -- Usage Stats
  total_uploads INT DEFAULT 0,
  total_files INT DEFAULT 0,
  total_size BIGINT DEFAULT 0,
  last_upload_at TIMESTAMP WITH TIME ZONE,

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Uniqueness
  UNIQUE (user_id, slug, topic)
);

-- Simplified hierarchical folder system
CREATE TABLE folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  parent_folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  link_id UUID REFERENCES links(id) ON DELETE SET NULL,  -- for generated links

  name VARCHAR(255) NOT NULL,
  path TEXT NOT NULL,              -- materialized full path
  depth SMALLINT NOT NULL DEFAULT 0,   -- 0 = root

  is_archived BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT FALSE,
  sort_order INT DEFAULT 0,

  file_count INT DEFAULT 0,
  total_size BIGINT DEFAULT 0,     -- bytes

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Upload batches for organization
CREATE TABLE batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES links(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,

  uploader_name VARCHAR(255) NOT NULL,
  uploader_email VARCHAR(255) CHECK (uploader_email ~
    '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'),
  uploader_message TEXT,

  name VARCHAR(255),                      -- user-chosen
  display_name VARCHAR(255),              -- `[Uploader] (name) [date]`

  status VARCHAR(12) NOT NULL DEFAULT 'uploading'
    CHECK (status IN ('uploading','processing','completed','failed')),

  total_files INT DEFAULT 0,
  processed_files INT DEFAULT 0,
  total_size BIGINT DEFAULT 0,            -- bytes

  upload_completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced files with comprehensive metadata
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES links(id) ON DELETE CASCADE,
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,

  file_name VARCHAR(255) NOT NULL,             -- safe, unique in batch
  original_name VARCHAR(255) NOT NULL,
  file_size BIGINT NOT NULL,                   -- bytes
  mime_type VARCHAR(100) NOT NULL,
  extension VARCHAR(20),

  storage_path TEXT NOT NULL,                  -- S3/Supabase key
  storage_provider VARCHAR(50) DEFAULT 'supabase',
  checksum VARCHAR(64),                        -- SHA-256, etc.

  is_safe BOOLEAN DEFAULT TRUE,
  virus_scan_result VARCHAR(20) DEFAULT 'pending'
    CHECK (virus_scan_result IN ('clean','infected','suspicious','pending')),
  security_warnings JSONB,

  processing_status VARCHAR(20) DEFAULT 'pending'
    CHECK (processing_status IN ('pending','processing','completed','failed')),
  thumbnail_path TEXT,

  is_organized BOOLEAN DEFAULT FALSE,
  needs_review BOOLEAN DEFAULT TRUE,

  download_count INT DEFAULT 0,
  last_accessed_at TIMESTAMP WITH TIME ZONE,

  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Row Level Security Policies

```sql
-- Users RLS (own data only)
CREATE POLICY "Users manage own data" ON users FOR ALL USING (id = auth.jwt()->>'sub'::uuid);

-- Workspaces RLS
CREATE POLICY "Users manage own workspaces" ON workspaces FOR ALL USING (user_id = auth.jwt()->>'sub'::uuid);

-- Links RLS
CREATE POLICY "Users manage own links" ON links FOR ALL USING (user_id = auth.jwt()->>'sub'::uuid);
CREATE POLICY "Public links viewable for uploads" ON links FOR SELECT USING (is_public = TRUE);

-- Folders RLS
CREATE POLICY "Users manage own folders" ON folders FOR ALL USING (user_id = auth.jwt()->>'sub'::uuid);

-- Files RLS
CREATE POLICY "Users access files from their links" ON files FOR ALL USING (user_id = auth.jwt()->>'sub'::uuid);

-- Batches RLS
CREATE POLICY "Users manage own batches" ON batches FOR ALL USING (user_id = auth.jwt()->>'sub'::uuid);
```

### Essential Indexes for Performance

```sql
-- Users indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_subscription ON users(subscription_tier);

-- Links indexes
CREATE INDEX idx_links_user_workspace ON links(user_id, workspace_id);
CREATE INDEX idx_links_slug_topic ON links(slug, topic);
CREATE INDEX idx_links_active ON links(is_active) WHERE is_active = TRUE;

-- Folders indexes
CREATE INDEX idx_folders_workspace_parent ON folders(workspace_id, parent_folder_id);
CREATE INDEX idx_folders_link ON folders(link_id) WHERE link_id IS NOT NULL;

-- Files indexes
CREATE INDEX idx_files_batch_folder ON files(batch_id, folder_id);
CREATE INDEX idx_files_link_user ON files(link_id, user_id);
CREATE INDEX idx_files_processing ON files(processing_status);

-- Batches indexes
CREATE INDEX idx_batches_link_status ON batches(link_id, status);
CREATE INDEX idx_batches_user_link ON batches(user_id, link_id);
```

## 🎨 Advanced UI/UX Architecture

### Multi-Link Upload Interface Design

```
Upload Flow Variations:
├── Base Link Upload (`/username`)
│   ├── Minimal form (name only)
│   ├── Optional folder creation
│   └── Batch naming prompt
├── Custom Topic Upload (`/username/topic`)
│   ├── Pre-configured destination
│   ├── Topic-specific instructions
│   └── Automatic organization
└── Security Enhanced Links
    ├── Email requirement
    ├── Password prompt
    └── Access verification
```

### **Domain-Driven Architecture (2025 Implementation)**

```
Domain-Driven Organization (COMPLETED):
├── /features/links/                    # 📋 Link Management Domain
│   ├── components/
│   │   ├── modals/                     # Link modals (create, edit, details)
│   │   ├── sections/                   # Link info, branding, stats sections
│   │   ├── views/                      # Link list, grid, empty states
│   │   └── cards/                      # Link cards & overview components
│   ├── hooks/                          # Domain-specific hooks (✅ MIGRATED)
│   ├── store/                          # Domain state management (✅ MIGRATED)
│   ├── services/                       # Business logic & API services (✅ MIGRATED)
│   ├── types/                          # Domain types & business rules
│   ├── styles/                         # Domain-specific styling (✅ MIGRATED)
│   ├── tests/                          # Domain-specific tests
│   └── index.ts                        # Domain barrel exports (✅ IMPLEMENTED)
│
├── /features/upload/                   # 📤 Upload Processing Domain
│   ├── components/                     # Upload UI components
│   ├── services/                       # Upload API & file processing (✅ MIGRATED)
│   ├── store/                          # Upload state management
│   ├── types/                          # Upload pipeline types (✅ MIGRATED)
│   ├── tests/                          # Upload functionality tests
│   └── index.ts                        # Domain barrel exports (✅ IMPLEMENTED)
│
├── /features/dashboard/                # 📊 Dashboard & Analytics Domain
│   ├── components/
│   │   ├── sections/                   # Analytics cards, headers, quick actions
│   │   └── views/                      # Dashboard container, empty states
│   ├── hooks/                          # Dashboard data hooks
│   ├── store/                          # Dashboard state management
│   ├── services/                       # Analytics API services
│   └── index.ts                        # Domain barrel exports (✅ IMPLEMENTED)
│
├── /features/settings/                 # ⚙️ User Settings Domain
│   ├── components/                     # Settings UI components
│   ├── store/                          # Settings state management
│   ├── services/                       # Settings API services
│   └── index.ts                        # Domain barrel exports (✅ IMPLEMENTED)
│
├── /features/landing/                  # 🚀 Landing Page Domain
│   ├── components/
│   │   ├── sections/                   # Hero, features, about, outro sections
│   │   └── views/                      # Landing page container
│   ├── hooks/                          # Landing animations (GSAP) (✅ MIGRATED)
│   ├── styles/                         # Landing page styles (✅ MIGRATED)
│   └── index.ts                        # Domain barrel exports (✅ IMPLEMENTED)
│
└── /features/auth/                     # 🔐 Authentication Domain (Minimal)
    ├── styles/                         # Auth page styling (✅ MIGRATED)
    └── index.ts                        # Domain barrel exports (✅ IMPLEMENTED)
```

**Migration Status**: ✅ **100% Complete** - Full domain-driven architecture implemented with barrel exports

### Permission Control Interface

```
Security Settings:
├── Link-Level Controls
│   ├── Email requirement toggle
│   ├── Password protection setup
│   ├── Public/private visibility
│   └── File type restrictions
├── Folder-Level Controls
│   ├── Auto-organization rules
│   ├── Access logging options
│   └── Custom link generation
```

## 🔒 Advanced Security Architecture

### Multi-Layer Security System

#### **Link-Level Security**

- **URL Validation**: Secure slug generation and validation
- **Access Controls**: Per-link permission enforcement
- **Rate Limiting**: Upload frequency and size limits
- **Expiration**: Time-based link deactivation

#### **Upload Security**

- **File Type Validation**: Comprehensive MIME type checking
- **Virus Scanning**: Real-time malware detection
- **Size Limits**: Configurable per-link file size controls
- **Security Warnings**: User alerts for compressed files

#### **Data Protection**

- **Encryption**: AES-256 at rest, TLS 1.3 in transit
- **Access Logging**: Complete audit trail
- **Privacy Controls**: GDPR-compliant data handling
- **Row Level Security**: Database-level protection

## 🚀 Advanced Development Methodology

### Multi-Link Testing Strategy

```typescript
// Link type testing patterns
describe('Multi-Link System', () => {
  describe('Base Links', () => {
    test('accepts uploads with minimal requirements');
    test('handles folder creation during upload');
    test('enforces security settings when enabled');
  });

  describe('Custom Topic Links', () => {
    test('auto-routes to correct folders');
    test('maintains topic-specific settings');
    test('handles public/private visibility');
  });

  describe('Permission Controls', () => {
    test('email requirements enforcement');
    test('password protection validation');
    test('access logging functionality');
  });
});
```

### Domain Architecture

```
/src/features/
├── links/                  # Multi-Link Management Domain
│   ├── components/
│   │   ├── base-link-handler/
│   │   ├── custom-link-handler/
│   │   ├── link-generator/
│   │   └── permission-controls/
│   ├── services/           # Link business logic
│   └── store/              # Link state management
├── files/                  # File Organization Domain
│   ├── components/
│   │   ├── folder-management/
│   │   ├── batch-processing/
│   │   ├── drag-drop-system/
│   │   └── auto-sorting/
│   ├── services/           # File business logic
│   └── store/              # File state management
├── security/               # Security & Access Control Domain
│   ├── components/
│   │   ├── access-controls/
│   │   ├── file-validation/
│   │   ├── security-warnings/
│   │   └── audit-logging/
│   ├── services/           # Security business logic
│   └── store/              # Security state management
```

## 💰 Enhanced Cost Projection (Monthly)

### Advanced Feature Costs

- **Vercel Pro**: $20/month (production deployment)
- **Supabase PostgreSQL**: $0 → $25/month (1GB → 10GB)
- **Clerk Authentication**: $0 → $25/month (10K MAU)
- **Supabase Storage**: $0 → $50/month (100GB → 2TB for multi-link usage)
- **Resend Email**: $0 → $20/month (3K → 50K emails)
- **Security Services**: $15/month (virus scanning, monitoring)
- **Domain + DNS**: $15/month (Cloudflare Pro)

**Total Monthly Cost**: $45 → $170/month (MVP → Growth stage)

### Revenue Targets (Enhanced)

- **150 users @ $8/month** (basic multi-links): $1,200/month
- **75 users @ $25/month** (advanced organization): $1,875/month
- **25 users @ $40/month** (enterprise security): $1,000/month
- **Total Revenue**: $4,075/month (target by month 6)

### **Clerk Billing Implementation Benefits**

#### **Development Advantages**

- **Zero Integration Time**: No custom Stripe code required - Clerk handles everything
- **Built-in Components**: Pre-built `<PricingTable />`, `<BillingPortal />`, and subscription management
- **Feature Gates**: Automatic access control based on subscription status
- **Real-time Updates**: Instant feature access changes on subscription events

#### **Business Advantages**

- **Faster Time to Market**: Launch billing in days, not weeks
- **Reduced Development Cost**: 60% less code complexity vs traditional Stripe integration
- **Better User Experience**: Seamless authentication + billing flow
- **Simplified Maintenance**: Clerk manages webhooks, edge cases, and compliance

#### **Technical Implementation**

```typescript
// Feature-based access control with Clerk
const { user } = useUser();
const hasFeature = (feature: string) => user?.publicMetadata?.features?.includes(feature);

// Usage in components
<CustomLinkCreator
  disabled={!hasFeature('custom_links')}
  upgradePrompt={!hasFeature('custom_links')}
/>
```

#### **Cost-Benefit Analysis**

- **Additional Cost**: +0.7% Clerk fee (~$29/month at $4,075 revenue)
- **Development Savings**: -40 hours @ $100/hr = $4,000 saved
- **Maintenance Savings**: -10 hours/month @ $100/hr = $1,000/month saved
- **ROI**: 3,400%+ return on additional fees through development efficiency

## 🎯 Enhanced Feature Prioritization

### Phase 1: Advanced MVP (Months 1-2)

- [ ] Multi-link system (base + custom topic links)
- [ ] Advanced upload requirements (name mandatory, email optional)
- [ ] Hierarchical folder system with pre-upload creation
- [ ] Batch organization with smart naming
- [ ] Basic permission controls (public/private, email requirements)
- [ ] Security warnings for file types

### Phase 2: Professional Features (Months 3-4)

- [ ] Password protection for upload links
- [ ] Advanced file organization tools (drag-drop, bulk operations)
- [ ] Right-click custom link generation
- [ ] Real-time notifications and progress tracking
- [ ] Advanced analytics with batch insights
- [ ] Audit logging and access controls

### Phase 3: Enterprise Scale (Months 5-6)

- [ ] White-label solutions with custom branding
- [ ] Advanced security controls and compliance features
- [ ] API for integrations and automation
- [ ] Multi-language support and accessibility
- [ ] Advanced reporting and analytics dashboard
- [ ] Enterprise user management and team features

## 🔄 Advanced Migration & Deployment Strategy

### Multi-Environment Setup

1. **Development**: Local Next.js with Supabase branch + test data
2. **Staging**: Vercel preview with staging database + security testing
3. **Production**: Vercel production with monitoring + audit logging

### Database Migration Strategy

- **Schema Versioning**: Drizzle migrations for multi-link system
- **Data Migration**: Safe transition from single to multi-link architecture
- **Rollback Procedures**: Quick revert capabilities for all schema changes
- **Testing**: Comprehensive migration testing with data integrity validation

---

_This planning document serves as the single source of truth for Foldly's advanced multi-link development strategy. All technical decisions should align with these architectural choices and security requirements._
