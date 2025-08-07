// =============================================================================
// FILES TABLE SCHEMA - Comprehensive File Metadata with Root Folder Support
// =============================================================================
// 🎯 Defines the files table structure for Supabase database

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
import { fileProcessingStatusEnum } from './enums';
import { links } from './links';
import { batches } from './batches';
import { users } from './users';
import { folders } from './folders';
import { workspaces } from './workspaces';

/**
 * Files table - Complete file metadata with processing status and root folder support
 * 
 * File contexts:
 * 1. Personal upload: workspaceId set, linkId null, batchId null
 * 2. Link upload: linkId set, workspaceId null, batchId set
 * 3. Generated link upload: workspaceId set, linkId null, batchId set (goes to workspace folder)
 * 
 * NULL folderId means file is stored at workspace/link root level
 */
export const files = pgTable(
  'files',
  {
    id: uuid('id').defaultRandom().primaryKey().notNull(),
    linkId: uuid('link_id').references(() => links.id, { onDelete: 'cascade', onUpdate: 'cascade' }), // Optional - null for personal workspace files
    batchId: uuid('batch_id').references(() => batches.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }), // Required when linkId is set, null for workspace files
    // userId removed - derive from workspace.userId or link.userId
    workspaceId: uuid('workspace_id').references(() => workspaces.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }), // For personal workspace files
    folderId: uuid('folder_id').references(() => folders.id, {
      onDelete: 'set null',
      onUpdate: 'cascade',
    }), // NULL for root folder files

    // File identification
    fileName: varchar('file_name', { length: 255 }).notNull(),
    originalName: varchar('original_name', { length: 255 }).notNull(),
    fileSize: bigint('file_size', { mode: 'number' }).notNull(),
    mimeType: varchar('mime_type', { length: 255 }).notNull(),
    extension: varchar('extension', { length: 10 }),

    // Storage information
    storagePath: text('storage_path').notNull(),
    storageProvider: varchar('storage_provider', { length: 50 })
      .default('supabase')
      .notNull(),
    checksum: varchar('checksum', { length: 64 }),

    // Security and safety
    isSafe: boolean('is_safe').default(true).notNull(),
    virusScanResult: varchar('virus_scan_result', { length: 50 })
      .default('clean')
      .notNull(),

    // File processing
    processingStatus: fileProcessingStatusEnum('processing_status')
      .default('pending')
      .notNull(),
    thumbnailPath: text('thumbnail_path'),

    // Organization flags
    isOrganized: boolean('is_organized').default(false).notNull(),
    needsReview: boolean('needs_review').default(false).notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),

    // Access tracking
    downloadCount: integer('download_count').default(0).notNull(),
    lastAccessedAt: timestamp('last_accessed_at', { withTimezone: true }),

    // Upload tracking
    uploadedAt: timestamp('uploaded_at', { withTimezone: true })
      .defaultNow()
      .notNull(),

    // Standard timestamps
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  table => ({
    filesLinkIdIdx: index('files_link_id_idx').on(table.linkId),
    filesBatchIdIdx: index('files_batch_id_idx').on(table.batchId),
    // filesUserIdIdx removed - userId field removed
    filesWorkspaceIdIdx: index('files_workspace_id_idx').on(table.workspaceId),
    filesFolderIdIdx: index('files_folder_id_idx').on(table.folderId),
    filesFileNameIdx: index('files_file_name_idx').on(table.fileName),
    filesMimeTypeIdx: index('files_mime_type_idx').on(table.mimeType),
    filesProcessingStatusIdx: index('files_processing_status_idx').on(
      table.processingStatus
    ),
    filesUploadedAtIdx: index('files_uploaded_at_idx').on(table.uploadedAt),
    filesChecksumIdx: index('files_checksum_idx').on(table.checksum),
    // Storage calculation indexes will need to be updated to use workspace/link joins
  })
);
