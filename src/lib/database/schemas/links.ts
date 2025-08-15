// =============================================================================
// LINKS TABLE SCHEMA - Multi-Link Architecture (Base, Custom, Generated)
// =============================================================================
// 🎯 Defines the links table structure for Supabase database

import {
  pgTable,
  varchar,
  text,
  boolean,
  integer,
  bigint,
  timestamp,
  uuid,
  json,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { linkTypeEnum } from '@/lib/database/schemas/enums';
import { users } from './users';
import { workspaces } from './workspaces';

/**
 * Links table - Multi-link architecture supporting base, custom, and generated links
 */
export const links = pgTable(
  'links',
  {
    id: uuid('id').defaultRandom().primaryKey().notNull(),
    userId: text('user_id')
      .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' })
      .notNull(),
    workspaceId: uuid('workspace_id')
      .references(() => workspaces.id, { onDelete: 'cascade' })
      .notNull(),

    // URL Components
    slug: varchar('slug', { length: 100 }).notNull(),
    topic: varchar('topic', { length: 100 }),
    linkType: linkTypeEnum('link_type').default('base').notNull(),

    // Display
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),

    // Security controls
    requireEmail: boolean('require_email').default(false).notNull(),
    requirePassword: boolean('require_password').default(false).notNull(),
    passwordHash: text('password_hash'),
    isActive: boolean('is_active').default(true).notNull(),

    // Limits and expiration
    maxFiles: integer('max_files').default(100).notNull(),
    maxFileSize: bigint('max_file_size', { mode: 'number' })
      .default(104857600)
      .notNull(), // 100MB
    allowedFileTypes: json('allowed_file_types').$type<string[]>(), // MIME types array
    expiresAt: timestamp('expires_at', { withTimezone: true }),

    // Branding (Pro+ features) - JSON object for flexibility
    branding: json('branding').$type<{
      enabled: boolean;
      color?: string;
      image?: string; // URL to brand image/logo
    }>().default({ enabled: false }),

    // Usage Stats
    totalUploads: integer('total_uploads').default(0).notNull(),
    totalFiles: integer('total_files').default(0).notNull(),
    totalSize: bigint('total_size', { mode: 'number' }).default(0).notNull(),
    lastUploadAt: timestamp('last_upload_at', { withTimezone: true }),

    // Storage Quota Management
    storageUsed: bigint('storage_used', { mode: 'number' })
      .default(0)
      .notNull(),
    storageLimit: bigint('storage_limit', { mode: 'number' })
      .default(524288000)
      .notNull(), // 500MB default per link

    // Notification tracking
    unreadUploads: integer('unread_uploads').default(0).notNull(),
    lastNotificationAt: timestamp('last_notification_at', { withTimezone: true }),

    // Generated Link Support
    sourceFolderId: uuid('source_folder_id'),
    // Foreign key reference to folders.id with CASCADE DELETE
    // When a folder is deleted, any generated links pointing to it are automatically deleted
    
    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  table => ({
    linksUserIdIdx: index('links_user_id_idx').on(table.userId),
    linksWorkspaceIdIdx: index('links_workspace_id_idx').on(table.workspaceId),
    linksSlugTopicIdx: uniqueIndex('links_slug_topic_idx').on(
      table.userId,
      table.slug,
      table.topic
    ),
    linksActiveIdx: index('links_active_idx').on(table.isActive),
    // Unique constraint: Only one generated link per folder
    linksSourceFolderIdx: uniqueIndex('links_source_folder_idx').on(table.sourceFolderId),
    // Note: Slug consistency is enforced at the application level in the database service
    // PostgreSQL check constraints cannot use subqueries, so this is handled in the service layer
  })
);
