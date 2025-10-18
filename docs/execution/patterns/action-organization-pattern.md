# Action Organization Pattern

## Overview

This document describes the architectural pattern for organizing server actions in the Foldly codebase. As of Phase 2 of the architectural refactorization, core domain actions (links, permissions) have been moved to global scope to improve discoverability, reduce duplication, and establish clearer separation of concerns.

## Rationale

### Why Global Actions?

**Problem**: Module-specific actions in `src/modules/links/lib/actions/` created several issues:
- **Poor Discoverability**: Developers had to search within module directories to find CRUD operations
- **Unclear Ownership**: Actions used across multiple modules (e.g., permissions used by both links and uploads modules) had ambiguous ownership
- **Coupling**: Module-specific actions created tight coupling between UI components and business logic

**Solution**: Move cross-module, domain-core actions to `src/lib/actions/` where they:
- Are easily discoverable alongside other global actions (user, workspace, onboarding)
- Establish clear ownership (link actions own link domain logic)
- Enable loose coupling (multiple modules can import without circular dependencies)
- Follow the established architectural pattern used for user and workspace actions

## Decision Criteria

### Use Global Actions When:

1. **Cross-Module Usage**: Action is used by 2+ feature modules
   - Example: `addPermissionAction` used by both links and uploads modules

2. **Core Domain Operations**: Action represents fundamental CRUD for a database entity
   - Example: `createLinkAction`, `updateLinkAction`, `deleteLinkAction`

3. **Shared Business Logic**: Action encapsulates business rules needed across features
   - Example: `checkSlugAvailabilityAction` used in link creation flows across modules

4. **High Reusability Potential**: Even if currently used in one place, the action has clear reuse potential
   - Example: `getLinkPermissionsAction` - initially used by links module, but upload module will need it

### Use Module-Specific Actions When:

1. **Single Module Usage**: Action is tightly coupled to one specific feature
   - Example: Analytics-specific aggregation actions

2. **UI-Specific Logic**: Action handles UI state or component-specific concerns
   - Example: Notification dismissal actions

3. **Module-Specific Workflows**: Action orchestrates module-internal flows
   - Example: Multi-step wizard actions in onboarding UI

4. **Low Reusability**: Action is highly specialized with no foreseeable reuse
   - Example: Feature-specific data transformations

## File Structure

```
src/
├── lib/
│   ├── actions/
│   │   ├── __tests__/          # Global action tests
│   │   │   ├── link.actions.test.ts
│   │   │   ├── permission.actions.test.ts
│   │   │   ├── onboarding.actions.test.ts
│   │   │   └── user.actions.test.ts
│   │   ├── index.ts            # Central export point
│   │   ├── link.actions.ts     # Link CRUD operations (7 actions)
│   │   ├── permission.actions.ts # Permission management (4 actions)
│   │   ├── user.actions.ts     # User management
│   │   ├── workspace.actions.ts # Workspace operations
│   │   └── onboarding.actions.ts # Onboarding flow
│   │
│   └── database/
│       └── queries/            # Database layer (called by actions)
│           ├── link.queries.ts
│           ├── permission.queries.ts
│           ├── user.queries.ts
│           └── workspace.queries.ts
│
└── modules/
    └── {module-name}/
        ├── lib/
        │   └── actions/        # Module-specific actions only
        │       └── {module}.actions.ts
        └── hooks/              # Module-specific hooks
            └── use-{module}.ts
```

## Import Patterns

### Global Actions - Centralized Exports

```typescript
// src/lib/actions/index.ts
export { getUserLinksAction, createLinkAction, updateLinkAction } from './link.actions';
export { addPermissionAction, removePermissionAction } from './permission.actions';
export { getUserAction, updateUserProfileAction } from './user.actions';
```

### Importing Global Actions

```typescript
// ✅ CORRECT: Import from centralized index
import { createLinkAction, addPermissionAction } from '@/lib/actions';

// ❌ INCORRECT: Import directly from file
import { createLinkAction } from '@/lib/actions/link.actions';
```

### Module-Specific Actions

```typescript
// ✅ CORRECT: Import from module
import { dismissNotificationAction } from '@/modules/notifications/lib/actions';

// ❌ INCORRECT: Don't add module-specific actions to global scope
import { dismissNotificationAction } from '@/lib/actions'; // Wrong!
```

## Action File Organization

Each action file follows a consistent structure:

### 1. Header Comments
```typescript
// =============================================================================
// LINK ACTIONS - Core Link Management
// =============================================================================
// Used by: links module, upload module (link validation)
// Handles: CRUD operations for shareable links with ownership verification
```

### 2. Imports (Grouped by Purpose)
```typescript
'use server';

// Import from global utilities
import { withAuthInput, type ActionResponse } from '@/lib/utils/action-helpers';
import { getAuthenticatedWorkspace, verifyLinkOwnership } from '@/lib/utils/authorization';
import { ERROR_MESSAGES } from '@/lib/constants';

// Import database queries
import { createLink, getLinkById, updateLink } from '@/lib/database/queries';

// Import rate limiting
import { checkRateLimit, RateLimitPresets, RateLimitKeys } from '@/lib/middleware/rate-limit';

// Import logging
import { logger, logSecurityEvent } from '@/lib/utils/logger';

// Import types
import type { Link } from '@/lib/database/schemas';

// Import module-specific validation schemas
import { validateInput, type CreateLinkInput } from '@/modules/links/lib/validation/link-schemas';
```

### 3. Action Implementations

Each action includes:
- JSDoc comments with description, parameters, returns, and example
- Rate limiting configuration
- Input validation
- Authorization checks
- Business logic
- Security logging
- Consistent error handling

```typescript
/**
 * Create a new shareable link
 * Rate limited: 20 requests per minute
 * Creates link and owner permission atomically
 *
 * @param data - Link creation data (name, slug, isPublic)
 * @returns Created link
 *
 * @example
 * ```typescript
 * const result = await createLinkAction({
 *   name: 'My Link',
 *   slug: 'my-link',
 *   isPublic: true
 * });
 * ```
 */
export const createLinkAction = withAuthInput<CreateLinkInput, Link>(
  'createLinkAction',
  async (userId, input) => {
    // Implementation...
  }
);
```

## Testing Patterns

### Test File Structure

```typescript
// src/lib/actions/__tests__/link.actions.test.ts
describe('Link Actions', () => {
  const createdUserIds = new Set<string>();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    const cleanupPromises = Array.from(createdUserIds).map(id => cleanupTestUser(id));
    await Promise.all(cleanupPromises);
    createdUserIds.clear();
  });

  describe('createLinkAction', () => {
    it('should create link with owner permission atomically', async () => {
      // Arrange
      const user = await createTestUser();
      createdUserIds.add(user.id);
      // ... test implementation
    });
  });
});
```

### Test Coverage Requirements

Each action must have tests covering:
1. **Success path**: Happy path with valid inputs
2. **Authorization**: Ownership verification and authentication
3. **Rate limiting**: Enforcement of configured limits
4. **Input validation**: Invalid inputs rejected
5. **Business logic**: Domain rules enforced
6. **Error handling**: Graceful failure modes

## Migration Guide

### Phase 1: Identify Candidates
1. Review module-specific actions
2. Apply decision criteria (cross-module usage, core domain operations)
3. Document actions to migrate

### Phase 2: Move Actions
1. Create new action file in `src/lib/actions/`
2. Move action implementations
3. Update imports to use global utilities
4. Add to `src/lib/actions/index.ts`

### Phase 3: Update Consumers
1. Find all imports of old action location
2. Update to import from `@/lib/actions`
3. Remove old action files

### Phase 4: Update Documentation
1. Update module README if it exists
2. Document new import patterns
3. Update architectural documentation

## Best Practices

### 1. Higher-Order Functions (HOFs)
Use `withAuth` and `withAuthInput` to eliminate boilerplate:

```typescript
// ✅ CORRECT: Using HOF
export const createLinkAction = withAuthInput<CreateLinkInput, Link>(
  'createLinkAction',
  async (userId, input) => {
    // Business logic only - auth handled by HOF
  }
);

// ❌ INCORRECT: Manual auth
export async function createLinkAction(input: CreateLinkInput) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  // ...
}
```

### 2. Validation Schemas
Keep validation schemas module-specific during refactorization:

```typescript
// ✅ CORRECT: Import module validation
import { validateInput, type CreateLinkInput } from '@/modules/links/lib/validation/link-schemas';

// Future: Phase 3 will move shared schemas to global scope
```

### 3. Error Messages
Use centralized error constants:

```typescript
// ✅ CORRECT: Centralized errors
import { ERROR_MESSAGES } from '@/lib/constants';
throw { success: false, error: ERROR_MESSAGES.LINK.NOT_FOUND };

// ❌ INCORRECT: Hard-coded strings
throw { success: false, error: 'Link not found' };
```

### 4. Security Logging
Use consistent security logging patterns:

```typescript
import { logger, logSecurityEvent } from '@/lib/utils/logger';

// Log successful operations
logger.info('Link created successfully', { userId, linkId, slug });

// Log security-relevant events
logSecurityEvent('linkDeleted', { userId, linkId, cascadedFiles: 42 });
```

## Related Documentation

- [Link Module Refactor](../link-module-refactor.md) - Implementation tracking
- [Three-Layer Architecture](../../planning/architecture/three-layer-architecture.md)
- [Action Helpers](../../planning/architecture/action-helpers.md)

## Version History

- **v1.0** (Phase 2 Complete): Link and permission actions moved to global scope
- **v0.1** (Initial): User, workspace, onboarding actions in global scope
