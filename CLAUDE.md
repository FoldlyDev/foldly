# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development

```bash
# Development server with Turbopack
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Linting
npm run lint

# Type checking
npm run type-check

# Code formatting
npm run format
npm run format:check
```

### Testing

```bash
# Run tests
npm run test

# Run tests with UI
npm run test:ui

# Run tests once (CI mode)
npm run test:run
```

### Database Management (Drizzle ORM)

```bash
# Push schema changes to database
npm run push

# Pull schema from database
npm run pull

# Generate SQL migrations
npm run generate

# Drop migrations
npm run drop

# Check schema
npm run check

# Run pending migrations
npm run up

# Execute migration script (Legacy - path needs update)
# npm run migrate  # Note: migration.ts file does not exist, update package.json
```

## Architecture Overview

### Tech Stack

- **Frontend**: Next.js 15 (App Router) + React 19 + TypeScript 5
- **Styling**: TailwindCSS 4.0 + Shadcn/ui components
- **State Management**: React Query v5 (server state) + Zustand (UI state)
- **Database**: Supabase (PostgreSQL) with Drizzle ORM
- **Authentication**: Clerk with JWT-based auth
- **File Storage**: Supabase Storage
- **Hosting**: Vercel

### Project Structure

The project follows a **feature-based architecture** with domain-driven design:

```
src/
├── app/                    # Next.js App Router pages
├── features/              # Domain-driven features
│   ├── analytics/        # Analytics dashboard
│   ├── auth/            # Authentication domain (minimal)
│   ├── billing/         # Subscription and billing management
│   ├── files/           # File management
│   ├── landing/         # Landing page marketing
│   ├── links/           # Multi-link system (base, custom, generated)
│   ├── notifications/   # Internal and external notifications
│   ├── settings/        # User settings
│   ├── upload/          # File upload processing
│   └── workspace/       # Workspace and folder management
├── components/          # Shared UI components
│   ├── marketing/       # Marketing page components
│   │   ├── animate-ui/  # Custom animated components
│   │   └── flip-card.tsx # Flip card component
│   ├── origin-ui/       # Origin UI components
│   │   ├── comp-569.tsx # Component 569
│   │   └── tree.tsx     # Tree component
│   └── ui/              # Reorganized UI system
│       ├── core/        # Core UI components (includes shadcn/)
│       ├── composite/   # Complex composite components
│       ├── feedback/    # Loading and feedback components
│       └── layout/      # Layout components
├── lib/                 # Global utilities
│   ├── database/        # Database schemas and connection (NEW)
│   │   ├── connection.ts # Centralized database connection
│   │   ├── schemas/     # Modular database schemas
│   │   │   ├── users.ts, workspaces.ts, links.ts, folders.ts
│   │   │   ├── batches.ts, files.ts, subscription-tiers.ts
│   │   │   ├── user-subscriptions.ts, enums.ts, relations.ts
│   │   │   └── index.ts # Clean export interface
│   │   └── types/       # Database type definitions
│   ├── db/              # Legacy database connection (DEPRECATED)
│   │   └── db.ts        # Use database/connection.ts instead
│   ├── services/        # Service layer
│   │   ├── billing/     # Subscription services
│   │   ├── files/       # File management services
│   │   ├── users/       # User management services
│   │   └── workspace/   # Workspace services
│   ├── webhooks/        # Webhook handlers
│   │   ├── clerk-webhook-handler.ts
│   │   └── error-recovery.ts
│   ├── hooks/           # Global hooks
│   ├── config/          # Configuration files
│   └── utils/           # Global utilities
└── types/               # Global TypeScript types
```

### Key Architectural Patterns

1. **Feature-Based Organization**: Each feature is self-contained with its own components, hooks, services, stores, and types.

2. **Server Actions + React Query**:
   - Server actions handle mutations
   - React Query manages caching and synchronization
   - Automatic cache invalidation on mutations

3. **Type-Safe Database Schema**:
   - Modular schema organization in `src/lib/database/schemas/`
   - Centralized connection in `src/lib/database/connection.ts`
   - Drizzle ORM for type-safe database operations
   - Schema exports through `drizzle/schema.ts` → `@/lib/database/schemas`
   - Row Level Security (RLS) policies for multi-tenancy

4. **State Management Hybrid**:
   - React Query for server state (data fetching, caching)
   - Zustand for UI state (modals, filters, selections)

### Database Schema & Migration System

**Schema Organization:**

- **Location**: `src/lib/database/schemas/` (modular organization)
- **Main Export**: `drizzle/schema.ts` exports from `@/lib/database/schemas`
- **Connection**: `src/lib/database/connection.ts` (centralized)
- **Legacy**: `src/lib/db/db.ts` (deprecated, use database/connection.ts)

**Migration Files** (in `drizzle/` directory):

- `0000_sad_vanisher.sql` through `0008_calm_black_widow.sql`
- `0009_flexible_subscription_system.sql` (latest)
- Migration metadata in `drizzle/meta/` directory

**8-Table PostgreSQL Schema:**

1. **users**: User accounts with Clerk integration, storage quotas, and usage tracking
2. **workspaces**: User workspaces for file organization
3. **links**: Multi-link types (base/custom/generated) with usage stats and storage limits
4. **folders**: Hierarchical folder structure with materialized paths
5. **batches**: Upload batch tracking with progress status
6. **files**: File metadata, storage paths, and processing status
7. **subscriptionTiers**: Available subscription plans and feature limits
8. **userSubscriptions**: User subscription state and billing management

### Authentication Flow

- Clerk handles authentication with middleware protection
- Protected routes: `/dashboard/*` and `/api/protected/*`
- JWT tokens used for Supabase Row Level Security
- Webhook integration at `/api/webhooks/clerk` for user sync

### File Upload System

- Multiple link types:
  - Base links: `foldly.com/username`
  - Custom links: `foldly.com/username/topic`
  - Generated links: Right-click folder creation
- Batch upload processing with progress tracking
- File security validation pipeline
- Automatic organization by uploader name and date

### Testing Strategy

- Vitest for unit and component tests
- React Testing Library for component testing
- Test files co-located with features
- Global test setup in `vitest.setup.ts`

### Performance Considerations

- React Query configured with:
  - 5-minute stale time
  - 10-minute garbage collection
  - Automatic refetch on window focus
- Server-side data prefetching with hydration
- Code splitting by feature/route
- Image optimization with Next.js Image

### Security Implementation

- Clerk authentication with protected routes
- Supabase Row Level Security policies
- File type validation and virus scanning pipeline
- Optional password protection for upload links
- Email requirement toggles for uploaders

## Current Development Phase

The project is in **Phase 3: Service Layer Integration** with all major architectural migrations complete. Current status:

**✅ Completed Migrations:**

1. Feature-Based Architecture Migration (January 2025) - Complete project reorganization
2. Zustand Store Architecture Migration (January 2025) - Modern state management
3. React Query + Server Actions Hybrid (January 2025) - Enterprise server state
4. Optimal Project Organization & Architecture Restructure (January 2025) - Performance optimization

**🚀 Current Focus:**

- Service layer integration and type alignment
- Multi-link system implementation
- Database service integration completion

## Database Configuration

### Current Setup (Drizzle ORM)

```typescript
// Primary connection: src/lib/database/connection.ts
import { db } from '@/lib/database/connection';

// Schema imports: src/lib/database/schemas/index.ts
import { users, links, workspaces } from '@/lib/database/schemas';

// Migration configuration: drizzle.config.ts
// Schema export: drizzle/schema.ts → exports from @/lib/database/schemas
```

### Legacy Files (Do Not Use)

- `src/lib/db/db.ts` - Deprecated, use `database/connection.ts`
- `src/lib/supabase/schemas/` - Removed, migrated to `database/schemas/`
- `src/lib/supabase/types/` - Removed, migrated to `database/types/`
- `npm run migrate` script references non-existent `migration.ts`

## Component Architecture Updates

### UI System Reorganization

**New Structure:**

```
src/components/ui/
├── core/          # shadcn + base components
├── composite/     # Complex multi-component compositions
├── feedback/      # Loading, skeletons, error states
└── layout/        # Layout-specific components
```

**Migration Status:**

- ✅ Components moved to new structure
- ✅ Core exports updated in `src/components/ui/core/index.ts`
- 🚧 Feature imports need updating to new paths

## Import Path Guidelines

### Database

```typescript
// ✅ Correct
import { db } from '@/lib/database/connection';
import { users, links } from '@/lib/database/schemas';

// ❌ Deprecated
import { db } from '@/lib/db/db';
import { users } from '@/lib/supabase/schemas';
```

### UI Components

```typescript
// ✅ Correct
import { Button } from '@/components/ui/core/shadcn';
import { ConfigurableModal } from '@/components/ui/composite';
import { ContentLoader } from '@/components/ui/feedback';

// ❌ Old paths (being phased out)
import { Button } from '@/components/ui/shadcn';
import { ConfigurableModal } from '@/components/ui';
```

## Important Notes

- **Database**: Always use `@/lib/database/connection` for db access
- **Schemas**: Import from `@/lib/database/schemas` (not supabase paths)
- **UI Components**: Use new organized structure (core/composite/feedback/layout)
- **Services**: Domain-specific services in `@/lib/services/{domain}/`
- **Migration Scripts**: Update package.json migrate script path if needed
- **Testing**: Maintain co-located test files with updated import paths
- **Type Safety**: Ensure all database operations use Drizzle types
- **Feature Architecture**: Follow feature-based organization for new domains

## Client/Server Separation Rules

**CRITICAL RULE: Always maintain proper client/server boundaries in Next.js 15 App Router**

### Required Architecture Pattern:
```
Client Component → Server Action → Service Layer → Database
```

### Mandatory Separation Rules:

1. **Client Components (`'use client'`)**:
   - NEVER import database connections or server-only functions directly
   - NEVER access environment variables directly
   - Use server actions for all data mutations
   - Use React Query for data fetching with server actions

2. **Server Actions**:
   - Handle all database operations
   - Process server-side logic and validation
   - Return serializable data to client components
   - Use proper error handling and type safety

3. **Service Layer**:
   - Contains business logic and database operations
   - Should only be called from server actions or server components
   - NEVER imported directly by client components

4. **Database Layer**:
   - Only accessible through service layer
   - Protected by RLS policies and proper authentication

### Violation Examples to AVOID:
```typescript
// ❌ WRONG - Client component importing server service
'use client';
import { getUserData } from '@/lib/services/users/user-service';

// ❌ WRONG - Direct database access from client
'use client';
import { db } from '@/lib/database/connection';

// ❌ WRONG - Server environment in client code
'use client';
const apiKey = process.env.DATABASE_URL;
```

### Correct Implementation:
```typescript
// ✅ CORRECT - Client component using server action
'use client';
import { getUserDataAction } from '../lib/actions/user-actions';

// ✅ CORRECT - Server action calling service
// app/actions/user-actions.ts
import { getUserData } from '@/lib/services/users/user-service';
export async function getUserDataAction() {
  return await getUserData();
}
```

**This rule prevents hydration errors, security vulnerabilities, and maintains proper Next.js architecture.**
