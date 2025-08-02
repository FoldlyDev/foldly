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
import { users } from './users';
import { workspaces } from './workspaces';
import { links } from './links';
import { batches } from './batches';

/**
 * Folders table - Simplified hierarchical structure with root folder support
 * NULL folderId means files are at workspace root level
 */
export const folders = pgTable(
  'folders',
  {
    id: uuid('id').defaultRandom().primaryKey().notNull(),
    userId: text('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    workspaceId: uuid('workspace_id')
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    parentFolderId: uuid('parent_folder_id'),
    // Self-referential foreign key handled at database level
    linkId: uuid('link_id').references(() => links.id, {
      onDelete: 'set null',
    }),
    batchId: uuid('batch_id').references(() => batches.id, {
      onDelete: 'set null',
    }), // Optional - tracks which upload batch created this folder

    // Folder information - Simplified for MVP
    name: varchar('name', { length: 255 }).notNull(),
    path: text('path').notNull(), // materialized full path
    depth: integer('depth').default(0).notNull(), // 0 = root

    // Organization
    isArchived: boolean('is_archived').default(false).notNull(),
    isPublic: boolean('is_public').default(false).notNull(),
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
    foldersUserIdIdx: index('folders_user_id_idx').on(table.userId),
    foldersWorkspaceIdIdx: index('folders_workspace_id_idx').on(
      table.workspaceId
    ),
    foldersParentIdx: index('folders_parent_idx').on(table.parentFolderId),
    foldersLinkIdIdx: index('folders_link_id_idx').on(table.linkId),
    foldersPathIdx: index('folders_path_idx').on(table.path),
    foldersDepthIdx: index('folders_depth_idx').on(table.depth),
  })
);
