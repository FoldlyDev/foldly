// =============================================================================
// RELATIONS SCHEMA - All Table Relationships Using Drizzle ORM Relations
// =============================================================================
// 🎯 Centralized relationship definitions for all database tables

import { relations } from 'drizzle-orm';
import { users } from './users';
import { workspaces } from './workspaces';
import { links } from './links';
import { folders } from './folders';
import { batches } from './batches';
import { files } from './files';
import { subscriptionAnalytics } from './subscription-analytics';

// =============================================================================
// USER RELATIONS
// =============================================================================

export const usersRelations = relations(users, ({ one, many }) => ({
  // One-to-one relationship with workspace (MVP simplification)
  workspace: one(workspaces, {
    fields: [users.id],
    references: [workspaces.userId],
  }),

  // One-to-many relationships
  links: many(links),
  subscriptionAnalytics: many(subscriptionAnalytics),
}));

// =============================================================================
// WORKSPACE RELATIONS
// =============================================================================

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
  // Many-to-one relationship with user
  user: one(users, {
    fields: [workspaces.userId],
    references: [users.id],
  }),

  // One-to-many relationships
  links: many(links),
  folders: many(folders),
  files: many(files),
}));

// =============================================================================
// LINK RELATIONS
// =============================================================================

export const linksRelations = relations(links, ({ one, many }) => ({
  // Many-to-one relationships
  user: one(users, {
    fields: [links.userId],
    references: [users.id],
  }),
  workspace: one(workspaces, {
    fields: [links.workspaceId],
    references: [workspaces.id],
  }),

  // One-to-many relationships
  folders: many(folders),
  batches: many(batches),
  files: many(files),
}));

// =============================================================================
// FOLDER RELATIONS
// =============================================================================

export const foldersRelations = relations(folders, ({ one, many }) => ({
  // Many-to-one relationships
  workspace: one(workspaces, {
    fields: [folders.workspaceId],
    references: [workspaces.id],
  }),
  link: one(links, {
    fields: [folders.linkId],
    references: [links.id],
  }),

  // Self-referencing relationship for folder hierarchy
  parentFolder: one(folders, {
    fields: [folders.parentFolderId],
    references: [folders.id],
    relationName: 'folderHierarchy',
  }),
  subfolders: many(folders, {
    relationName: 'folderHierarchy',
  }),

  // One-to-many relationships
  files: many(files),
}));

// =============================================================================
// BATCH RELATIONS
// =============================================================================

export const batchesRelations = relations(batches, ({ one, many }) => ({
  // Many-to-one relationships
  link: one(links, {
    fields: [batches.linkId],
    references: [links.id],
  }),
  // targetFolderId is for generated links only, no direct relation needed

  // One-to-many relationships
  files: many(files),
}));

// =============================================================================
// FILE RELATIONS
// =============================================================================

export const filesRelations = relations(files, ({ one }) => ({
  // Many-to-one relationships
  link: one(links, {
    fields: [files.linkId],
    references: [links.id],
  }),
  batch: one(batches, {
    fields: [files.batchId],
    references: [batches.id],
  }),
  workspace: one(workspaces, {
    fields: [files.workspaceId],
    references: [workspaces.id],
  }),
  folder: one(folders, {
    fields: [files.folderId],
    references: [folders.id],
  }),
}));

// =============================================================================
// SUBSCRIPTION ANALYTICS RELATIONS
// =============================================================================

export const subscriptionAnalyticsRelations = relations(
  subscriptionAnalytics,
  ({ one }) => ({
    // Many-to-one relationship with user
    user: one(users, {
      fields: [subscriptionAnalytics.userId],
      references: [users.id],
    }),
  })
);
