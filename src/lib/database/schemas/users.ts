// =============================================================================
// USERS TABLE SCHEMA - Clerk Integration with SaaS Subscription Management
// =============================================================================
// 🎯 Defines the users table structure for Supabase database

import {
  pgTable,
  varchar,
  text,
  timestamp,
  bigint,
  index,
  uniqueIndex,
  jsonb,
} from 'drizzle-orm/pg-core';

/**
 * Users table - Clerk integration with minimal storage tracking
 * storage_used maintained for performance, updated via triggers/functions
 */
export const users = pgTable(
  'users',
  {
    id: text('id').primaryKey().notNull(), // Clerk user ID (string format)
    email: varchar('email', { length: 255 }).notNull(), // Removed unique constraint for organization support
    username: varchar('username', { length: 100 }).unique().notNull(),
    firstName: varchar('first_name', { length: 100 }),
    lastName: varchar('last_name', { length: 100 }),
    avatarUrl: text('avatar_url'),

    // Storage tracking (bytes) - for performance, updated when files change
    storageUsed: bigint('storage_used', { mode: 'number' })
      .default(0)
      .notNull(),

    // User Settings - Flexible JSON for easy extension
    settings: jsonb('settings')
      .default({
        theme: 'system',
        doNotDisturb: false,
        silentNotifications: false,
        cloudStorage: {
          google: { connected: false, lastSyncedAt: null },
          microsoft: { connected: false, lastSyncedAt: null },
        },
      })
      .notNull()
      .$type<{
        theme: 'light' | 'dark' | 'system';
        doNotDisturb: boolean;
        silentNotifications: boolean;
        cloudStorage?: {
          google?: {
            connected: boolean;
            lastSyncedAt: string | null;
            email?: string;
          };
          microsoft?: {
            connected: boolean;
            lastSyncedAt: string | null;
            email?: string;
          };
        };
        [key: string]: any; // Allow future settings
      }>(),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  table => ({
    usersUsernameIdx: uniqueIndex('users_username_idx').on(table.username),
    usersEmailIdx: index('users_email_idx').on(table.email), // Non-unique index for performance
    usersIdEmailIdx: uniqueIndex('users_id_email_idx').on(table.id, table.email), // Compound unique constraint
  })
);
