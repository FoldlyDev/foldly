/**
 * Database constraint validation schemas for the Links feature
 * Aligned with actual database schema constraints
 *
 * @module links/lib/validations/database
 */

import { z } from 'zod';
import { uuidSchema } from './base';

// =============================================================================
// DATABASE CONSTRAINT SCHEMAS
// =============================================================================

/**
 * Database link schema - matches the actual links table structure
 * These constraints should match your Drizzle schema exactly
 */
export const databaseLinkSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,
  workspaceId: uuidSchema,
  title: z.string().min(1).max(100),
  topic: z.string().min(1).max(50),
  description: z.string().max(500).nullable(),
  requireEmail: z.boolean(),
  requirePassword: z.boolean(),
  password: z.string().nullable(),
  isActive: z.boolean(),
  expiresAt: z.date().nullable(),
  brandingEnabled: z.boolean(),
  brandColor: z.string().nullable(),
  accentColor: z.string().nullable(),
  logoUrl: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Database insert schema - excludes auto-generated fields
 */
export const databaseLinkInsertSchema = databaseLinkSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

/**
 * Database update schema - all fields optional except id
 */
export const databaseLinkUpdateSchema = databaseLinkSchema
  .omit({
    id: true,
    userId: true,
    createdAt: true,
    updatedAt: true,
  })
  .partial();

/**
 * Database select schema with optional relations
 */
export const databaseLinkSelectSchema = databaseLinkSchema.extend({
  // Add any relation fields here when needed
  workspace: z
    .object({
      id: uuidSchema,
      name: z.string(),
    })
    .optional(),
  user: z
    .object({
      id: uuidSchema,
      email: z.string().email(),
    })
    .optional(),
});

// =============================================================================
// CONSTRAINT VALIDATION HELPERS
// =============================================================================

/**
 * Validate against database constraints before insert/update
 */
export function validateDatabaseConstraints(data: unknown) {
  return databaseLinkSchema.safeParse(data);
}

/**
 * Validate insert data against database constraints
 */
export function validateDatabaseInsert(data: unknown) {
  return databaseLinkInsertSchema.safeParse(data);
}

/**
 * Validate update data against database constraints
 */
export function validateDatabaseUpdate(data: unknown) {
  return databaseLinkUpdateSchema.safeParse(data);
}

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type DatabaseLink = z.infer<typeof databaseLinkSchema>;
export type DatabaseLinkInsert = z.infer<typeof databaseLinkInsertSchema>;
export type DatabaseLinkUpdate = z.infer<typeof databaseLinkUpdateSchema>;
export type DatabaseLinkSelect = z.infer<typeof databaseLinkSelectSchema>;
