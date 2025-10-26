# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Foldly** is an email-centric file collection platform built for scenarios like "tax accountant with 30 clients" - enabling users to create shareable links where external users can upload files, tracked by their email addresses. Currently in **V2 development** phase on branch `v2/link-module`.

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
- **File Storage**: Google Cloud Storage
- **Styling**: Tailwind CSS 4 + shadcn/ui components
- **State Management**: TanStack Query (React Query) + Zustand
- **Animations**: Framer Motion + GSAP + Lenis (smooth scroll)
- **Email**: Resend (transactional emails)
- **Forms**: React Hook Form + date-fns + react-day-picker

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
│   ├── auth/             # Authentication forms, components, and onboarding
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
│   │   ├── use-onboarding.ts
│   │   ├── use-user-workspace.ts
│   │   └── use-email.ts
│   ├── ui/              # UI component-specific hooks
│   │   ├── use-modal-state.ts
│   │   └── use-toast.ts
│   └── utility/         # Generic reusable patterns
│       ├── use-controlled-state.ts
│       ├── use-data-state.ts
│       ├── use-file-upload.ts
│       ├── use-is-in-view.ts
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
│   ├── gcs/             # Google Cloud Storage client
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
3. **links** - Shareable links with globally unique slugs, password protection, expiration
4. **folders** - Hierarchical folder structure (`parent_folder_id`)
5. **files** - File metadata with `uploader_email` tracking
6. **permissions** - Email-based access control for links

**Link Configuration** (JSONB): `notifyOnUpload`, `customMessage`, `requiresName`, `expiresAt`, `passwordProtected`, `password` (hashed)

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

### Architectural Rules (MANDATORY)

#### Hook Organization
- **Single Domain Principle**: One hook file per entity domain
  - ✅ `use-user.ts` - User operations only
  - ✅ `use-workspace.ts` - Workspace operations only
  - ✅ `use-links.ts` - Link operations only
  - ❌ `use-user-workspace.ts` - Combines two domains (violates principle)

#### Hook Subdirectory Organization
- **data/** (`src/hooks/data/`): React Query hooks wrapping server actions
  - ✅ `use-onboarding.ts`, `use-user.ts`, `use-links.ts`
  - One hook file per entity domain

- **ui/** (`src/hooks/ui/`): UI component-specific hooks
  - ✅ `use-modal-state.ts` - Modal state management
  - ✅ `use-toast.ts` - Toast notifications
  - Tightly coupled to specific UI components

- **utility/** (`src/hooks/utility/`): Generic reusable patterns
  - ✅ `use-controlled-state.ts` - Controlled component pattern
  - ✅ `use-data-state.ts` - Generic data state machine
  - ✅ `use-file-upload.ts` - File upload state machine
  - ✅ `use-is-in-view.ts` - Intersection observer
  - ✅ `use-scroll-position.ts` - Scroll position tracking
  - Framework-agnostic patterns, not tied to specific UI

#### React Query Keys
- **Centralized Keys**: ALL query keys defined in `src/lib/config/query-keys.ts`
- **NO cross-hook imports**: Hooks must import keys from centralized file, never from other hooks
  - ✅ `import { linkKeys } from '@/lib/config/query-keys'`
  - ❌ `import { linkKeys } from './use-links'` (creates tight coupling)
- **Key Structure Pattern**:
  ```typescript
  export const entityKeys = {
    all: ['entity'] as const,
    lists: () => [...entityKeys.all, 'list'] as const,
    detail: (id: string) => [...entityKeys.all, 'detail', id] as const,
  } as const;
  ```

#### Utility Organization
- **Single Source of Truth**: ALL utilities go in `lib/utils/` (NEVER create parallel structures)
  - ✅ `lib/utils/react-query-helpers.ts` - React Query utilities
  - ✅ `lib/utils/action-helpers.ts` - Server action utilities
  - ❌ `hooks/utils/` - FORBIDDEN (creates fragmentation)
  - ❌ `components/utils/` - FORBIDDEN
  - ❌ `modules/*/utils/` - FORBIDDEN
- **Naming Convention**: `{technology}-helpers.ts` for tech-specific utilities
  - Examples: `action-helpers.ts`, `react-query-helpers.ts`, `security.ts`, `validation-helpers.ts`

#### Validation Helpers
Global validation builders for consistent patterns (`@/lib/utils/validation-helpers`):
- `createHexColorSchema()` - Hex color validation (6-digit or shorthand)
- `createEmailSchema()` - Email validation with normalization
- `normalizeHexColor()`, `normalizeEmail()` - Normalization utilities
- `isValidHexColor()`, `isValidEmail()` - Runtime validation
- `isDuplicateEmail()` - Duplicate detection

**Usage:**
```typescript
import { createHexColorSchema, createEmailSchema } from '@/lib/utils/validation-helpers';

const accentColor = createHexColorSchema({ fieldName: 'Accent color' });
const inviteEmail = createEmailSchema({ fieldName: 'Invitee email' });
```

#### React Query Helpers Usage
ALL data hooks must use centralized React Query helpers from `@/lib/utils/react-query-helpers`:

```typescript
import { transformActionError, transformQueryResult, createMutationErrorHandler } from '@/lib/utils/react-query-helpers';

// For queries
export function useEntityList() {
  return useQuery({
    queryKey: entityKeys.lists(),
    queryFn: async () => {
      const result = await getEntitiesAction();
      return transformQueryResult(result, 'Failed to fetch entities', []);
    },
  });
}

// For mutations
export function useCreateEntity() {
  return useMutation({
    mutationFn: async (input: CreateEntityInput) => {
      const result = await createEntityAction(input);
      return transformActionError(result, 'Failed to create entity');
    },
    onError: createMutationErrorHandler('Entity creation'),
    retry: false, // Never retry mutations
  });
}
```

#### Validation Schema Organization
- **Global Validation** (`src/lib/validation/`): Schemas consumed by global actions/hooks
  - ✅ Core domain entities used by 3+ modules (users, workspaces, links, permissions)
  - ✅ Cross-cutting concerns (authentication, authorization, rate limiting)
  - ✅ Reusable field schemas (base-schemas.ts: UUID, email, slug builders)
  - ❌ Feature-specific UI validation (forms, wizards)
  - ❌ Module-specific domain logic (branding, custom settings)

- **Module Validation** (`src/modules/{name}/lib/validation/`): Feature-specific schemas
  - ✅ UI form validation (React Hook Form, Zod integration)
  - ✅ Feature-specific fields (branding colors, logo uploads)
  - ✅ Module-specific server actions (not used by other modules)
  - ✅ Conditional validation logic unique to module

**Rule**: Validation co-locates with its primary consumer (action location determines schema location)

**Examples**:
- ✅ `src/lib/validation/link-schemas.ts` - Used by global link actions
- ✅ `src/lib/validation/permission-schemas.ts` - Used by global permission actions
- ✅ `src/modules/links/lib/validation/link-branding-schemas.ts` - Used by module branding actions
- ✅ `src/modules/links/lib/validation/link-form-schemas.ts` - Used by module UI forms

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
- Import types: `import type { User, Workspace } from '@/lib/database/schemas'`
- Use Drizzle ORM query builder (never raw SQL)

### User Management
User operations follow the three-layer architecture:
- **Database Queries**: `getUserById()`, `createUser()`, `updateUser()`, `getUserByEmail()`, etc.
- **Server Actions**: `createUserAction()`, `getUserAction()`, `updateUserProfileAction()`
- **Important**: User must be created in database BEFORE workspace (foreign key dependency)

### Modal Management Pattern
The application uses a lightweight modal state management pattern with AnimateUI Modal components:

**Hook**: `useModalState<TData>()` from `@/hooks/ui/use-modal-state`
- Manages open/closed state and data for a single modal
- Returns: `{ isOpen, data, open, close }`
- Type-safe: Generic type parameter for modal data

**Pattern**: One hook instance per modal type
```typescript
// In a component
import { useModalState } from '@/hooks';
import { Modal, ModalContent, ModalHeader, ModalTitle } from '@/components/ui/animateui/dialog';

const linkDetailsModal = useModalState<Link>();
const editLinkModal = useModalState<Link>();
const deleteModal = useModalState<{ id: string; name: string }>();

// Open modals
linkDetailsModal.open(linkData);
editLinkModal.open(linkData);
deleteModal.open({ id: link.id, name: link.name });

// In JSX - each modal component rendered separately
<LinkDetailsModal
  link={linkDetailsModal.data}
  isOpen={linkDetailsModal.isOpen}
  onOpenChange={(open) => !open && linkDetailsModal.close()}
/>
<EditLinkModal
  link={editLinkModal.data}
  isOpen={editLinkModal.isOpen}
  onOpenChange={(open) => !open && editLinkModal.close()}
/>
```

**Key Benefits**:
- ✅ Reduces boilerplate (1 hook call vs 2 useState calls)
- ✅ Type-safe modal data
- ✅ Works with AnimateUI Modal components
- ✅ Preserves all modal behaviors (click outside, ESC key, animations)
- ✅ No modal nesting (portals to document.body)
- ✅ No prop drilling

**Modal Components**: Use AnimateUI Modal primitives (`@/components/ui/animateui/dialog`)
- Built on Radix UI Dialog primitives
- Framer Motion animations
- Controlled pattern with `open` and `onOpenChange` props
- Available components: `Modal`, `ModalContent`, `ModalHeader`, `ModalTitle`, `ModalDescription`, `ModalFooter`, `ModalClose`, `ModalTrigger`
- **Note**: Exported as Modal aliases for application code; Dialog primitives remain for internal implementation

### Management Bar Pattern
The application uses a configurable management bar component for bulk actions and navigation:

**Component**: `ManagementBar` from `@/components/ui/animateui`
- Supports optional pagination, expandable action buttons, and primary action
- Type-safe with proper TypeScript interfaces
- Fully responsive with container queries

**Pattern**: Configure via props
```typescript
import { ManagementBar } from '@/components/ui/animateui';
import { Plus, Trash2, Edit } from 'lucide-react';

<ManagementBar
  pagination={{
    currentPage: 1,
    totalPages: 10,
    onPageChange: (page) => setPage(page),
  }}
  actions={[
    { id: 'edit', icon: Edit, label: 'Edit', onClick: handleEdit, variant: 'info' },
    { id: 'delete', icon: Trash2, label: 'Delete', onClick: handleDelete, variant: 'danger' },
  ]}
  primaryAction={{
    label: 'Create Link',
    sublabel: 'New',
    onClick: handleCreate,
    shortcut: '⌘K',
  }}
/>
```

**Key Features**:
- ✅ Optional sections (pagination, actions, primaryAction)
- ✅ Expandable action buttons with hover animations
- ✅ 5 action variants: neutral, danger, success, warning, info
- ✅ Accessibility: ARIA labels, keyboard navigation
- ✅ Returns null if no content provided

**Types**: `ManagementBarProps`, `ManagementBarAction`, `ManagementBarPrimaryAction`, `ActionVariant`

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
- `RESEND_API_KEY` - Resend email service API key
- `UPSTASH_REDIS_REST_URL` - Upstash Redis REST URL (distributed rate limiting)
- `UPSTASH_REDIS_REST_TOKEN` - Upstash Redis REST token
- `GCS_PROJECT_ID` - Google Cloud Storage project ID
- `GCS_CLIENT_EMAIL` - GCS service account email
- `GCS_PRIVATE_KEY` - GCS service account private key (base64 encoded)
- `GCS_BRANDING_BUCKET_NAME` - Branding assets bucket name

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

**Branch**: `v2/link-module`

**Phase**: Foundation + Links Module - COMPLETE

**Recent Work**:
- ✅ Database schemas implemented in Drizzle ORM
- ✅ Migrations generated and pushed to Supabase (4 migrations total)
- ✅ Global actions & hooks layer (user management, workspace, onboarding)
- ✅ Onboarding flow with username capture and workspace creation
- ✅ Email service system complete (Phases 1-4: infrastructure, templates, actions, hooks)
- ✅ Email templates (6 total: OTP, upload notification, invitation, editor promotion, password reset, welcome)
- ✅ Email notification settings in user schema
- ✅ Redis rate limiting integration (distributed, serverless-safe)
- ✅ **Links Module COMPLETE** (7 actions, 18 tests, production-ready)
- ✅ **Permission management** (4 actions with 23 tests)
- ✅ **Branding module** (3 actions, 17 tests, GCS integration)
- ✅ GCS integration (client, upload, delete, signed URLs, branding bucket)
- ✅ Comprehensive test coverage (262 tests total, 13 suites)
- ✅ Base UI components (shadcn/ui + custom CTA buttons)
- ✅ Next.js 15 + React 19 configured
- ✅ Clerk authentication configured
- ✅ Supabase connection configured
- ✅ TypeScript compilation: 0 errors
- ✅ Tech lead approval: Production-ready

**Next Steps** (per `docs/execution/README.md`):
1. ~~Set up Google Cloud Storage bucket~~ ✅ Complete
2. ~~Build link management system~~ ✅ Complete
3. **Build file upload functionality** ⏳ Next priority

**Planning Documentation**: See `/docs/planning/` for design decisions, MVP features, and tech stack details.

## Key Files to Know

**Core Setup**:
- `src/middleware.ts` - Authentication routing logic
- `src/app/providers.tsx` - Global provider setup
- `next.config.ts` - Next.js build configuration
- `vitest.config.mts` - Test configuration

**Database Layer**:
- `src/lib/database/connection.ts` - Database connection singleton
- `src/lib/database/schemas/index.ts` - All database schemas and types
- `src/lib/database/queries/index.ts` - Reusable database queries
- `src/lib/database/queries/user.queries.ts` - User CRUD operations (7 functions)
- `src/lib/database/queries/workspace.queries.ts` - Workspace operations
- `src/lib/database/queries/permission.queries.ts` - Permission operations
- `drizzle.config.ts` - Drizzle Kit configuration

**Global Actions & Hooks**:
- `src/lib/actions/index.ts` - Global server actions
- `src/lib/actions/user.actions.ts` - User management actions
- `src/lib/actions/workspace.actions.ts` - Workspace actions
- `src/lib/actions/onboarding.actions.ts` - Onboarding flow actions
- `src/lib/actions/email.actions.ts` - Email service actions (5 actions with 32 tests)
- `src/lib/actions/link.actions.ts` - Link CRUD operations (7 actions: read, write, validation)
- `src/lib/actions/permission.actions.ts` - Permission management (4 actions: add, remove, update, get)
- `src/hooks/index.ts` - All global hooks (data + UI)
- `src/hooks/data/use-email.ts` - Email service hooks (5 hooks with toast notifications)

**Global Utilities & Infrastructure**:
- `src/lib/utils/action-helpers.ts` - Generic action HOFs (withAuth, withAuthInput, formatActionError)
- `src/lib/utils/authorization.ts` - Resource ownership verification (verifyLinkOwnership, verifyResourceOwnership)
- `src/lib/validation/base-schemas.ts` - Reusable Zod schemas (UUID, email, slug, name builders)
- `src/lib/constants/error-messages.ts` - Centralized error messages
- `src/lib/constants/validation.ts` - Validation limits and reserved values

**Email & Rate Limiting Infrastructure**:
- `src/lib/email/client.ts` - Resend client singleton with error handling
- `src/lib/email/types.ts` - Email type definitions (10 types)
- `src/lib/email/constants.ts` - Email configuration and constants
- `src/lib/redis/client.ts` - Upstash Redis client for distributed rate limiting
- `src/lib/middleware/rate-limit.ts` - Redis-backed rate limiting with presets
- `src/lib/utils/security.ts` - OTP generation and validation utilities

**GCS & File Storage**:
- `src/lib/gcs/client.ts` - GCS client singleton (upload, delete, signed URLs, file exists)

**Links Module**:
- `src/modules/links/lib/actions/branding.actions.ts` - Branding operations (3 actions: update, upload logo, delete logo)
- `src/modules/links/lib/validation/branding-schemas.ts` - Branding validation (5MB limit, PNG/JPEG/WebP)
- `src/modules/links/lib/actions/__tests__/branding.actions.test.ts` - Branding tests (17 tests)

**Documentation**:
- `docs/execution/README.md` - Implementation tracking
- `docs/execution/infrastructure/email-and-redis.md` - Email service & Redis implementation
- `docs/planning/email-service-plan.md` - Email service implementation plan
- `docs/planning/features/mvp-features.md` - MVP feature checklist

## Common Patterns

### Error Boundaries
Use `ModuleErrorBoundary` from `@/components/core/ModuleErrorBoundary` to wrap feature modules.

### Loading States
Each module has a skeleton component (e.g., `AnalyticsSkeleton`, `WorkspaceSkeleton`).

### Notifications
Use `NotificationProvider` from `@/modules/notifications/providers/NotificationProvider` (wrapped in root providers).

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
