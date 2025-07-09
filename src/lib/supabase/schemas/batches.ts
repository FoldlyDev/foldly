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
import { folders } from './folders';

/**
 * Batches table - Organizes file uploads into batches for better management
 */
export const batches = pgTable(
  'batches',
  {
    id: uuid('id').defaultRandom().primaryKey().notNull(),
    linkId: uuid('link_id')
      .references(() => links.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    folderId: uuid('folder_id').references(() => folders.id, {
      onDelete: 'set null',
    }), // NULL for root folder uploads

    // Uploader information (form data)
    uploaderName: varchar('uploader_name', { length: 255 }).notNull(),
    uploaderEmail: varchar('uploader_email', { length: 255 }),
    uploaderMessage: text('uploader_message'),

    // Batch metadata
    name: varchar('name', { length: 255 }),
    displayName: varchar('display_name', { length: 255 }),

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
    batchesUserIdIdx: index('batches_user_id_idx').on(table.userId),
    batchesFolderIdIdx: index('batches_folder_id_idx').on(table.folderId),
    batchesStatusIdx: index('batches_status_idx').on(table.status),
    batchesCreatedAtIdx: index('batches_created_at_idx').on(table.createdAt),
  })
);
