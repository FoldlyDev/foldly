# Testing Guide

Last Updated: October 12, 2025

This document covers testing strategy and implementation patterns for Foldly V2.

---

## Testing Philosophy

**Test what matters, not everything.**

Focus on:
- Database operations (queries/mutations)
- Server actions (authentication + business logic)
- Security utilities (slugs, sanitization)
- Module-specific critical paths

Skip:
- Trivial UI components without logic
- Third-party library wrappers
- Simple type definitions

---

## Quick Start

### Running Tests

```bash
npm run test          # Watch mode (development)
npm run test:ui       # Vitest UI (visual test runner)
npm run test:run      # Single run (CI mode)
```

### Current Coverage

| Test Suite | Tests | Location |
|------------|-------|----------|
| Database Queries (User) | 28 tests | `src/lib/database/queries/__tests__/user.queries.test.ts` |
| Database Queries (Workspace) | 6 tests | `src/lib/database/queries/__tests__/workspace.queries.test.ts` |
| Database Queries (Permission) | 18 tests | `src/lib/database/queries/__tests__/permission.queries.test.ts` |
| Server Actions (User) | 21 tests | `src/lib/actions/__tests__/user.actions.test.ts` |
| Server Actions (Onboarding) | 27 tests | `src/lib/actions/__tests__/onboarding.actions.test.ts` |
| Server Actions (Workspace) | 15 tests | `src/lib/actions/__tests__/workspace.actions.test.ts` |
| Security Utilities | 22 tests | `src/lib/utils/__tests__/security.test.ts` |
| Module Actions (Uploads) | 8 tests | `src/modules/uploads/lib/actions/__tests__/link-data-actions.test.ts` |
| **Total** | **139 tests** | 8 test suites |

---

## Test Directory Structure

Tests live next to the code they test in `__tests__/` folders:

```
src/
├── lib/
│   ├── database/
│   │   └── queries/
│   │       ├── __tests__/              # Database query tests
│   │       │   ├── user.queries.test.ts
│   │       │   ├── workspace.queries.test.ts
│   │       │   └── permission.queries.test.ts
│   │       ├── user.queries.ts
│   │       ├── workspace.queries.ts
│   │       └── permission.queries.ts
│   ├── actions/
│   │   ├── __tests__/                  # Global server action tests
│   │   │   ├── user.actions.test.ts
│   │   │   ├── onboarding.actions.test.ts
│   │   │   └── workspace.actions.test.ts
│   │   ├── user.actions.ts
│   │   ├── onboarding.actions.ts
│   │   └── workspace.actions.ts
│   └── utils/
│       └── __tests__/                  # Utility function tests
│           └── security.test.ts
│
├── modules/
│   └── {module-name}/
│       └── lib/
│           └── actions/
│               ├── __tests__/          # Module-specific action tests
│               │   └── link-data-actions.test.ts
│               └── link-data-actions.ts
│
└── test/                               # Shared test utilities
    ├── db-test-utils.ts                # Database helpers
    └── auth-test-utils.ts              # Auth mocking helpers
```

---

## Writing Tests

### Pattern 1: Database Query Tests

**Example**: `src/lib/database/queries/__tests__/workspace.queries.test.ts`

```typescript
import { describe, it, expect, afterEach } from 'vitest';
import { getUserWorkspace, createWorkspace } from '../workspace.queries';
import { createTestUser, cleanupTestUser } from '@/test/db-test-utils';

describe('Workspace Queries', () => {
  let testUserId: string;

  afterEach(async () => {
    // Always clean up test data
    if (testUserId) {
      await cleanupTestUser(testUserId);
    }
  });

  it('should return workspace when user has one', async () => {
    // Arrange: Create test data
    const user = await createTestUser();
    testUserId = user.id;
    const workspace = await createWorkspace({ userId: testUserId, name: 'Test' });

    // Act: Run query
    const result = await getUserWorkspace(testUserId);

    // Assert: Verify result
    expect(result).toBeDefined();
    expect(result?.id).toBe(workspace.id);
  });
});
```

**Key Points**:
- Use shared utilities from `@/test/db-test-utils`
- Always clean up test data in `afterEach`
- Follow Arrange-Act-Assert pattern
- Use real database (no mocks)

### Pattern 2: Server Action Tests

**Example**: `src/lib/actions/__tests__/workspace.actions.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createUserWorkspaceAction } from '../workspace.actions';
import { createTestUser, cleanupTestUser } from '@/test/db-test-utils';
import { setupClerkMocks } from '@/test/auth-test-utils';

// Mock Clerk module
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

describe('Workspace Actions', () => {
  let testUserId: string;

  beforeEach(() => {
    // Set up Clerk mocks
    const { auth } = setupClerkMocks({
      authenticated: true,
      userId: 'test_user_123'
    });
    vi.mocked(require('@clerk/nextjs/server').auth).mockImplementation(auth);
  });

  afterEach(async () => {
    if (testUserId) {
      await cleanupTestUser(testUserId);
    }
    vi.clearAllMocks();
  });

  it('should create workspace for authenticated user', async () => {
    // Arrange: Create test user
    const user = await createTestUser('test_user_123');
    testUserId = user.id;

    // Act: Call server action
    const result = await createUserWorkspaceAction('My Workspace');

    // Assert: Verify success
    expect(result.success).toBe(true);
    expect(result.data?.name).toBe('My Workspace');
  });
});
```

**Key Points**:
- Mock Clerk with `setupClerkMocks()` from `@/test/auth-test-utils`
- Reset mocks in `beforeEach` and `afterEach`
- Test both success and error cases
- Use real database for data operations

### Pattern 3: Utility Function Tests

**Example**: `src/lib/utils/__tests__/security.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { generateSlug, sanitizeEmail } from '../security';

describe('Security Utilities', () => {
  describe('generateSlug', () => {
    it('should generate URL-safe slug', () => {
      const slug = generateSlug();
      expect(slug).toMatch(/^[a-z0-9-]+$/);
    });

    it('should generate unique slugs', () => {
      const slug1 = generateSlug();
      const slug2 = generateSlug();
      expect(slug1).not.toBe(slug2);
    });
  });
});
```

**Key Points**:
- Pure function tests (no database or mocking)
- Test edge cases and validation
- Keep tests simple and focused

---

## Shared Test Utilities

### Database Utilities (`@/test/db-test-utils`)

```typescript
import {
  createTestUser,        // Create test user in DB
  createTestWorkspace,   // Create test workspace
  createTestLink,        // Create test link
  cleanupTestUser,       // Delete user + cascading data
  cleanupTestWorkspace,  // Delete workspace + cascading data
  cleanupTestLink,       // Delete link
  testData,              // Generators (generateUserId, etc.)
} from '@/test/db-test-utils';
```

**Usage**:
- Always use `createTestUser()` to satisfy foreign key constraints
- Always clean up in `afterEach` to prevent test pollution
- Use `testData.generate*()` for unique IDs

### Auth Utilities (`@/test/auth-test-utils`)

```typescript
import {
  setupClerkMocks,              // Complete mock setup
  mockAuthenticatedClerkAuth,   // Mock authenticated user
  mockUnauthenticatedClerkAuth, // Mock unauthenticated
} from '@/test/auth-test-utils';
```

**Usage**:
```typescript
// Set up authenticated Clerk session
const { auth } = setupClerkMocks({
  authenticated: true,
  userId: 'user_123'
});
vi.mocked(require('@clerk/nextjs/server').auth).mockImplementation(auth);

// Or for unauthenticated tests
const { auth } = setupClerkMocks({ authenticated: false });
```

---

## Testing Best Practices

### 1. Isolation
Use the `createdUserIds` Set pattern to track and clean up all test data:
```typescript
describe('My Tests', () => {
  const createdUserIds = new Set<string>();

  beforeEach(() => {
    vi.clearAllMocks();
    createdUserIds.clear();
  });

  afterEach(async () => {
    const cleanupPromises = Array.from(createdUserIds).map(id => cleanupTestUser(id));
    await Promise.all(cleanupPromises);
    createdUserIds.clear();
  });

  it('should do something', async () => {
    const user = await createTestUser();
    createdUserIds.add(user.id);  // Track for cleanup
    // Test logic...
  });
});
```
This pattern prevents test pollution and ensures all test data is properly cleaned up.

### 2. Real Database Operations
- Use Supabase test database (not mocks)
- Tests verify actual database behavior
- Catches constraint violations and edge cases

### 3. Arrange-Act-Assert Pattern
```typescript
it('should do something', async () => {
  // Arrange: Set up test data
  const user = await createTestUser();

  // Act: Perform action
  const result = await someAction(user.id);

  // Assert: Verify outcome
  expect(result).toBeDefined();
});
```

### 4. Descriptive Test Names
- Use `should` language: "should return error when user not found"
- Be specific: "should generate unique slugs" not "test slug generation"
- Describe behavior, not implementation

### 5. Test Error Cases
Always test:
- Success paths (happy path)
- Authentication failures
- Not found scenarios
- Validation errors
- Constraint violations

---

## Configuration

### Vitest Config (`vitest.config.mts`)
```typescript
export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',          // For React component tests
    globals: true,                  // Global test APIs
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.{test,spec}.{ts,tsx}'],
    fileParallelism: false,         // Prevents cross-file test pollution
  },
});
```
**Note**: `fileParallelism: false` runs test files sequentially to prevent database operations from interfering across files while still allowing parallel execution within each file.

### Setup File (`vitest.setup.ts`)
- Imports `@testing-library/jest-dom` matchers
- Configures environment (runs before tests)

---

## Adding Tests to New Modules

When creating a new module with server actions:

1. **Create `__tests__/` folder** next to your actions:
   ```
   src/modules/my-module/
   └── lib/
       └── actions/
           ├── __tests__/
           │   └── my-actions.test.ts
           └── my-actions.ts
   ```

2. **Import shared utilities**:
   ```typescript
   import { createTestUser, cleanupTestUser } from '@/test/db-test-utils';
   import { setupClerkMocks } from '@/test/auth-test-utils';
   ```

3. **Follow established patterns** from existing tests

4. **Test critical paths**:
   - Authentication checks
   - Authorization (user owns resource)
   - Database operations
   - Error handling

---

## CI/CD Integration

Tests run automatically via:
```bash
npm run test:run  # Single run, exits with code
```

Integrate with GitHub Actions:
```yaml
- name: Run tests
  run: npm run test:run
```

---

## Common Patterns Reference

### Testing Authenticated Actions
```typescript
vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }));

beforeEach(() => {
  const { auth } = setupClerkMocks({ authenticated: true, userId: 'user_123' });
  vi.mocked(require('@clerk/nextjs/server').auth).mockImplementation(auth);
});
```

### Testing Authorization
```typescript
it('should return error when user does not own resource', async () => {
  // Create owner and non-owner
  const owner = await createTestUser('owner_123');
  const nonOwner = await createTestUser('user_456');

  // Create resource owned by owner
  const workspace = await createWorkspace({ userId: owner.id });

  // Mock auth as non-owner
  const { auth } = setupClerkMocks({ userId: 'user_456' });
  vi.mocked(require('@clerk/nextjs/server').auth).mockImplementation(auth);

  // Attempt to access owner's resource
  const result = await updateWorkspaceAction(workspace.id, 'New Name');

  expect(result.success).toBe(false);
  expect(result.error).toContain('not authorized');
});
```

### Testing Database Constraints
```typescript
it('should throw error when violating unique constraint', async () => {
  const user = await createTestUser();
  await createWorkspace({ userId: user.id, name: 'First' });

  // Attempt duplicate workspace (violates unique userId constraint)
  await expect(
    createWorkspace({ userId: user.id, name: 'Second' })
  ).rejects.toThrow();
});
```

---

## Troubleshooting

### Tests Fail with "Database connection error"
- Verify `.env.local` has correct `DATABASE_URL`
- Ensure Supabase instance is running
- Check network connectivity

### Tests Pass Locally but Fail in CI
- Ensure CI has database access
- Check environment variables are set
- Verify cleanup runs properly (no data pollution)

### Tests Pass Individually But Fail Together
- **Symptom**: Tests fail with foreign key violations or "already exists" errors when run together
- **Cause**: Cross-file test pollution when files run in parallel
- **Solution**: Already configured with `fileParallelism: false` in vitest config
- **Prevention**: Always use `createdUserIds` Set pattern for test cleanup

### Slow Test Execution
- Database operations are slower than unit tests (expected)
- Current 139 tests run in ~60 seconds
- File parallelism is disabled to prevent test pollution

---

## Next Steps

As the project grows:

1. **Add component tests** for complex UI with `@testing-library/react`
2. **Add E2E tests** with Playwright for critical user flows
3. **Monitor coverage** (add `vitest --coverage` when ready)
4. **Test React Query hooks** once they're heavily used

---

## Related Documentation

- [Execution Status](../README.md) - Overall implementation progress
- [Database Schema](../database/schema.md) - Schema being tested
- [Tech Stack](../../planning/architecture/tech-stack.md) - Testing tools overview

---

**Summary**: 139 tests across 8 suites covering user management, database queries, server actions, and utilities. Use shared test utilities from `@/test/` and follow the `createdUserIds` Set pattern for test isolation.
