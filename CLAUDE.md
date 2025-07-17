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

# Execute migration script
npm run migrate
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
│   ├── links/            # Multi-link system (base, custom, generated)
│   ├── upload/           # File upload processing
│   ├── files/            # File management
│   ├── workspace/        # Workspace and folder management
│   ├── dashboard/        # Analytics dashboard
│   ├── landing/          # Landing page
│   └── settings/         # User settings
├── components/           # Shared UI components
│   ├── ui/              # Base UI components
│   └── layout/          # Layout components
├── lib/                 # Global utilities
│   ├── supabase/        # Database schemas and client
│   ├── hooks/           # Global hooks
│   └── services/        # Shared services
└── types/               # Global TypeScript types
```

### Key Architectural Patterns

1. **Feature-Based Organization**: Each feature is self-contained with its own components, hooks, services, stores, and types.

2. **Server Actions + React Query**:
   - Server actions handle mutations
   - React Query manages caching and synchronization
   - Automatic cache invalidation on mutations

3. **Type-Safe Database Schema**:
   - Modular schema organization in `src/lib/supabase/schemas/`
   - Drizzle ORM for type-safe database operations
   - Row Level Security (RLS) policies for multi-tenancy

4. **State Management Hybrid**:
   - React Query for server state (data fetching, caching)
   - Zustand for UI state (modals, filters, selections)

### Database Schema

The application uses a 6-table PostgreSQL schema:

1. **users**: User accounts with Clerk integration
2. **workspaces**: User workspaces for file organization
3. **links**: Multi-link types (base/custom/generated) for file collection
4. **folders**: Hierarchical folder structure
5. **batches**: Upload batch tracking
6. **files**: File metadata and storage paths

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

The project is in **Phase 2: Service Layer Integration** with the database foundation complete. Current focus:

1. Fix database service imports and type alignments
2. Update links feature to use database-first types
3. Create UI adapter functions for type conversion
4. Complete multi-link service layer implementation

## Important Notes

- Always check for existing patterns in nearby files before implementing new features
- Follow the feature-based architecture when adding new domains
- Use React Query for all data fetching operations
- Implement proper error handling with Result patterns
- Maintain type safety throughout the stack
- Test new features with appropriate unit and integration tests
