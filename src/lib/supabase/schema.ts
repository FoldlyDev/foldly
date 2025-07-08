import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  integer,
  text,
  timestamp,
  uuid,
  varchar,
  bigint,
  jsonb,
  pgTable,
  pgEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// =============================================================================
// ENUMS - Define custom PostgreSQL enums
// =============================================================================

export const linkTypeEnum = pgEnum('link_type', [
  'base',
  'custom',
  'generated',
]);
export const dataClassificationEnum = pgEnum('data_classification', [
  'public',
  'internal',
  'confidential',
  'restricted',
]);
export const fileProcessingStatusEnum = pgEnum('file_processing_status', [
  'pending',
  'processing',
  'completed',
  'failed',
  'quarantined',
]);
export const batchStatusEnum = pgEnum('batch_status', [
  'pending',
  'uploading',
  'processing',
  'completed',
  'failed',
  'cancelled',
]);
export const accessTypeEnum = pgEnum('access_type', [
  'view',
  'upload',
  'download',
  'delete',
  'share',
]);
export const platformRoleEnum = pgEnum('platform_role', [
  'free',
  'pro',
  'enterprise',
  'admin',
]);

// =============================================================================
// USERS - Extended Clerk User Data with Billing Integration
// =============================================================================

export const users = pgTable('users', {
  id: uuid('id').primaryKey().notNull(), // Matches Clerk user ID
  clerkUserId: varchar('clerk_user_id', { length: 255 }).unique().notNull(),

  // Profile information
  email: varchar('email', { length: 255 }).unique().notNull(),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  username: varchar('username', { length: 50 }).unique().notNull(),
  imageUrl: text('image_url'),

  // Platform settings (internal logic, Clerk manages billing features)
  platformRole: platformRoleEnum('platform_role').default('free').notNull(),
  onboardingCompleted: boolean('onboarding_completed').default(false).notNull(),

  // User preferences (JSON)
  preferences: jsonb('preferences').$type<{
    theme: 'light' | 'dark' | 'system';
    emailNotifications: {
      linkShared: boolean;
      folderActivity: boolean;
      securityAlerts: boolean;
      productUpdates: boolean;
      weeklyDigest: boolean;
    };
    privacySettings: {
      profileVisibility: 'public' | 'private' | 'organization';
      linkSharingDefault: 'public' | 'unlisted' | 'private';
      analyticsOptOut: boolean;
    };
    dashboardLayout: 'grid' | 'list' | 'compact';
  }>().default(sql`'{
    "theme": "system",
    "emailNotifications": {
      "linkShared": true,
      "folderActivity": true,
      "securityAlerts": true,
      "productUpdates": false,
      "weeklyDigest": true
    },
    "privacySettings": {
      "profileVisibility": "private",
      "linkSharingDefault": "unlisted",
      "analyticsOptOut": false
    },
    "dashboardLayout": "grid"
  }'::jsonb`),

  // Clerk Billing integration - cached subscription info for performance
  clerkSubscriptionStatus: varchar('clerk_subscription_status', { length: 50 }), // active, canceled, etc.
  lastBillingSync: timestamp('last_billing_sync', { withTimezone: true }), // Last sync with Clerk

  // Activity tracking
  lastActiveAt: timestamp('last_active_at', { withTimezone: true }),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Users indexes
export const usersClerkUserIdIdx = index('users_clerk_user_id_idx').on(
  users.clerkUserId
);
export const usersUsernameIdx = uniqueIndex('users_username_idx').on(
  users.username
);
export const usersEmailIdx = index('users_email_idx').on(users.email);
export const usersSubscriptionStatusIdx = index(
  'users_subscription_status_idx'
).on(users.clerkSubscriptionStatus);

// =============================================================================
// UPLOAD LINKS - Multi-Link Architecture with Feature-Based Access
// =============================================================================

export const uploadLinks = pgTable('upload_links', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),

  // Link identification and routing
  slug: varchar('slug', { length: 100 }).notNull(), // username for base, username/topic for custom
  topic: varchar('topic', { length: 100 }), // NULL for base links, topic name for custom links
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  instructions: text('instructions'), // Custom instructions for uploaders

  // Link type and behavior
  linkType: linkTypeEnum('link_type').default('base').notNull(),
  autoCreateFolders: boolean('auto_create_folders').default(true).notNull(),
  defaultFolderId: uuid('default_folder_id').references((): any => folders.id),

  // Required Clerk features for this link (feature-based access control)
  requiredFeatures: jsonb('required_features').$type<string[]>(), // e.g., ["custom_links", "advanced_branding"]

  // Security controls (recipient-managed)
  requireEmail: boolean('require_email').default(false).notNull(),
  requirePassword: boolean('require_password').default(false).notNull(),
  passwordHash: text('password_hash'), // bcrypt hash if password required
  isPublic: boolean('is_public').default(true).notNull(),
  allowFolderCreation: boolean('allow_folder_creation').default(true).notNull(),

  // File and upload limits (can be feature-dependent)
  maxFiles: integer('max_files').default(100).notNull(),
  maxFileSize: bigint('max_file_size', { mode: 'number' })
    .default(104857600)
    .notNull(), // 100MB default
  allowedFileTypes: jsonb('allowed_file_types').$type<string[]>(), // MIME type restrictions
  expiresAt: timestamp('expires_at', { withTimezone: true }),

  // Branding and customization (feature-gated)
  brandingEnabled: boolean('branding_enabled').default(false).notNull(),
  brandColor: varchar('brand_color', { length: 7 }), // Hex color
  accentColor: varchar('accent_color', { length: 7 }), // Secondary color
  logoUrl: text('logo_url'),
  customCss: text('custom_css'),
  welcomeMessage: text('welcome_message'),

  // Usage tracking
  totalUploads: integer('total_uploads').default(0).notNull(),
  totalFiles: integer('total_files').default(0).notNull(),
  totalSize: bigint('total_size', { mode: 'number' }).default(0).notNull(),
  lastUploadAt: timestamp('last_upload_at', { withTimezone: true }),

  // Status
  isActive: boolean('is_active').default(true).notNull(),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Upload Links indexes
export const uploadLinksUserIdIdx = index('upload_links_user_id_idx').on(
  uploadLinks.userId
);
export const uploadLinksSlugIdx = index('upload_links_slug_idx').on(
  uploadLinks.slug
);
export const uploadLinksTopicIdx = index('upload_links_topic_idx').on(
  uploadLinks.topic
);
export const uploadLinksActiveIdx = index('upload_links_active_idx').on(
  uploadLinks.isActive
);
export const uploadLinksTypeIdx = index('upload_links_type_idx').on(
  uploadLinks.linkType
);
export const uploadLinksUniqueSlugTopic = uniqueIndex(
  'upload_links_slug_topic_unique'
).on(uploadLinks.slug, uploadLinks.topic);

// =============================================================================
// FOLDERS - Hierarchical Organization System
// =============================================================================

export const folders = pgTable('folders', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  parentFolderId: uuid('parent_folder_id').references((): any => folders.id, {
    onDelete: 'cascade',
  }),
  uploadLinkId: uuid('upload_link_id').references(() => uploadLinks.id, {
    onDelete: 'cascade',
  }),

  // Folder information
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  color: varchar('color', { length: 7 }), // Hex color for organization
  path: text('path').notNull(), // e.g., "Projects/Client Work/Logo Design"

  // Organization and metadata
  isArchived: boolean('is_archived').default(false).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),

  // Security and permissions
  isPublic: boolean('is_public').default(false).notNull(),
  inheritPermissions: boolean('inherit_permissions').default(true).notNull(),
  classification: dataClassificationEnum('classification')
    .default('internal')
    .notNull(),

  // Statistics (maintained by triggers)
  fileCount: integer('file_count').default(0).notNull(),
  totalSize: bigint('total_size', { mode: 'number' }).default(0).notNull(),
  lastActivity: timestamp('last_activity', { withTimezone: true }),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Folder indexes
export const foldersUserIdIdx = index('folders_user_id_idx').on(folders.userId);
export const foldersParentFolderIdIdx = index(
  'folders_parent_folder_id_idx'
).on(folders.parentFolderId);
export const foldersUploadLinkIdIdx = index('folders_upload_link_id_idx').on(
  folders.uploadLinkId
);
export const foldersPathIdx = index('folders_path_idx').on(folders.path);
export const foldersArchivedIdx = index('folders_archived_idx').on(
  folders.isArchived
);

// =============================================================================
// UPLOAD BATCHES - Batch Processing System
// =============================================================================

export const uploadBatches = pgTable('upload_batches', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  uploadLinkId: uuid('upload_link_id')
    .references(() => uploadLinks.id, { onDelete: 'cascade' })
    .notNull(),

  // Uploader information
  uploaderName: varchar('uploader_name', { length: 255 }).notNull(),
  uploaderEmail: varchar('uploader_email', { length: 255 }),
  batchName: varchar('batch_name', { length: 255 }),
  displayName: varchar('display_name', { length: 500 }).notNull(), // Auto-generated: "[Name] (Batch) [Date]"

  // Batch metadata
  status: batchStatusEnum('status').default('pending').notNull(),
  totalFiles: integer('total_files').default(0).notNull(),
  processedFiles: integer('processed_files').default(0).notNull(),
  failedFiles: integer('failed_files').default(0).notNull(),
  totalSize: bigint('total_size', { mode: 'number' }).default(0).notNull(),

  // Processing information
  uploadStartedAt: timestamp('upload_started_at', {
    withTimezone: true,
  }).notNull(),
  uploadCompletedAt: timestamp('upload_completed_at', { withTimezone: true }),
  processingCompletedAt: timestamp('processing_completed_at', {
    withTimezone: true,
  }),
  estimatedCompletionAt: timestamp('estimated_completion_at', {
    withTimezone: true,
  }),

  // Organization
  targetFolderId: uuid('target_folder_id').references(() => folders.id),
  autoOrganized: boolean('auto_organized').default(false).notNull(),
  organizationRules: jsonb('organization_rules'), // JSON rules used

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Upload Batches indexes
export const uploadBatchesUserIdIdx = index('upload_batches_user_id_idx').on(
  uploadBatches.userId
);
export const uploadBatchesUploadLinkIdIdx = index(
  'upload_batches_upload_link_id_idx'
).on(uploadBatches.uploadLinkId);
export const uploadBatchesStatusIdx = index('upload_batches_status_idx').on(
  uploadBatches.status
);
export const uploadBatchesUploaderEmailIdx = index(
  'upload_batches_uploader_email_idx'
).on(uploadBatches.uploaderEmail);

// =============================================================================
// FILE UPLOADS - Enhanced with Batch Support
// =============================================================================

export const fileUploads = pgTable('file_uploads', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  uploadLinkId: uuid('upload_link_id')
    .references(() => uploadLinks.id, { onDelete: 'cascade' })
    .notNull(),
  folderId: uuid('folder_id').references(() => folders.id, {
    onDelete: 'set null',
  }),
  batchId: uuid('batch_id')
    .references(() => uploadBatches.id, { onDelete: 'cascade' })
    .notNull(),

  // Uploader information
  uploaderName: varchar('uploader_name', { length: 255 }).notNull(),
  uploaderEmail: varchar('uploader_email', { length: 255 }),
  uploaderMessage: text('uploader_message'),

  // File metadata
  fileName: varchar('file_name', { length: 500 }).notNull(),
  originalFileName: varchar('original_file_name', { length: 500 }).notNull(),
  fileSize: bigint('file_size', { mode: 'number' }).notNull(),
  fileType: varchar('file_type', { length: 100 }).notNull(),
  mimeType: varchar('mime_type', { length: 255 }).notNull(),
  storagePath: text('storage_path').notNull(),

  // File integrity and security
  md5Hash: varchar('md5_hash', { length: 32 }),
  sha256Hash: varchar('sha256_hash', { length: 64 }),
  virusScanResult: varchar('virus_scan_result', { length: 20 }).default(
    'pending'
  ),
  securityWarnings: jsonb('security_warnings').$type<
    Array<{
      type: 'file_type' | 'size' | 'malware' | 'suspicious_content';
      severity: 'low' | 'medium' | 'high' | 'critical';
      message: string;
      recommendation?: string;
    }>
  >(),

  // Processing status
  processingStatus: fileProcessingStatusEnum('processing_status')
    .default('pending')
    .notNull(),
  isProcessed: boolean('is_processed').default(false).notNull(),
  isSafe: boolean('is_safe').default(false).notNull(),
  thumbnailPath: text('thumbnail_path'),

  // Access and download tracking
  downloadCount: integer('download_count').default(0).notNull(),
  lastDownloadAt: timestamp('last_download_at', { withTimezone: true }),
  downloadLinks: jsonb('download_links').$type<string[]>(),

  // Classification and organization
  classification: dataClassificationEnum('classification')
    .default('internal')
    .notNull(),
  tags: jsonb('tags').$type<string[]>(),
  isArchived: boolean('is_archived').default(false).notNull(),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// File Uploads indexes
export const fileUploadsUserIdIdx = index('file_uploads_user_id_idx').on(
  fileUploads.userId
);
export const fileUploadsUploadLinkIdIdx = index(
  'file_uploads_upload_link_id_idx'
).on(fileUploads.uploadLinkId);
export const fileUploadsFolderIdIdx = index('file_uploads_folder_id_idx').on(
  fileUploads.folderId
);
export const fileUploadsBatchIdIdx = index('file_uploads_batch_id_idx').on(
  fileUploads.batchId
);
export const fileUploadsFileTypeIdx = index('file_uploads_file_type_idx').on(
  fileUploads.fileType
);
export const fileUploadsProcessingStatusIdx = index(
  'file_uploads_processing_status_idx'
).on(fileUploads.processingStatus);
export const fileUploadsUploaderEmailIdx = index(
  'file_uploads_uploader_email_idx'
).on(fileUploads.uploaderEmail);
export const fileUploadsArchivedIdx = index('file_uploads_archived_idx').on(
  fileUploads.isArchived
);

// =============================================================================
// ACCESS LOGS - Security and Analytics
// =============================================================================

export const linkAccessLogs = pgTable('link_access_logs', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  uploadLinkId: uuid('upload_link_id')
    .references(() => uploadLinks.id, { onDelete: 'cascade' })
    .notNull(),
  fileId: uuid('file_id').references(() => fileUploads.id, {
    onDelete: 'cascade',
  }),

  // Access information
  accessType: accessTypeEnum('access_type').notNull(),
  ipAddress: varchar('ip_address', { length: 45 }).notNull(), // IPv6 compatible
  userAgent: text('user_agent').notNull(),
  referer: text('referer'),
  country: varchar('country', { length: 100 }),
  city: varchar('city', { length: 100 }),

  // User context (if authenticated)
  accessorName: varchar('accessor_name', { length: 255 }),
  accessorEmail: varchar('accessor_email', { length: 255 }),

  // Security context
  wasPasswordRequired: boolean('was_password_required')
    .default(false)
    .notNull(),
  passwordAttempts: integer('password_attempts').default(0),
  securityFlags: jsonb('security_flags').$type<string[]>(),

  // Session information
  sessionId: varchar('session_id', { length: 255 }),
  sessionDuration: integer('session_duration'), // seconds

  // Metadata
  metadata: jsonb('metadata'),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Link Access Logs indexes
export const linkAccessLogsUserIdIdx = index('link_access_logs_user_id_idx').on(
  linkAccessLogs.userId
);
export const linkAccessLogsUploadLinkIdIdx = index(
  'link_access_logs_upload_link_id_idx'
).on(linkAccessLogs.uploadLinkId);
export const linkAccessLogsFileIdIdx = index('link_access_logs_file_id_idx').on(
  linkAccessLogs.fileId
);
export const linkAccessLogsAccessTypeIdx = index(
  'link_access_logs_access_type_idx'
).on(linkAccessLogs.accessType);
export const linkAccessLogsIpAddressIdx = index(
  'link_access_logs_ip_address_idx'
).on(linkAccessLogs.ipAddress);
export const linkAccessLogsCreatedAtIdx = index(
  'link_access_logs_created_at_idx'
).on(linkAccessLogs.createdAt);

// =============================================================================
// RELATIONS - Define all table relationships
// =============================================================================

export const usersRelations = relations(users, ({ many }) => ({
  uploadLinks: many(uploadLinks),
  folders: many(folders),
  fileUploads: many(fileUploads),
  uploadBatches: many(uploadBatches),
  accessLogs: many(linkAccessLogs),
}));

export const uploadLinksRelations = relations(uploadLinks, ({ one, many }) => ({
  user: one(users, {
    fields: [uploadLinks.userId],
    references: [users.id],
  }),
  defaultFolder: one(folders, {
    fields: [uploadLinks.defaultFolderId],
    references: [folders.id],
  }),
  folders: many(folders),
  fileUploads: many(fileUploads),
  uploadBatches: many(uploadBatches),
  accessLogs: many(linkAccessLogs),
}));

export const foldersRelations = relations(folders, ({ one, many }) => ({
  user: one(users, {
    fields: [folders.userId],
    references: [users.id],
  }),
  parentFolder: one(folders, {
    fields: [folders.parentFolderId],
    references: [folders.id],
  }),
  uploadLink: one(uploadLinks, {
    fields: [folders.uploadLinkId],
    references: [uploadLinks.id],
  }),
  childFolders: many(folders),
  fileUploads: many(fileUploads),
  targetedBatches: many(uploadBatches),
}));

export const uploadBatchesRelations = relations(
  uploadBatches,
  ({ one, many }) => ({
    user: one(users, {
      fields: [uploadBatches.userId],
      references: [users.id],
    }),
    uploadLink: one(uploadLinks, {
      fields: [uploadBatches.uploadLinkId],
      references: [uploadLinks.id],
    }),
    targetFolder: one(folders, {
      fields: [uploadBatches.targetFolderId],
      references: [folders.id],
    }),
    fileUploads: many(fileUploads),
  })
);

export const fileUploadsRelations = relations(fileUploads, ({ one, many }) => ({
  user: one(users, {
    fields: [fileUploads.userId],
    references: [users.id],
  }),
  uploadLink: one(uploadLinks, {
    fields: [fileUploads.uploadLinkId],
    references: [uploadLinks.id],
  }),
  folder: one(folders, {
    fields: [fileUploads.folderId],
    references: [folders.id],
  }),
  batch: one(uploadBatches, {
    fields: [fileUploads.batchId],
    references: [uploadBatches.id],
  }),
  accessLogs: many(linkAccessLogs),
}));

export const linkAccessLogsRelations = relations(linkAccessLogs, ({ one }) => ({
  user: one(users, {
    fields: [linkAccessLogs.userId],
    references: [users.id],
  }),
  uploadLink: one(uploadLinks, {
    fields: [linkAccessLogs.uploadLinkId],
    references: [uploadLinks.id],
  }),
  file: one(fileUploads, {
    fields: [linkAccessLogs.fileId],
    references: [fileUploads.id],
  }),
}));
