// =============================================================================
// FOLDER-LINK VALIDATION SCHEMAS - Folder ↔ Link Relationship
// =============================================================================
// Used by: Workspace module (folder-link operations), potentially links module
// Extends base schemas with folder-link relationship validation

import { z } from 'zod';

// Import base schemas from global
import { uuidSchema, emailSchema } from './base-schemas';

// =============================================================================
// INPUT SCHEMAS (3 schemas)
// =============================================================================

/**
 * Link folder to existing link input schema
 * Used when linking a personal folder to an inactive link
 */
export const linkFolderToExistingLinkSchema = z.object({
  folderId: uuidSchema,
  linkId: uuidSchema,
});

export type LinkFolderToExistingLinkInput = z.infer<
  typeof linkFolderToExistingLinkSchema
>;

/**
 * Link folder with new link input schema
 * Auto-generates link from folder name
 * Only accepts optional array of allowed emails for permissions
 *
 * Link name will be: "{folder.name} Link" (e.g., "Client Documents Link")
 * Link slug will be: "{slugify(folder.name)}-link" (e.g., "client-documents-link")
 * Owner permission automatically created with user's email
 * Editor permissions created for allowedEmails
 */
export const linkFolderWithNewLinkSchema = z.object({
  folderId: uuidSchema,
  allowedEmails: z.array(emailSchema).optional(),
});

export type LinkFolderWithNewLinkInput = z.infer<
  typeof linkFolderWithNewLinkSchema
>;

/**
 * Unlink folder input schema
 * Used when converting a shared folder to personal (non-destructive)
 */
export const unlinkFolderSchema = z.object({
  folderId: uuidSchema,
});

export type UnlinkFolderInput = z.infer<typeof unlinkFolderSchema>;
