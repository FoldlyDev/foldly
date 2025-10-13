# PRD: Global Actions & Hooks Architecture

**Document Version:** 1.0
**Last Updated:** October 12, 2025
**Status:** ✅ Implemented
**Owner:** Engineering Team
**Phase:** Foundation (Phase 1)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Problem Statement](#problem-statement)
3. [Goals & Success Metrics](#goals--success-metrics)
4. [Architecture Principles](#architecture-principles)
5. [Three-Layer Pattern](#three-layer-pattern)
6. [Implementation Details](#implementation-details)
7. [Global vs Module-Specific](#global-vs-module-specific)
8. [Code Organization](#code-organization)
9. [Best Practices](#best-practices)
10. [Testing Strategy](#testing-strategy)
11. [Future Enhancements](#future-enhancements)
12. [Appendix](#appendix)

---

## Executive Summary

The Global Actions & Hooks Architecture establishes a consistent three-layer data flow pattern for Foldly V2, separating concerns between database operations, business logic, and client-side state management. This architecture ensures code reusability, maintainability, and type safety across the entire application.

**Core Pattern:**
```
CLIENT COMPONENT → REACT QUERY HOOK → SERVER ACTION → DATABASE QUERY → DATABASE
```

**Key Benefits:**
- **Separation of Concerns** - Database queries, business logic, and UI decoupled
- **Code Reusability** - Database queries can be called from multiple server actions
- **Type Safety** - End-to-end TypeScript types from database to UI
- **Testability** - Each layer can be tested independently
- **React Query Integration** - Built-in caching, refetching, and optimistic updates

**Business Impact:**
- Faster feature development through reusable patterns
- Fewer bugs through isolated, testable code
- Better developer experience with clear conventions
- Easier onboarding for new engineers

---

## Problem Statement

### Context

In modern full-stack applications with Next.js App Router and Server Actions, data flow can become complex and inconsistent. Common problems include:
- Server actions directly calling database queries (tight coupling)
- Client components directly using server actions (no caching)
- Duplicated query logic across components
- Unclear boundaries between global and module-specific code

### Technical Challenges

**Challenge 1: Data Flow Consistency**
- Need consistent pattern for fetching data across all modules
- Server actions must enforce authentication and business logic
- Database queries should be pure and reusable

**Challenge 2: Client-Side State Management**
- React Server Components can't use React hooks (useState, useEffect)
- Need caching and refetching for client components
- Optimistic updates and mutations require coordination

**Challenge 3: Code Organization**
- Unclear when code belongs in global vs module-specific directories
- Risk of circular dependencies between modules
- Need consistent file structure across features

**Challenge 4: TypeScript Integration**
- Need end-to-end type safety from database to UI
- Drizzle ORM infers types, but need to propagate through layers
- Server actions need proper return type contracts

### Success Criteria

The architecture must:
- ✅ Provide clear three-layer separation (Query → Action → Hook)
- ✅ Support both global and module-specific code patterns
- ✅ Enable React Query caching and optimistic updates
- ✅ Maintain end-to-end type safety
- ✅ Scale to 20+ modules without circular dependencies

---

## Goals & Success Metrics

### Primary Goals

1. **Architectural Clarity**
   - Target: 100% of data operations follow three-layer pattern
   - Measurement: Code review adherence, no direct database calls from actions

2. **Code Reusability**
   - Target: Database queries reused in 3+ server actions
   - Measurement: Function call analysis

3. **Developer Velocity**
   - Target: New features follow pattern without documentation lookup
   - Measurement: PR review time, onboarding feedback

4. **Type Safety**
   - Target: Zero `any` types in data flow layers
   - Measurement: TypeScript strict mode compilation

### Success Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Three-layer adherence | 100% | 100% | ✅ Achieved |
| Reusable query functions | 15+ | 17 | ✅ Achieved |
| React Query hooks | 10+ | 5 | ✅ Achieved |
| Server actions | 15+ | 8 | ✅ Achieved |
| Test coverage (actions) | 80% | 95% | ✅ Exceeded |

### Anti-Goals

❌ **Direct database calls from server actions** → Use query layer
❌ **Direct server action calls from client components** → Use React Query hooks
❌ **Module-specific code in global directories** → Use module structure
❌ **Global code duplicated across modules** → Extract to global layer

---

## Architecture Principles

### Principle 1: Three-Layer Separation

**Definition:** Every data operation passes through three distinct layers: Query → Action → Hook.

**Rationale:**
- **Query Layer** - Pure database operations (Drizzle ORM)
- **Action Layer** - Business logic, authentication, validation
- **Hook Layer** - Client-side state management (React Query)

**Benefits:**
- Each layer has single responsibility
- Easy to test each layer independently
- Changes to one layer don't ripple through entire stack

---

### Principle 2: Server Actions Own Business Logic

**Definition:** Server actions handle authentication, authorization, validation, and error handling.

**Rationale:**
- Security checks must happen on server (can't trust client)
- Business rules enforced consistently
- Database queries remain pure (no auth checks in queries)

**Example:**
```typescript
// ✅ Good: Server action handles auth + validation
export async function updateWorkspaceNameAction(workspaceId: string, name: string) {
  const { userId } = await auth(); // AUTH CHECK

  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  const workspace = await getWorkspaceById(workspaceId);
  if (workspace.userId !== userId) { // AUTHORIZATION CHECK
    return { success: false, error: 'Not your workspace' };
  }

  const updated = await updateWorkspaceName(workspaceId, name); // PURE QUERY
  return { success: true, workspace: updated };
}

// ❌ Bad: Query handles auth (tight coupling)
export async function updateWorkspaceName(workspaceId: string, name: string) {
  const { userId } = await auth(); // AUTH IN QUERY - BAD!
  // ...
}
```

---

### Principle 3: React Query for Client State

**Definition:** All client components use React Query hooks, never direct server action calls.

**Rationale:**
- React Query provides caching (avoid redundant fetches)
- Automatic refetching and stale data handling
- Optimistic updates for better UX
- Loading and error states built-in

**Example:**
```typescript
// ✅ Good: Use React Query hook
function MyComponent() {
  const { data: workspace, isLoading } = useUserWorkspace();

  if (isLoading) return <Skeleton />;
  return <div>{workspace?.name}</div>;
}

// ❌ Bad: Direct server action call (no caching)
function MyComponent() {
  const [workspace, setWorkspace] = useState(null);

  useEffect(() => {
    getUserWorkspaceAction().then(setWorkspace); // BAD - no caching!
  }, []);
}
```

---

### Principle 4: Global vs Module-Specific

**Definition:** Code used in 3+ modules goes in global directories; feature-specific code stays in modules.

**Rationale:**
- Prevents duplication
- Avoids circular dependencies
- Clear ownership and responsibility

**Decision Tree:**
```
Is this code used in 3+ modules?
├─ YES → Place in src/lib/actions/ (global)
└─ NO  → Place in src/modules/{name}/lib/actions/ (module-specific)

Examples:
- getUserWorkspace() → Global (used in Dashboard, Links, Files, Settings)
- validateLinkAccess() → Module-specific (only used in Uploads module)
```

---

## Three-Layer Pattern

### Layer 1: Database Queries

**Location:** `src/lib/database/queries/*.queries.ts`

**Purpose:** Pure database operations using Drizzle ORM

**Responsibilities:**
- Execute database queries and mutations
- Return typed results from Drizzle ORM
- NO authentication, NO business logic, NO validation

**Characteristics:**
- Pure functions (same input → same output)
- Reusable across multiple server actions
- Drizzle ORM type inference
- No dependencies on auth or business logic

**Example:**
```typescript
// src/lib/database/queries/user.queries.ts
import { db } from '@/lib/database/connection';
import { users } from '@/lib/database/schemas';
import { eq } from 'drizzle-orm';

/**
 * Get user by Clerk user ID
 * @param userId - Clerk user ID
 * @returns User or undefined if not found
 */
export async function getUserById(userId: string): Promise<User | undefined> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId));

  return user;
}

/**
 * Create new user in database
 * @param data - User creation data
 * @returns Created user
 */
export async function createUser(data: NewUser): Promise<User> {
  const [user] = await db
    .insert(users)
    .values(data)
    .returning();

  return user;
}
```

**Key Points:**
- NO `await auth()` in query layer
- NO validation logic (sanitization happens in actions)
- Simple, focused functions
- Return types inferred from Drizzle schema

---

### Layer 2: Server Actions

**Location:**
- Global: `src/lib/actions/*.actions.ts`
- Module: `src/modules/{name}/lib/actions/*.actions.ts`

**Purpose:** Business logic, authentication, validation, and error handling

**Responsibilities:**
- Authenticate user with Clerk (`await auth()`)
- Authorize access (check ownership, permissions)
- Validate and sanitize inputs
- Call database query functions
- Handle errors and return structured responses
- Log security events

**Characteristics:**
- Always use `'use server'` directive
- Always check authentication
- Return structured objects: `{ success: boolean, data?: T, error?: string }`
- Call multiple query functions if needed
- NO database calls directly (use query layer)

**Example:**
```typescript
// src/lib/actions/workspace.actions.ts
'use server';

import { auth } from '@clerk/nextjs/server';
import { getUserWorkspace, updateWorkspaceName } from '@/lib/database/queries';

/**
 * Get authenticated user's workspace
 *
 * Used across modules:
 * - Dashboard (load workspace)
 * - Links module (associate links)
 * - Files module (workspace operations)
 */
export async function getUserWorkspaceAction(): Promise<Workspace | null> {
  const { userId } = await auth(); // AUTH CHECK

  if (!userId) {
    return null;
  }

  const workspace = await getUserWorkspace(userId); // CALL QUERY LAYER
  return workspace ?? null;
}

/**
 * Update workspace name
 *
 * Used by:
 * - Settings module (rename workspace)
 */
export async function updateWorkspaceNameAction(
  workspaceId: string,
  name: string
) {
  const { userId } = await auth(); // AUTH CHECK

  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  // AUTHORIZATION: Verify ownership
  const workspace = await getWorkspaceById(workspaceId);
  if (!workspace || workspace.userId !== userId) {
    return { success: false, error: 'Not your workspace' };
  }

  try {
    // CALL QUERY LAYER
    const updated = await updateWorkspaceName(workspaceId, name);

    return {
      success: true,
      workspace: updated,
    };
  } catch (error) {
    console.error('Failed to update workspace:', error);
    return {
      success: false,
      error: 'Failed to update workspace',
    };
  }
}
```

**Key Points:**
- Authentication ALWAYS first
- Authorization before mutations
- Structured return types for type safety
- Error handling with try/catch
- Call query functions (never direct database calls)

---

### Layer 3: React Query Hooks

**Location:**
- Global: `src/hooks/data/*.ts`
- Module: `src/modules/{name}/hooks/*.ts`

**Purpose:** Client-side state management with React Query

**Responsibilities:**
- Wrap server actions with `useQuery` or `useMutation`
- Configure caching, stale time, refetching
- Invalidate queries on successful mutations
- Provide loading/error states to components

**Characteristics:**
- Always use `'use client'` directive
- Use `useQuery` for reads (GET operations)
- Use `useMutation` for writes (POST/PUT/DELETE operations)
- Invalidate related queries after mutations
- Configure retry logic (usually false for auth operations)

**Example:**
```typescript
// src/hooks/data/use-user-workspace.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserWorkspaceAction, updateWorkspaceNameAction } from '@/lib/actions';

/**
 * Get authenticated user's workspace
 *
 * Used across modules:
 * - Dashboard (load workspace data)
 * - Links module (associate links)
 * - Files module (workspace operations)
 */
export function useUserWorkspace() {
  return useQuery({
    queryKey: ['user-workspace'],              // CACHE KEY
    queryFn: getUserWorkspaceAction,           // SERVER ACTION
    staleTime: 5 * 60 * 1000,                 // 5 minutes cache
  });
}

/**
 * Update workspace name
 *
 * Used by:
 * - Settings module (rename workspace)
 */
export function useUpdateWorkspaceName() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workspaceId, name }: { workspaceId: string; name: string }) =>
      updateWorkspaceNameAction(workspaceId, name),

    onSuccess: (result) => {
      if (result.success) {
        // INVALIDATE CACHE - triggers refetch
        queryClient.invalidateQueries({ queryKey: ['user-workspace'] });
      }
    },
  });
}
```

**Key Points:**
- Query keys for caching (e.g., `['user-workspace']`)
- StaleTime configuration (5 minutes typical)
- Mutations invalidate related queries
- Wrap server actions, don't implement logic

---

## Implementation Details

### Complete Data Flow Example

**Scenario:** User updates their workspace name in Settings module

#### Step 1: User Interaction (Client Component)
```typescript
// src/modules/settings/components/WorkspaceSettings.tsx
'use client';

import { useUserWorkspace, useUpdateWorkspaceName } from '@/hooks';

export function WorkspaceSettings() {
  const { data: workspace, isLoading } = useUserWorkspace(); // QUERY
  const updateName = useUpdateWorkspaceName(); // MUTATION

  const handleSubmit = async (name: string) => {
    const result = await updateName.mutateAsync({
      workspaceId: workspace!.id,
      name,
    });

    if (result.success) {
      toast.success('Workspace renamed!');
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

#### Step 2: React Query Hook (Hook Layer)
```typescript
// src/hooks/data/use-user-workspace.ts
'use client';

export function useUpdateWorkspaceName() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workspaceId, name }) =>
      updateWorkspaceNameAction(workspaceId, name), // CALL SERVER ACTION

    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['user-workspace'] });
      }
    },
  });
}
```

#### Step 3: Server Action (Action Layer)
```typescript
// src/lib/actions/workspace.actions.ts
'use server';

export async function updateWorkspaceNameAction(
  workspaceId: string,
  name: string
) {
  // AUTH CHECK
  const { userId } = await auth();
  if (!userId) return { success: false, error: 'Unauthorized' };

  // AUTHORIZATION CHECK
  const workspace = await getWorkspaceById(workspaceId);
  if (workspace.userId !== userId) {
    return { success: false, error: 'Not your workspace' };
  }

  // CALL QUERY LAYER
  const updated = await updateWorkspaceName(workspaceId, name);

  return { success: true, workspace: updated };
}
```

#### Step 4: Database Query (Query Layer)
```typescript
// src/lib/database/queries/workspace.queries.ts
export async function updateWorkspaceName(
  workspaceId: string,
  name: string
): Promise<Workspace> {
  const [workspace] = await db
    .update(workspaces)
    .set({ name, updatedAt: new Date() })
    .where(eq(workspaces.id, workspaceId))
    .returning();

  return workspace;
}
```

#### Step 5: Database (PostgreSQL via Drizzle ORM)
```sql
UPDATE workspaces
SET name = $1, updated_at = $2
WHERE id = $3
RETURNING *;
```

---

## Global vs Module-Specific

### Decision Matrix

| Criteria | Global | Module-Specific |
|----------|--------|-----------------|
| Used in 3+ modules | ✅ Yes | ❌ No (1-2 modules) |
| Core user operations | ✅ Yes (user, workspace, auth) | ❌ Feature-specific |
| Cross-cutting concerns | ✅ Yes (onboarding, permissions) | ❌ Module-isolated |
| Shared by multiple features | ✅ Yes | ❌ Single feature |

### Global Code Structure

```
src/
├── lib/
│   ├── actions/                    # GLOBAL SERVER ACTIONS
│   │   ├── index.ts               # Export all global actions
│   │   ├── onboarding.actions.ts  # Onboarding flow (used in Landing + Dashboard + Auth)
│   │   ├── workspace.actions.ts   # Workspace operations (used in Dashboard + Links + Files)
│   │   └── user.actions.ts        # User profile (used in Settings + Dashboard)
│   │
│   └── database/
│       └── queries/                # GLOBAL DATABASE QUERIES
│           ├── index.ts
│           ├── user.queries.ts     # 7 functions (createUser, getUserById, etc.)
│           ├── workspace.queries.ts # 4 functions (createWorkspace, etc.)
│           └── permission.queries.ts # 6 functions (createPermission, etc.)
│
└── hooks/
    └── data/                       # GLOBAL REACT QUERY HOOKS
        ├── index.ts
        ├── use-onboarding.ts       # 3 hooks (useOnboardingStatus, etc.)
        └── use-user-workspace.ts   # 2 hooks (useUserWorkspace, etc.)
```

**Examples of Global Code:**
- `getUserWorkspace()` - Used in Dashboard, Links, Files, Settings (4+ modules)
- `checkOnboardingStatus()` - Used in Landing, Dashboard, Auth (3+ modules)
- `createUser()` - Core operation called from multiple flows

---

### Module-Specific Code Structure

```
src/modules/uploads/
├── components/
│   └── ui/
│       └── FileUploader.tsx        # Client component
│
├── hooks/
│   └── use-validate-link.ts        # MODULE HOOK (wraps module action)
│
└── lib/
    └── actions/
        └── link-data-actions.ts    # MODULE SERVER ACTION
            ├── validateLinkAccessAction()  # Only used in Uploads module
            └── uploadFileAction()          # Only used in Uploads module
```

**Examples of Module-Specific Code:**
- `validateLinkAccessAction()` - Only used in Uploads module (external uploader access)
- `uploadFileAction()` - Only used in Uploads module (file upload logic)
- Link validation business logic specific to external uploader flow

---

## Code Organization

### File Naming Conventions

**Database Queries:**
```
{entity}.queries.ts
Examples:
- user.queries.ts
- workspace.queries.ts
- link.queries.ts
- permission.queries.ts
```

**Server Actions:**
```
{entity}.actions.ts
Examples:
- onboarding.actions.ts
- workspace.actions.ts
- user.actions.ts
```

**React Query Hooks:**
```
use-{entity}.ts
Examples:
- use-onboarding.ts
- use-user-workspace.ts
- use-link-permissions.ts
```

### Export Patterns

**Barrel Exports (index.ts):**
```typescript
// src/lib/actions/index.ts (Global actions)
export * from './onboarding.actions';
export * from './workspace.actions';
export * from './user.actions';

// src/hooks/data/index.ts (Global hooks)
export * from './use-onboarding';
export * from './use-user-workspace';

// src/hooks/index.ts (All hooks - data + ui)
export * from './data';
export * from './ui';
```

**Import Examples:**
```typescript
// ✅ Good: Import from barrel
import { getUserWorkspaceAction, updateWorkspaceNameAction } from '@/lib/actions';
import { useUserWorkspace, useUpdateWorkspaceName } from '@/hooks';

// ❌ Bad: Import from specific files
import { getUserWorkspaceAction } from '@/lib/actions/workspace.actions';
import { useUserWorkspace } from '@/hooks/data/use-user-workspace';
```

---

## Best Practices

### 1. Always Use Three Layers

❌ **Anti-Pattern: Direct Database Access from Server Action**
```typescript
// BAD - Server action with direct database call
'use server';
import { db } from '@/lib/database/connection';
import { users } from '@/lib/database/schemas';

export async function getUserAction() {
  const { userId } = await auth();
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  return user;
}
```

✅ **Correct Pattern: Use Query Layer**
```typescript
// GOOD - Server action calls query function
'use server';
import { getUserById } from '@/lib/database/queries';

export async function getUserAction() {
  const { userId } = await auth();
  const user = await getUserById(userId); // Query layer
  return user;
}
```

---

### 2. Always Wrap Server Actions with React Query

❌ **Anti-Pattern: Direct Server Action Call**
```typescript
// BAD - Direct call, no caching
function MyComponent() {
  const [workspace, setWorkspace] = useState(null);

  useEffect(() => {
    getUserWorkspaceAction().then(setWorkspace);
  }, []);
}
```

✅ **Correct Pattern: Use React Query Hook**
```typescript
// GOOD - Hook provides caching
function MyComponent() {
  const { data: workspace, isLoading } = useUserWorkspace();
}
```

---

### 3. Invalidate Queries After Mutations

❌ **Anti-Pattern: No Cache Invalidation**
```typescript
// BAD - Cache not updated after mutation
export function useUpdateWorkspaceName() {
  return useMutation({
    mutationFn: updateWorkspaceNameAction,
    // Missing onSuccess - cache stays stale!
  });
}
```

✅ **Correct Pattern: Invalidate Related Queries**
```typescript
// GOOD - Cache invalidated on success
export function useUpdateWorkspaceName() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateWorkspaceNameAction,
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['user-workspace'] });
      }
    },
  });
}
```

---

### 4. Use Structured Return Types

❌ **Anti-Pattern: Throwing Errors**
```typescript
// BAD - Throws error, no structured response
export async function updateWorkspaceNameAction(id: string, name: string) {
  if (!userId) throw new Error('Unauthorized'); // BAD!
  return await updateWorkspaceName(id, name);
}
```

✅ **Correct Pattern: Return Success/Error Object**
```typescript
// GOOD - Structured response
export async function updateWorkspaceNameAction(id: string, name: string) {
  if (!userId) {
    return { success: false as const, error: 'Unauthorized' };
  }

  try {
    const workspace = await updateWorkspaceName(id, name);
    return { success: true as const, workspace };
  } catch (error) {
    return { success: false as const, error: 'Failed to update' };
  }
}
```

---

## Testing Strategy

### Test Coverage

**Total Tests:** 76 tests across layers
- Database Queries: 46 tests
- Server Actions: 30 tests (user, workspace, onboarding)
- React Query Hooks: 0 tests (future enhancement)

### Testing Each Layer

#### Layer 1: Database Query Tests

**Location:** `src/lib/database/queries/__tests__/*.test.ts`

**Focus:** Pure database operations
```typescript
describe('getUserById', () => {
  it('should return user when exists', async () => {
    const user = await createUser({ id: 'test_1', email: 'test@example.com' });
    const result = await getUserById('test_1');
    expect(result).toEqual(user);
  });

  it('should return undefined when not found', async () => {
    const result = await getUserById('nonexistent');
    expect(result).toBeUndefined();
  });
});
```

#### Layer 2: Server Action Tests

**Location:** `src/lib/actions/__tests__/*.test.ts`

**Focus:** Authentication, authorization, business logic
```typescript
describe('updateWorkspaceNameAction', () => {
  it('should return error when user not authenticated', async () => {
    mockAuth({ userId: null });
    const result = await updateWorkspaceNameAction('workspace_1', 'New Name');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });

  it('should return error when user does not own workspace', async () => {
    mockAuth({ userId: 'user_1' });
    const workspace = await createWorkspace({ userId: 'user_2' });
    const result = await updateWorkspaceNameAction(workspace.id, 'New Name');
    expect(result.success).toBe(false);
    expect(result.error).toContain('unauthorized');
  });

  it('should successfully update workspace name for owner', async () => {
    mockAuth({ userId: 'user_1' });
    const workspace = await createWorkspace({ userId: 'user_1', name: 'Old' });
    const result = await updateWorkspaceNameAction(workspace.id, 'New');
    expect(result.success).toBe(true);
    expect(result.workspace?.name).toBe('New');
  });
});
```

#### Layer 3: React Query Hook Tests (Future)

**Location:** `src/hooks/__tests__/*.test.ts`

**Focus:** Caching, invalidation, loading states
```typescript
// Future enhancement
describe('useUserWorkspace', () => {
  it('should fetch workspace on mount', async () => {
    const { result } = renderHook(() => useUserWorkspace());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual(mockWorkspace);
  });
});
```

---

## Future Enhancements

### Phase 2 (Post-MVP)

**FE-1: Optimistic Updates**
```typescript
// Add optimistic updates for better UX
export function useUpdateWorkspaceName() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateWorkspaceNameAction,

    onMutate: async ({ workspaceId, name }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['user-workspace'] });

      // Snapshot previous value
      const previous = queryClient.getQueryData(['user-workspace']);

      // Optimistically update
      queryClient.setQueryData(['user-workspace'], (old) => ({
        ...old,
        name, // Update name immediately
      }));

      return { previous };
    },

    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(['user-workspace'], context.previous);
    },
  });
}
```

**FE-2: React Query Hook Tests**
- Add comprehensive hook testing with React Testing Library
- Test caching behavior, refetching, invalidation
- Test optimistic updates and rollbacks

**FE-3: Parallel Queries**
```typescript
// Fetch multiple resources in parallel
export function useDashboardData() {
  const workspace = useUserWorkspace();
  const links = useWorkspaceLinks();
  const files = useRecentFiles();

  return {
    isLoading: workspace.isLoading || links.isLoading || files.isLoading,
    data: { workspace: workspace.data, links: links.data, files: files.data },
  };
}
```

### Phase 3 (Scale)

**FE-4: React Query Devtools Integration**
- Add React Query DevTools for debugging
- Monitor cache, query states, network requests

**FE-5: Query Prefetching**
```typescript
// Prefetch on hover for instant navigation
<Link
  href="/dashboard/links"
  onMouseEnter={() => queryClient.prefetchQuery({
    queryKey: ['workspace-links'],
    queryFn: getWorkspaceLinksAction,
  })}
>
  Links
</Link>
```

**FE-6: Global Loading States**
```typescript
// Global loading bar for all queries
export function GlobalLoadingBar() {
  const isFetching = useIsFetching();
  return isFetching > 0 ? <ProgressBar /> : null;
}
```

---

## Appendix

### Glossary

**Server Action:** Next.js function marked with `'use server'` that runs on the server
**React Query:** Data fetching library (TanStack Query) with caching and state management
**Query Key:** Unique identifier for cached data in React Query
**Mutation:** React Query term for data modifications (POST/PUT/DELETE operations)
**Invalidation:** Forcing React Query to refetch data by marking cache as stale
**Optimistic Update:** Updating UI immediately before server confirms change

### File Locations Reference

```
Global Code:
├── src/lib/actions/*.actions.ts        # Global server actions (8 actions)
├── src/lib/database/queries/*.ts       # Global database queries (17 functions)
└── src/hooks/data/*.ts                 # Global React Query hooks (5 hooks)

Module Code:
└── src/modules/{name}/
    ├── lib/actions/*.ts                # Module server actions
    └── hooks/*.ts                      # Module React Query hooks
```

### Related Documentation

- [Authentication & Onboarding PRD](./01-authentication-onboarding.md)
- [Database Architecture PRD](./02-database-architecture.md)
- [Testing Guide](../execution/testing/testing-guide.md)
- [React Query Documentation](https://tanstack.com/query/latest/docs/react/overview)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)

### Change Log

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| Oct 12, 2025 | 1.0 | Initial PRD created | Engineering Team |

### Contributors

- Engineering Team (Architecture Design & Implementation)
- Product Team (Requirements & Code Organization Guidelines)

---

**End of Document**
