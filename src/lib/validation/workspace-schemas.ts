// =============================================================================
// WORKSPACE VALIDATION SCHEMAS
// =============================================================================
// Input validation schemas for workspace operations
// Used by global workspace actions in @/lib/actions/workspace.actions.ts

import { z } from 'zod';
import { uuidSchema } from './base-schemas';

// =============================================================================
// CONSTANTS
// =============================================================================

const USERNAME_MIN_LENGTH = 2;
const USERNAME_MAX_LENGTH = 50;
const WORKSPACE_NAME_MIN_LENGTH = 2;
const WORKSPACE_NAME_MAX_LENGTH = 100;

// =============================================================================
// INPUT SCHEMAS
// =============================================================================

/**
 * Schema for creating a workspace
 * Used during onboarding flow
 */
export const createWorkspaceInputSchema = z.object({
  username: z
    .string()
    .min(USERNAME_MIN_LENGTH, `Username must be at least ${USERNAME_MIN_LENGTH} characters`)
    .max(USERNAME_MAX_LENGTH, `Username must be less than ${USERNAME_MAX_LENGTH} characters`)
    .trim()
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Username can only contain letters, numbers, hyphens, and underscores'
    ),
});

/**
 * Schema for updating workspace name
 */
export const updateWorkspaceNameInputSchema = z.object({
  workspaceId: uuidSchema,
  name: z
    .string()
    .min(
      WORKSPACE_NAME_MIN_LENGTH,
      `Workspace name must be at least ${WORKSPACE_NAME_MIN_LENGTH} characters`
    )
    .max(
      WORKSPACE_NAME_MAX_LENGTH,
      `Workspace name must be less than ${WORKSPACE_NAME_MAX_LENGTH} characters`
    )
    .trim(),
});

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceInputSchema>;
export type UpdateWorkspaceNameInput = z.infer<typeof updateWorkspaceNameInputSchema>;
