# Validation Schema Organization Pattern

## Overview

This document describes the architectural pattern for organizing validation schemas in module-specific directories. Validation schemas follow a feature-based naming convention for clarity and scalability.

## Naming Convention

### Pattern: `{entity}-{feature}-schemas.ts`

```
validation/
├── link-core-schemas.ts        # Core CRUD operations & access control
├── link-branding-schemas.ts    # Branding-specific validation
├── link-form-schemas.ts        # Form validation with conditional logic
└── index.ts                    # Central export point
```

### Rationale

**Namespace Prefix**: All schemas for the same entity share a common prefix (e.g., `link-*`)
- Makes entity boundaries immediately clear
- Prevents confusion across modules
- Scales to multiple feature areas

**Feature Suffix**: Describes the specific concern (e.g., `core`, `branding`, `form`)
- `core`: Base entity properties and CRUD operations
- `{feature}`: Feature-specific schemas (branding, analytics, etc.)
- `form`: Form validation orchestration

## File Splitting Decision Criteria

### When to Split (ANY ONE triggers split):

**Size-Based**:
- File exceeds **250 lines**
- More than **15 exported schemas**
- More than **5 action schemas** for single feature

**Feature-Based**:
- Feature has **3+ specialized validators** (type guards, refinements)
- Feature has **helper functions** (path generators, format converters)
- Feature has **domain-specific constants** (file types, size limits)

**Import Complexity**:
- File imported by **5+ modules**
- 50% of imports only need a subset (signals poor cohesion)

## File Structure

```
modules/{module}/lib/validation/
├── {entity}-core-schemas.ts      # Required base fields & CRUD
├── {entity}-{feature}-schemas.ts # Feature-specific validation
├── {entity}-form-schemas.ts      # Form-specific with conditional logic
└── index.ts                      # Central exports
```

### Core Schema File

Contains fundamental entity validation:
- Field-level schemas (building blocks)
- CRUD action input schemas
- Permission/access control schemas

**Example** (`link-core-schemas.ts`):
```typescript
// Field schemas
export const linkNameSchema = createNameSchema({/*...*/});
export const slugSchema = createSlugSchema({/*...*/});
export const isPublicFieldSchema = z.boolean();
export const passwordFieldSchema = z.string().min(8).max(100);

// Action schemas
export const createLinkSchema = z.object({
  name: linkNameSchema,
  slug: slugSchema,
  isPublic: isPublicFieldSchema,
});
```

### Feature Schema File

Contains specialized feature validation:
- Feature-specific field schemas
- Feature-specific action schemas
- Helper functions and type guards
- Feature-specific constants

**Example** (`link-branding-schemas.ts`):
```typescript
// Feature constants
export const ALLOWED_BRANDING_TYPES = ['image/png', 'image/jpeg'] as const;
export const MAX_BRANDING_FILE_SIZE = 5 * 1024 * 1024;

// Field schemas
export const accentColorFieldSchema = createHexColorSchema({/*...*/});
export const backgroundColorFieldSchema = createHexColorSchema({/*...*/});

// Feature schema
export const brandingSchema = z.object({
  logo: z.object({/*...*/}),
  colors: z.object({
    accentColor: accentColorFieldSchema,
    backgroundColor: backgroundColorFieldSchema,
  }),
});

// Helper functions
export function generateBrandingPath(workspaceId: string, linkId: string): string {
  return `branding/${workspaceId}/${linkId}`;
}
```

### Form Schema File

Contains form-specific validation:
- Imports from core and feature schemas
- Adds conditional validation logic
- May define form-specific types

**Example** (`link-form-schemas.ts`):
```typescript
import { linkNameSchema, slugSchema } from './link-core-schemas';
import { accentColorFieldSchema } from './link-branding-schemas';

export const createLinkFormSchema = z.object({
  name: linkNameSchema,
  slug: slugSchema,
  accentColor: accentColorFieldSchema,
  // ... all fields
}).superRefine((data, ctx) => {
  // Conditional validation
  if (data.passwordProtected && !data.password) {
    ctx.addIssue({/*...*/});
  }
});
```

## Import Patterns

### Centralized Exports

```typescript
// index.ts - Central export point
export * from './link-core-schemas';
export * from './link-branding-schemas';
export * from './link-form-schemas';
```

### Consumer Imports

```typescript
// ✅ CORRECT: Import from centralized index
import { createLinkFormSchema, type CreateLinkFormData } from '@/modules/links/lib/validation';

// ❌ INCORRECT: Import directly from file (bypasses index)
import { createLinkFormSchema } from '@/modules/links/lib/validation/link-form-schemas';
```

## Global Utilities Pattern

**Use global utilities** when validation logic is reusable across modules:

```typescript
// lib/utils/validation-helpers.ts
export function createHexColorSchema(options?: { allowShorthand?: boolean }) {
  // Reusable color validation
}

// modules/links/lib/validation/link-branding-schemas.ts
import { createHexColorSchema } from '@/lib/utils/validation-helpers';

export const accentColorFieldSchema = createHexColorSchema({
  fieldName: 'Accent color',
});
```

**Use global constants** for validation limits:

```typescript
// lib/constants/validation.ts
export const VALIDATION_LIMITS = {
  PASSWORD: { MIN_LENGTH: 8, MAX_LENGTH: 100 },
  BRANDING: { MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024 },
} as const;

// modules/links/lib/validation/link-core-schemas.ts
import { VALIDATION_LIMITS } from '@/lib/constants/validation';

export const passwordFieldSchema = z.string()
  .min(VALIDATION_LIMITS.PASSWORD.MIN_LENGTH)
  .max(VALIDATION_LIMITS.PASSWORD.MAX_LENGTH);
```

## Best Practices

### 1. Single Source of Truth
Each validation rule should exist in ONE place:
- Field validation → Core schema file
- Feature validation → Feature schema file
- Conditional logic → Form schema file

### 2. Avoid Duplication
Use global helpers for repeated patterns:
- ✅ `createHexColorSchema()` for all color validation
- ✅ `VALIDATION_LIMITS` for all numeric limits
- ❌ Copy-paste regex patterns

### 3. Type Safety
Export inferred types alongside schemas:
```typescript
export const createLinkSchema = z.object({/*...*/});
export type CreateLinkInput = z.infer<typeof createLinkSchema>;
```

### 4. Documentation
Add JSDoc comments for complex schemas:
```typescript
/**
 * Branding configuration schema
 * Validates logo (PNG/JPEG/WebP, max 5MB) and colors (6-digit hex)
 */
export const brandingSchema = z.object({/*...*/});
```

## Related Documentation

- [Action Organization Pattern](./action-organization-pattern.md)
- [CLAUDE.md](../../../CLAUDE.md) - Project architectural guidelines

## Version History

- **v1.0** (2025-10-23): Initial pattern established with link module refactoring
