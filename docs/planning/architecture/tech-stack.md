# Foldly V2 Tech Stack

Last Updated: October 8, 2025

## Overview

Foldly is built as a modern full-stack web application using Next.js, Supabase, and Google Cloud Storage.

---

## Frontend

### Framework
- **Next.js 15+** (App Router)
  - Server Components for performance
  - Server Actions for mutations
  - API Routes for webhooks
  - Static generation where possible

### UI Framework
- **React 19+**
  - Hooks-based architecture
  - Context API for global state
  - TanStack Query (React Query) for server state

### Styling
- **Tailwind CSS 4**
  - Utility-first CSS
  - Custom design system
  - Responsive by default

### Component Library
- **shadcn/ui**
  - Accessible components
  - Customizable via Tailwind
  - Copy-paste components (not package dependency)

### Form Handling
- **React Hook Form**
  - Performance-optimized
  - Built-in validation
  - TypeScript support

### File Upload
- **Uppy** or **React Dropzone**
  - Drag-and-drop support
  - Progress tracking
  - Chunked uploads for large files

---

## Backend

### Database
- **Supabase (PostgreSQL)**
  - Managed PostgreSQL database
  - Real-time subscriptions (future feature)
  - Row Level Security (RLS) policies
  - Built-in auth integration

### Authentication
- **Clerk**
  - User management
  - Email/password auth
  - Magic link support
  - Payment integration (Stripe via Clerk)
  - User profiles and metadata

### File Storage
- **Provider-Agnostic Storage Abstraction**
  - Supports both Supabase Storage and Google Cloud Storage
  - Switch providers via `STORAGE_PROVIDER` environment variable
  - Unified API for upload, delete, signed URLs, file existence checks

- **Supabase Storage**
  - Default provider (integrated with existing Supabase infrastructure)
  - Two buckets: `foldly-link-branding` (public), `foldly-uploads` (private)
  - No file size limits or MIME type restrictions (flexible configuration)
  - Public URLs for branding assets, signed URLs for private uploads

- **Google Cloud Storage (GCS)** (Optional)
  - Alternative provider for higher storage requirements
  - Scalable object storage
  - Signed URLs for secure access
  - Lifecycle policies for retention

### API Layer
- **Next.js Server Actions**
  - Server-side mutations
  - Type-safe with TypeScript
  - Direct database access

- **Next.js API Routes**
  - External webhooks
  - Third-party integrations
  - File upload endpoints

---

## Infrastructure

### Hosting
- **Vercel**
  - Automatic deployments from Git
  - Edge network (CDN)
  - Serverless functions
  - Environment variables management

### Database Hosting
- **Supabase Cloud**
  - Managed PostgreSQL
  - Automatic backups
  - Connection pooling
  - SSL connections

### File Storage Hosting
- **Supabase Storage** (Default)
  - Buckets: `foldly-link-branding` (public), `foldly-uploads` (private)
  - Integrated with existing Supabase infrastructure
  - Public access for branding assets only

- **Google Cloud Platform** (Optional Alternative)
  - GCS buckets: `foldly-link-branding`, `foldly-uploads`
  - Region: Multi-region (US or EU)
  - Public access: disabled (signed URLs only)
  - Signed URLs for access control

---

## Payments

### Payment Processing
- **Stripe** (via Clerk)
  - Subscription billing
  - Usage-based billing (storage overages)
  - Customer portal
  - Webhooks for events

### Pricing Tiers
```
Free:
  - 1 active link
  - 2 GB storage
  - Basic features

Pro ($10/mo):
  - Unlimited links
  - 50 GB storage
  - Email invitations
  - Custom branding

Team ($30/mo):
  - Everything in Pro
  - 200 GB storage
  - Multi-user workspaces
  - Analytics
```

---

## Development Tools

### Language
- **TypeScript**
  - Type safety across frontend/backend
  - Better DX with autocomplete
  - Catch errors at compile time

### Package Manager
- **pnpm** or **npm**
  - Fast, efficient installations
  - Workspace support (monorepo ready)

### Code Quality
- **ESLint**
  - Next.js recommended config
  - TypeScript rules
  - React best practices

- **Prettier**
  - Consistent code formatting
  - Auto-format on save

### Version Control
- **Git** + **GitHub**
  - Feature branch workflow
  - Pull request reviews
  - CI/CD via GitHub Actions

---

## External Services

### Email
- **Resend**
  - Transactional emails
  - Upload notifications
  - Invitation emails
  - OTP verification
  - Welcome emails

### Monitoring
- **Vercel Analytics**
  - Web vitals
  - Page views
  - Error tracking

- **Sentry** (optional)
  - Error monitoring
  - Performance tracking
  - User feedback

### Analytics
- **PostHog** or **Plausible**
  - Privacy-friendly analytics
  - Event tracking
  - User funnels

---

## File Upload Architecture

### Flow
```
1. User visits upload link
   ↓
2. Next.js page loads (Server Component)
   ↓
3. Client-side file selection (React Dropzone)
   ↓
4. Client requests signed upload URL
   ↓
5. Next.js API Route generates signed GCS URL
   ↓
6. Client uploads directly to GCS
   ↓
7. On success, client calls Next.js Server Action
   ↓
8. Server Action stores metadata in Supabase
   ↓
9. Server Action sends notification (optional)
```

### Direct Upload Benefits
- ✅ Reduced server load
- ✅ Faster uploads (direct to GCS)
- ✅ Progress tracking on client
- ✅ Lower Vercel function usage

---

## Database Access

### ORM
- **Drizzle ORM**
  - Type-safe queries
  - SQL-like syntax
  - Migration management
  - Lightweight and performant

---

## Security

### Authentication
- Clerk handles all auth
- Secure session management
- CSRF protection
- Rate limiting

### File Access
- No public GCS URLs
- All access via signed URLs (expiring)
- Signed URL TTL: 1 hour
- RLS policies on database

### Data Privacy
- GDPR compliance ready
- User data deletion support
- Email encryption in transit
- Secure password storage (Clerk)

---

## Performance

### Optimization Strategies
- **Next.js Static Generation** for public pages
- **Edge Caching** via Vercel CDN
- **Image Optimization** with Next.js Image
- **Lazy Loading** for file lists
- **Pagination** for large file sets
- **Database Indexing** on `uploader_email`, `link_id`, `folder_id`

### Target Metrics
- First Contentful Paint (FCP): < 1.5s
- Time to Interactive (TTI): < 3s
- Upload start latency: < 500ms
- Dashboard load time: < 2s

---

## API Integrations (Future)

### Planned Integrations
- **Google Drive API** - Sync files to Drive
- **Dropbox API** - Sync files to Dropbox
- **Zapier** - Webhook automation
- **Slack API** - Upload notifications

### Webhook Events
```
events:
  - file.uploaded
  - folder.created
  - link.generated
  - user.promoted (role change)
```

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Storage Provider Configuration
STORAGE_PROVIDER=supabase  # or 'gcs'

# Supabase Storage
SUPABASE_BRANDING_BUCKET_NAME=foldly-link-branding
SUPABASE_UPLOADS_BUCKET_NAME=foldly-uploads
NEXT_PUBLIC_SUPABASE_BRANDING_BUCKET_URL=
NEXT_PUBLIC_SUPABASE_UPLOADS_BUCKET_URL=

# Google Cloud Storage (optional - only needed if STORAGE_PROVIDER=gcs)
GCS_PROJECT_ID=
GCS_CLIENT_EMAIL=
GCS_PRIVATE_KEY=
GCS_BRANDING_BUCKET_NAME=foldly-link-branding
GCS_UPLOADS_BUCKET_NAME=foldly-uploads

# Security
LINK_PASSWORD_ENCRYPTION_KEY=  # 32-byte hex key (64 characters)

# Stripe (via Clerk)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Email (Resend)
RESEND_API_KEY=
RESEND_FROM_EMAIL=
RESEND_FROM_NAME=
RESEND_REPLY_TO=

# Redis (Upstash - Rate Limiting)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# App
NEXT_PUBLIC_APP_URL=https://foldly.com
```

---

## Deployment Strategy

### Environments
- **Development:** Local machine
- **Preview:** Vercel preview deployments (per PR)
- **Production:** Vercel production (main branch)

### CI/CD Pipeline
```
1. Push to GitHub
   ↓
2. Vercel detects changes
   ↓
3. Run build
   ↓
4. Run type check (tsc)
   ↓
5. Run linter (ESLint)
   ↓
6. Run tests (future)
   ↓
7. Deploy to preview/production
```

---

## Migration Strategy

### Database Migrations
- **Supabase Migrations**
  - SQL-based migrations
  - Version controlled
  - Applied via Supabase CLI

- **Prisma Migrations** (if using Prisma)
  - Schema-driven migrations
  - Auto-generated SQL
  - Migration history tracking

---

## Backup & Disaster Recovery

### Database Backups
- **Supabase:** Daily automatic backups (7-day retention)
- **Manual backups:** Weekly exports to GCS

### File Storage Backups
- **GCS:** Object versioning enabled
- **Lifecycle policy:** Delete versions > 30 days old

### Recovery Plan
1. Database: Restore from Supabase backup
2. Files: Restore from GCS versioned objects
3. Code: Redeploy from Git tag

---

## Tech Stack Decision Log

| Component | Chosen | Alternatives Considered | Reason |
|-----------|--------|------------------------|--------|
| Database | Supabase | Firebase, PlanetScale | RLS, real-time, PostgreSQL |
| Storage | Supabase Storage + GCS | Supabase only, S3 | Flexibility, provider abstraction |
| Auth | Clerk | Supabase Auth, Auth0 | Payment integration, UX |
| Frontend | Next.js | Remix, Astro | App Router, Server Actions |
| Styling | Tailwind | CSS Modules, Styled Components | Utility-first, fast |
| Deployment | Vercel | Netlify, Railway | Best Next.js DX |

---

## Summary

**Core Stack:**
- Next.js 15 + React 19 + TypeScript
- Supabase (PostgreSQL) + Drizzle ORM
- Clerk (Auth + Payments)
- Resend (Email) + Upstash Redis (Rate Limiting)
- Supabase Storage + Google Cloud Storage (provider-agnostic)
- Vercel (Hosting)

**Key Benefits:**
- ✅ Type-safe end-to-end
- ✅ Scalable from day 1
- ✅ Managed services (low ops burden)
- ✅ Modern DX
- ✅ Production-ready security
- ✅ Storage flexibility (easy provider switching)
