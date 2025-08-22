// =============================================================================
// BATCHES TABLE SCHEMA - Upload Batch Organization with Status Tracking
// =============================================================================
// 🎯 Defines the batches table structure for Supabase database

import {
  pgTable,
  varchar,
  text,
  integer,
  bigint,
  timestamp,
  uuid,
  index,
} from 'drizzle-orm/pg-core';
import { batchStatusEnum } from './enums';
import { links } from './links';
import { users } from './users';
// Removed circular import - folders references batches, not vice versa

/**
 * Batches table - Tracks external uploads via links (base, custom, or generated)
 * 
 * targetFolderId usage:
 * - Base/Custom links: Always NULL (uploads go to link root)
 * - Generated links: Set to link.sourceFolderId (uploads go to workspace folder)
 */
export const batches = pgTable(
  'batches',
  {
    id: uuid('id').defaultRandom().primaryKey().notNull(),
    linkId: uuid('link_id')
      .references(() => links.id, { onDelete: 'cascade', onUpdate: 'cascade' })
      .notNull(),
    // userId removed - derive from link.userId
    targetFolderId: uuid('target_folder_id'), // For generated links: the workspace folder to upload to

    // Uploader information (form data)
    uploaderName: varchar('uploader_name', { length: 255 }).notNull(),
    uploaderEmail: varchar('uploader_email', { length: 255 }),
    uploaderMessage: text('uploader_message'),

    // Batch metadata - removed redundant name/displayName fields

    // Processing status and statistics
    status: batchStatusEnum('status').default('uploading').notNull(),
    totalFiles: integer('total_files').default(0).notNull(),
    processedFiles: integer('processed_files').default(0).notNull(),
    totalSize: bigint('total_size', { mode: 'number' }).default(0).notNull(),

    // Processing timestamps
    uploadCompletedAt: timestamp('upload_completed_at', { withTimezone: true }),

    // Standard timestamps
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  table => ({
    batchesLinkIdIdx: index('batches_link_id_idx').on(table.linkId),
    batchesTargetFolderIdIdx: index('batches_target_folder_id_idx').on(table.targetFolderId),
    batchesStatusIdx: index('batches_status_idx').on(table.status),
    batchesCreatedAtIdx: index('batches_created_at_idx').on(table.createdAt),
  })
);
