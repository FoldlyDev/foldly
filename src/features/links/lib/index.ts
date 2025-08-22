/**
 * Links Feature - Library Entry Point
 *
 * This module provides the core infrastructure for the Links feature,
 * including database operations, server actions, and validation schemas.
 *
 * @module links/lib
 */

// =============================================================================
// DATABASE SERVICES
// =============================================================================

export { linksDbService, LinksDbService } from './db-service';

// =============================================================================
// SERVER ACTIONS (CLEAN MODULAR ARCHITECTURE)
// =============================================================================

// Authentication & Audit utilities
export { requireAuth, logAudit, type AuditEntry } from './actions/shared';

// CRUD Operations
export { createLinkAction } from './actions/create';

export { updateLinkAction, updateLinkSettingsAction } from './actions/update';

export { deleteLinkAction, bulkDeleteLinksAction } from './actions/delete';

export { toggleLinkActiveAction } from './actions/toggle';

export { duplicateLinkAction } from './actions/duplicate';

// =============================================================================
// VALIDATION SCHEMAS (MODERN 2025 ARCHITECTURE)
// =============================================================================

// Complete validation system with proper separation of concerns:
// - base.ts: Shared utilities, base schemas, and refinement helpers
// - forms.ts: Client-side form validation (React Hook Form)
// - actions.ts: Server action validation (Next.js Server Actions)
// - database.ts: Database constraint validation (Drizzle ORM)

export * from './validations';

// =============================================================================
// UTILITIES
// =============================================================================

export * from './utils';

// =============================================================================
// ARCHITECTURAL NOTES
// =============================================================================

/**
 * VALIDATION ARCHITECTURE (2025 Best Practices):
 *
 * 1. lib/validations/base.ts
 *    - Shared base schemas (titleSchema, topicSchema, etc.)
 *    - Validation utilities (handleFieldErrors)
 *    - Refinement helpers (withPasswordRequirement)
 *    - ActionResult type definition
 *
 * 2. lib/validations/forms.ts
 *    - Client-side form schemas for React Hook Form
 *    - Includes non-database fields (instructions, autoCreateFolders)
 *    - Multi-step wizard schemas
 *    - Quick edit modal schemas
 *
 * 3. lib/validations/actions.ts
 *    - Server action validation schemas
 *    - Only database-persisted fields
 *    - FlexibleLinkUpdate type for partial updates
 *    - CRUD operation schemas
 *
 * 4. lib/validations/database.ts
 *    - Database constraint validation
 *    - Drizzle ORM schema alignment
 *    - Insert/Update/Select schemas
 *    - Constraint validation helpers
 *
 * 5. lib/validations/index.ts
 *    - Barrel exports with proper categorization
 *    - Backward compatibility exports
 *    - Clear separation of concerns
 *
 * This architecture follows:
 * - Standard Schema specification compliance
 * - Separation of concerns principle
 * - DRY (Don't Repeat Yourself)
 * - Type safety and reusability
 * - Modern Next.js App Router patterns
 */
