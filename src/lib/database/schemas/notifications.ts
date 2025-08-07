// =============================================================================
// NOTIFICATIONS TABLE SCHEMA - Real-time notification tracking
// =============================================================================

import {
  pgTable,
  uuid,
  text,
  varchar,
  boolean,
  timestamp,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { links } from './links';
import { batches } from './batches';

/**
 * Notifications table - Track upload notifications for link owners
 */
export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').defaultRandom().primaryKey().notNull(),
    userId: text('user_id')
      .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' })
      .notNull(),
    linkId: uuid('link_id')
      .references(() => links.id, { onDelete: 'cascade' })
      .notNull(),
    batchId: uuid('batch_id').references(() => batches.id, {
      onDelete: 'cascade',
    }),
    
    // Notification details
    type: varchar('type', { length: 50 }).default('upload').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    metadata: jsonb('metadata'), // { fileCount, uploaderName, uploaderEmail }
    
    // Read status
    isRead: boolean('is_read').default(false).notNull(),
    readAt: timestamp('read_at', { withTimezone: true }),
    
    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    // Indexes for performance
    userUnreadIdx: index('idx_notifications_user_unread').on(
      table.userId,
      table.isRead
    ),
    linkIdx: index('idx_notifications_link').on(table.linkId),
    createdIdx: index('idx_notifications_created').on(table.createdAt),
  })
);

// Type exports
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;