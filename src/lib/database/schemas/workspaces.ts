// =============================================================================
// WORKSPACES TABLE SCHEMA - 1:1 with Users for MVP Simplification
// =============================================================================
// 🎯 Defines the workspaces table structure for Supabase database

import {
  pgTable,
  varchar,
  timestamp,
  uuid,
  text,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * Workspaces table - 1:1 with users for MVP simplification
 */
export const workspaces = pgTable(
  'workspaces',
  {
    id: uuid('id').defaultRandom().primaryKey().notNull(),
    userId: text('user_id')
      .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' })
      .notNull(),
    name: varchar('name', { length: 255 }).notNull().default('My Files'),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  table => ({
    workspacesUserIdIdx: uniqueIndex('workspaces_user_id_idx').on(table.userId),
  })
);
