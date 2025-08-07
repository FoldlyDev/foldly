// =============================================================================
// FOLDERS TABLE SCHEMA - Simplified Hierarchical Structure (No Colors/Descriptions for MVP)
// =============================================================================
// 🎯 Defines the folders table structure for Supabase database

import {
  pgTable,
  varchar,
  text,
  boolean,
  integer,
  bigint,
  timestamp,
  uuid,
  index,
} from 'drizzle-orm/pg-core';
import { workspaces } from './workspaces';
import { links } from './links';

/**
 * Folders table - Simplified hierarchical structure with root folder support
 * NULL folderId means files are at workspace root level
 */
export const folders = pgTable(
  'folders',
  {
    id: uuid('id').defaultRandom().primaryKey().notNull(),
    // userId removed - derive from workspace.userId or link.userId
    workspaceId: uuid('workspace_id')
      .references(() => workspaces.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    parentFolderId: uuid('parent_folder_id'),
    // Self-referential foreign key handled at database level
    linkId: uuid('link_id').references(() => links.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
    // batchId removed - folders aren't created by batches

    // Folder information - Simplified for MVP
    name: varchar('name', { length: 255 }).notNull(),
    path: text('path').notNull(), // materialized full path
    depth: integer('depth').default(0).notNull(), // 0 = root

    // Organization
    isArchived: boolean('is_archived').default(false).notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),

    // Statistics
    fileCount: integer('file_count').default(0).notNull(),
    totalSize: bigint('total_size', { mode: 'number' }).default(0).notNull(),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  table => ({
    // foldersUserIdIdx removed - userId field removed
    foldersWorkspaceIdIdx: index('folders_workspace_id_idx').on(
      table.workspaceId
    ),
    foldersParentIdx: index('folders_parent_idx').on(table.parentFolderId),
    foldersLinkIdIdx: index('folders_link_id_idx').on(table.linkId),
    foldersPathIdx: index('folders_path_idx').on(table.path),
    foldersDepthIdx: index('folders_depth_idx').on(table.depth),
  })
);
