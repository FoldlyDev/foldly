# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Foldly** is an email-centric file collection platform built for scenarios like "tax accountant with 30 clients" - enabling users to create shareable links where external users can upload files, tracked by their email addresses. Currently in **V2 major refactor** phase on branch `v2/major-refactor`.

## Common Commands

### Development
```bash
npm run dev          # Start development server with Turbopack
npm run build        # Production build
npm start            # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking without emitting files
```

### Testing
```bash
npm run test         # Run tests with Vitest (watch mode)
npm run test:ui      # Run tests with Vitest UI
npm run test:run     # Run tests once (CI mode)
```

### Database Operations
```bash
npm run push         # Push schema changes to database
npm run push:force   # Force push schema changes (destructive)
npm run generate     # Generate database migrations
npm run migrate      # Run database migrations
npm run check        # Check database schema consistency
```

### Code Quality
```bash
npm run format       # Format code with Prettier
npm run format:check # Check if code is formatted
```

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript
- **Authentication**: Clerk (with email/password, magic links)
- **Database**: Supabase (PostgreSQL) via Drizzle ORM
- **File Storage**: Google Cloud Storage (planned)
- **Styling**: Tailwind CSS 4 + shadcn/ui components
- **State Management**: TanStack Query (React Query) + Zustand
- **Animations**: Framer Motion + GSAP + Lenis (smooth scroll)
- **Email**: Resend (transactional emails)

### Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth-related routes (sign-in, sign-up, onboarding)
│   ├── (root)/            # Landing page
│   ├── dashboard/         # Main dashboard routes (analytics, billing, links, etc.)
│   ├── [...slug]/         # Dynamic shareable link routes
│   ├── layout.tsx         # Root layout with providers
│   └── providers.tsx      # Global providers (Clerk, Theme, Query, Notifications)
│
├── components/            # Shared/global components
│   ├── buttons/          # Reusable button components (Primary/Secondary/TertiaryCTA)
│   ├── core/             # Core components (ErrorBoundary, PerformanceMonitor)
│   ├── layout/           # Layout components (Navigation, Logo, PageTransitions)
│   └── ui/shadcn/        # shadcn/ui components (button, card, sonner)
│
├── modules/              # Feature modules (self-contained)
│   ├── analytics/        # Analytics dashboard
│   ├── billing/          # Billing and subscriptions
│   ├── landing/          # Landing page (complex GSAP animations)
│   ├── links/            # Shareable link management
│   ├── notifications/    # Notification system
│   ├── settings/         # User settings
│   ├── uploads/          # File upload handling
│   └── workspace/        # Main workspace/file management
│
├── hooks/                # Global hooks (organized by purpose)
│   ├── data/            # Data fetching hooks (wrap server actions)
│   │   ├── use-onboarding-status.ts
│   │   └── use-user-workspace.ts
│   └── ui/              # UI utility hooks
│       └── use-scroll-position.ts
│
├── lib/                  # Core utilities and configurations
│   ├── actions/         # Global server actions (cross-module)
│   │   ├── onboarding.actions.ts
│   │   └── workspace.actions.ts
│   ├── config/          # Configuration files (query-client, supabase, performance)
│   ├── database/        # Database layer
│   │   ├── schemas/     # Drizzle ORM schemas (users, workspaces, links, folders, files, permissions)
│   │   ├── queries/     # Reusable database queries (called by actions)
│   │   ├── migrations/  # Database migration utilities
│   │   └── connection.ts # Database connection setup
│   └── utils/           # Utility functions (security, logger, browser-detection)
│
└── middleware.ts         # Clerk authentication middleware
```

### Key Architectural Patterns

#### Module-Based Organization
Each feature module (`src/modules/*`) is self-contained with:
- `components/views/` - Top-level view components
- `components/sections/` - Section components (if applicable)
- `components/ui/` - Module-specific UI components
- `hooks/` - Module-specific React hooks
- `lib/actions/` - Module-specific server actions
- `index.ts` - Module exports

**Global vs Module-Specific**:
- **Global** (`src/lib/actions`, `src/hooks`): Cross-module functionality used in 3+ places
- **Module-Specific** (`src/modules/{name}/lib/actions`, `src/modules/{name}/hooks`): Feature-specific logic

#### Database Schema (V2)
Six core tables using Drizzle ORM:
1. **users** - Synced with Clerk authentication
2. **workspaces** - 1:1 relationship with users (MVP constraint)
3. **links** - Shareable links with globally unique slugs
4. **folders** - Hierarchical folder structure (`parent_folder_id`)
5. **files** - File metadata with `uploader_email` tracking
6. **permissions** - Email-based access control for links

All schemas are exported from `src/lib/database/schemas/index.ts`.

#### Authentication Flow
- Clerk handles all authentication
- Middleware protects `/dashboard/*` and `/onboarding/*` routes
- Public routes include `/`, `/sign-in/*`, `/sign-up/*`, and `[...slug]` (shareable links)
- Redirects to `/unauthorized` instead of sign-in for protected routes

#### State Management
- **Server State**: TanStack Query (React Query) for API data
- **Client State**: Zustand for lightweight local state
- **Theme**: `next-themes` for dark mode support

## Development Guidelines

### Import Aliases
Use `@/*` for all imports:
```typescript
import { db } from '@/lib/database/connection';
import { Button } from '@/components/ui/shadcn/button';
import { UserWorkspace } from '@/modules/workspace';
```

### Component Conventions
- Use TypeScript for all components
- Prefer Server Components by default (add `'use client'` only when needed)
- Use shadcn/ui components from `@/components/ui/shadcn/*`
- Custom CTA buttons available in `@/components/buttons/*`

### Data Flow Pattern

**Three-Layer Architecture**:
```
CLIENT          →  REACT QUERY HOOK   →  SERVER ACTION     →  DATABASE QUERY
(Component)        (src/hooks/data/)      (src/lib/actions/)   (src/lib/database/queries/)
                        ↓                        ↓                      ↓
                   useOnboardingStatus()  checkOnboardingStatus()  getUserWorkspace()
```

**Rules**:
1. **Client components** call hooks from `@/hooks`
2. **Hooks** wrap server actions with React Query
3. **Server actions** handle auth + business logic, call database queries
4. **Database queries** are pure Drizzle operations (reusable)

### Server Actions & Hooks

**Global Actions** (`src/lib/actions/`):
```typescript
// Use for cross-module operations (3+ modules)
import { checkOnboardingStatus, getUserWorkspaceAction } from '@/lib/actions';
```

**Global Hooks** (`src/hooks/`):
```typescript
// Use in any client component
import { useOnboardingStatus, useUserWorkspace } from '@/hooks';

function MyComponent() {
  const { data: status, isLoading } = useOnboardingStatus();
  const { data: workspace } = useUserWorkspace();
}
```

**Module Actions** (`src/modules/{name}/lib/actions/`):
```typescript
// Use for feature-specific logic (1-2 modules)
// Example: src/modules/links/lib/actions/link.actions.ts
```

### Database Operations
- **In server actions**: Import from `@/lib/database/queries`
- **Never in client components**: Actions enforce server boundary
- Import schemas: `import { users, workspaces } from '@/lib/database/schemas'`
- Use Drizzle ORM query builder (never raw SQL)

### Animation Architecture (Landing Page)
The landing page uses a sophisticated animation orchestrator:
- **useLandingAnimationOrchestrator**: Coordinates all section animations
- **useLenisScroll**: Smooth scrolling with Lenis
- Individual hooks per section: `useIntroSectionAnimation`, `useAboutSectionAnimation`, etc.
- Uses GSAP ScrollTrigger for scroll-based animations
- All animations wrapped in `animation-error-boundary.tsx`

### Environment Variables
Key environment variables (see `.env.local`):
- `DATABASE_URL` - PostgreSQL connection string
- `POSTGRES_URL_NON_POOLING` - Non-pooling URL for Drizzle Kit
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk public key
- `CLERK_SECRET_KEY` - Clerk secret key
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

## Database Workflow

### Making Schema Changes
1. Edit schema files in `src/lib/database/schemas/`
2. Update `drizzle/schema.ts` to reflect changes
3. Generate migration: `npm run generate`
4. Review generated migration in `drizzle/` directory
5. Push to database: `npm run push` or `npm run push:force`

### Migration Best Practices
- Always generate migrations for production
- Use `npm run check` to verify schema consistency
- Use `npm run push:force` sparingly (destructive)
- Keep `drizzle/schema.ts` in sync with `src/lib/database/schemas/`

## Performance Considerations

- Next.js config includes package import optimizations for `lucide-react`, `framer-motion`, and `@tanstack/react-query`
- Production builds remove console statements
- Images optimized via Next.js Image component
- Clerk and Clerk CDN images whitelisted in next.config.ts
- PerformanceMonitor component available at `@/components/core/PerformanceMonitor`

## Testing

- Tests run with Vitest + React Testing Library
- Test files: `**/*.{test,spec}.{ts,tsx}`
- Setup file: `vitest.setup.ts`
- Use `@testing-library/react` for component testing
- Use `@testing-library/jest-dom` for DOM matchers

## Current Development Status

**Branch**: `v2/major-refactor`

**Phase**: Foundation (Week 1-2) - 86% Complete (6/7 tasks)

**Recent Work**:
- ✅ Database schemas implemented in Drizzle ORM
- ✅ Migrations generated and pushed to Supabase
- ✅ Global actions & hooks layer (cross-module data operations)
- ✅ Next.js 15 + React 19 configured
- ✅ Clerk authentication configured
- ✅ Supabase connection configured

**Next Steps** (per `docs/execution/README.md`):
1. Build onboarding UI (username input + workspace creation)
2. Set up Google Cloud Storage bucket
3. Implement base UI components (shadcn/ui)

**Planning Documentation**: See `/docs/planning/` for design decisions, MVP features, and tech stack details.

## Key Files to Know

**Core Setup**:
- `src/middleware.ts` - Authentication routing logic
- `src/app/providers.tsx` - Global provider setup
- `next.config.ts` - Next.js build configuration
- `vitest.config.mts` - Test configuration

**Database Layer**:
- `src/lib/database/connection.ts` - Database connection singleton
- `src/lib/database/schemas/index.ts` - All database schemas
- `src/lib/database/queries/index.ts` - Reusable database queries
- `drizzle.config.ts` - Drizzle Kit configuration

**Global Actions & Hooks**:
- `src/lib/actions/index.ts` - Global server actions
- `src/hooks/index.ts` - All global hooks (data + UI)

**Documentation**:
- `docs/execution/README.md` - Implementation tracking
- `docs/planning/features/mvp-features.md` - MVP feature checklist

## Common Patterns

### Error Boundaries
Use `ModuleErrorBoundary` from `@/components/core/ModuleErrorBoundary` to wrap feature modules.

### Loading States
Each module has a skeleton component (e.g., `AnalyticsSkeleton`, `WorkspaceSkeleton`).

### Notifications
Use `NotificationProvider` from `@/features/notifications/providers/NotificationProvider` (wrapped in root providers).

### Page Transitions
Use `PageTransitionEffect` or `PageFadeRevealEffect` from `@/components/layout/` for page animations.

## MVP Core Functionality

The application is built around email-centric file collection:
1. Users create folders and generate shareable links
2. External users upload files via links (no account required)
3. Files are tracked by uploader email
4. Owners filter/view files by email across folders
5. Email-based permission management

See `docs/planning/features/mvp-features.md` for complete feature checklist.
