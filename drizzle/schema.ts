import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  text,
  timestamp,
  uuid,
  varchar,
  bigint,
  pgTable,
  pgEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// =============================================================================
// ENUMS - Define custom PostgreSQL enums for MVP
// =============================================================================

export const linkTypeEnum = pgEnum('link_type', [
  'base',
  'custom',
  'generated',
]);

export const fileProcessingStatusEnum = pgEnum('file_processing_status', [
  'pending',
  'processing',
  'completed',
  'failed',
]);

export const batchStatusEnum = pgEnum('batch_status', [
  'uploading',
  'processing',
  'completed',
  'failed',
]);

export const subscriptionTierEnum = pgEnum('subscription_tier', [
  'free',
  'pro',
  'business',
  'enterprise',
]);

// =============================================================================
// USERS - Clerk Integration with SaaS Subscription Management
// =============================================================================

export const users = pgTable('users', {
  id: uuid('id').primaryKey().notNull(), // Clerk user ID
  email: varchar('email', { length: 255 }).unique().notNull(),
  username: varchar('username', { length: 100 }).unique().notNull(),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  avatarUrl: text('avatar_url'),

  // SaaS subscription management
  subscriptionTier: subscriptionTierEnum('subscription_tier')
    .default('free')
    .notNull(),
  storageUsed: bigint('storage_used', { mode: 'number' }).default(0).notNull(),
  storageLimit: bigint('storage_limit', { mode: 'number' })
    .default(2147483648)
    .notNull(), // 2GB

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Users indexes
export const usersUsernameIdx = uniqueIndex('users_username_idx').on(
  users.username
);
export const usersEmailIdx = index('users_email_idx').on(users.email);
export const usersSubscriptionIdx = index('users_subscription_idx').on(
  users.subscriptionTier
);

// =============================================================================
// WORKSPACES - 1:1 with Users for MVP Simplification
// =============================================================================

export const workspaces = pgTable('workspaces', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  name: varchar('name', { length: 255 }).notNull().default('My Files'),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Workspaces indexes
export const workspacesUserIdIdx = uniqueIndex('workspaces_user_id_idx').on(
  workspaces.userId
);

// =============================================================================
// LINKS - Multi-Link Architecture (Base, Custom, Generated)
// =============================================================================

export const links = pgTable('links', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  workspaceId: uuid('workspace_id')
    .references(() => workspaces.id, { onDelete: 'cascade' })
    .notNull(),

  // URL Components
  slug: varchar('slug', { length: 100 }).notNull(), // always the username
  topic: varchar('topic', { length: 100 }), // NULL for base links
  linkType: linkTypeEnum('link_type').default('base').notNull(),

  // Display
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),

  // Security controls
  requireEmail: boolean('require_email').default(false).notNull(),
  requirePassword: boolean('require_password').default(false).notNull(),
  passwordHash: text('password_hash'), // bcrypt hash if password required
  isPublic: boolean('is_public').default(true).notNull(),
  isActive: boolean('is_active').default(true).notNull(),

  // Limits and expiration
  maxFiles: integer('max_files').default(100).notNull(),
  maxFileSize: bigint('max_file_size', { mode: 'number' })
    .default(104857600)
    .notNull(), // 100MB
  expiresAt: timestamp('expires_at', { withTimezone: true }),

  // Branding (Pro+ features)
  brandEnabled: boolean('brand_enabled').default(false).notNull(),
  brandColor: varchar('brand_color', { length: 7 }), // e.g. #6c47ff

  // Usage Stats
  totalUploads: integer('total_uploads').default(0).notNull(),
  totalFiles: integer('total_files').default(0).notNull(),
  totalSize: bigint('total_size', { mode: 'number' }).default(0).notNull(),
  lastUploadAt: timestamp('last_upload_at', { withTimezone: true }),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Links indexes
export const linksUserIdIdx = index('links_user_id_idx').on(links.userId);
export const linksWorkspaceIdIdx = index('links_workspace_id_idx').on(
  links.workspaceId
);
export const linksSlugTopicIdx = uniqueIndex('links_slug_topic_idx').on(
  links.slug,
  links.topic
);
export const linksActiveIdx = index('links_active_idx').on(links.isActive);

// =============================================================================
// FOLDERS - Simplified Hierarchical Structure (No Colors/Descriptions for MVP)
// =============================================================================

export const folders = pgTable('folders', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  workspaceId: uuid('workspace_id')
    .references(() => workspaces.id, { onDelete: 'cascade' })
    .notNull(),
  parentFolderId: uuid('parent_folder_id').references((): any => folders.id, {
    onDelete: 'cascade',
  }),
  linkId: uuid('link_id').references(() => links.id, { onDelete: 'set null' }),

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
});

// Folders indexes
export const foldersUserIdIdx = index('folders_user_id_idx').on(folders.userId);
export const foldersWorkspaceIdIdx = index('folders_workspace_id_idx').on(
  folders.workspaceId
);
export const foldersParentFolderIdIdx = index(
  'folders_parent_folder_id_idx'
).on(folders.parentFolderId);
export const foldersLinkIdIdx = index('folders_link_id_idx').on(folders.linkId);
export const foldersPathIdx = index('folders_path_idx').on(folders.path);

// =============================================================================
// BATCHES - Upload Batch Organization
// =============================================================================

export const batches = pgTable('batches', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  linkId: uuid('link_id')
    .references(() => links.id, { onDelete: 'cascade' })
    .notNull(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  folderId: uuid('folder_id').references(() => folders.id, {
    onDelete: 'set null',
  }),

  // Uploader information
  uploaderName: varchar('uploader_name', { length: 255 }).notNull(),
  uploaderEmail: varchar('uploader_email', { length: 255 }),
  uploaderMessage: text('uploader_message'),

  // Batch metadata
  name: varchar('name', { length: 255 }),
  displayName: varchar('display_name', { length: 255 }), // [Uploader] (name) [date]

  status: batchStatusEnum('status').default('uploading').notNull(),
  totalFiles: integer('total_files').default(0).notNull(),
  processedFiles: integer('processed_files').default(0).notNull(),
  totalSize: bigint('total_size', { mode: 'number' }).default(0).notNull(),

  uploadCompletedAt: timestamp('upload_completed_at', { withTimezone: true }),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Batches indexes
export const batchesLinkIdIdx = index('batches_link_id_idx').on(batches.linkId);
export const batchesUserIdIdx = index('batches_user_id_idx').on(batches.userId);
export const batchesStatusIdx = index('batches_status_idx').on(batches.status);

// =============================================================================
// FILES - Comprehensive File Metadata with Root Folder Support
// =============================================================================

export const files = pgTable('files', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  linkId: uuid('link_id')
    .references(() => links.id, { onDelete: 'cascade' })
    .notNull(),
  batchId: uuid('batch_id')
    .references(() => batches.id, { onDelete: 'cascade' })
    .notNull(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  folderId: uuid('folder_id').references(() => folders.id, {
    onDelete: 'set null',
  }), // NULL = root folder

  // File metadata
  fileName: varchar('file_name', { length: 255 }).notNull(),
  originalName: varchar('original_name', { length: 255 }).notNull(),
  fileSize: bigint('file_size', { mode: 'number' }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  extension: varchar('extension', { length: 20 }),

  // Storage
  storagePath: text('storage_path').notNull(),
  storageProvider: varchar('storage_provider', { length: 50 })
    .default('supabase')
    .notNull(),
  checksum: varchar('checksum', { length: 64 }),

  // Security
  isSafe: boolean('is_safe').default(true).notNull(),
  virusScanResult: varchar('virus_scan_result', { length: 20 })
    .default('pending')
    .notNull(),

  // Processing
  processingStatus: fileProcessingStatusEnum('processing_status')
    .default('pending')
    .notNull(),
  thumbnailPath: text('thumbnail_path'),

  // Organization
  isOrganized: boolean('is_organized').default(false).notNull(),
  needsReview: boolean('needs_review').default(true).notNull(),

  // Access tracking
  downloadCount: integer('download_count').default(0).notNull(),
  lastAccessedAt: timestamp('last_accessed_at', { withTimezone: true }),

  // Timestamps
  uploadedAt: timestamp('uploaded_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Files indexes
export const filesLinkIdIdx = index('files_link_id_idx').on(files.linkId);
export const filesBatchIdIdx = index('files_batch_id_idx').on(files.batchId);
export const filesUserIdIdx = index('files_user_id_idx').on(files.userId);
export const filesFolderIdIdx = index('files_folder_id_idx').on(files.folderId); // Handles NULL for root
export const filesProcessingStatusIdx = index('files_processing_status_idx').on(
  files.processingStatus
);

// =============================================================================
// RELATIONS - Define all table relationships
// =============================================================================

export const usersRelations = relations(users, ({ many, one }) => ({
  workspace: one(workspaces),
  links: many(links),
  folders: many(folders),
  batches: many(batches),
  files: many(files),
}));

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
  user: one(users, {
    fields: [workspaces.userId],
    references: [users.id],
  }),
  links: many(links),
  folders: many(folders),
}));

export const linksRelations = relations(links, ({ one, many }) => ({
  user: one(users, {
    fields: [links.userId],
    references: [users.id],
  }),
  workspace: one(workspaces, {
    fields: [links.workspaceId],
    references: [workspaces.id],
  }),
  folders: many(folders),
  batches: many(batches),
  files: many(files),
}));

export const foldersRelations = relations(folders, ({ one, many }) => ({
  user: one(users, {
    fields: [folders.userId],
    references: [users.id],
  }),
  workspace: one(workspaces, {
    fields: [folders.workspaceId],
    references: [workspaces.id],
  }),
  parentFolder: one(folders, {
    fields: [folders.parentFolderId],
    references: [folders.id],
  }),
  link: one(links, {
    fields: [folders.linkId],
    references: [links.id],
  }),
  childFolders: many(folders),
  files: many(files),
}));

export const batchesRelations = relations(batches, ({ one, many }) => ({
  link: one(links, {
    fields: [batches.linkId],
    references: [links.id],
  }),
  user: one(users, {
    fields: [batches.userId],
    references: [users.id],
  }),
  folder: one(folders, {
    fields: [batches.folderId],
    references: [folders.id],
  }),
  files: many(files),
}));

export const filesRelations = relations(files, ({ one }) => ({
  link: one(links, {
    fields: [files.linkId],
    references: [links.id],
  }),
  batch: one(batches, {
    fields: [files.batchId],
    references: [batches.id],
  }),
  user: one(users, {
    fields: [files.userId],
    references: [users.id],
  }),
  folder: one(folders, {
    fields: [files.folderId],
    references: [folders.id],
  }),
}));
