// =============================================================================
// USERS TABLE SCHEMA - Clerk Integration with SaaS Subscription Management
// =============================================================================
// 🎯 Defines the users table structure for Supabase database

import {
  pgTable,
  varchar,
  text,
  bigint,
  timestamp,
  uuid,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { subscriptionTierEnum } from './enums';

/**
 * Users table - Clerk integration with SaaS subscription management
 */
export const users = pgTable(
  'users',
  {
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
    storageUsed: bigint('storage_used', { mode: 'number' })
      .default(0)
      .notNull(),
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
  },
  table => ({
    usersUsernameIdx: uniqueIndex('users_username_idx').on(table.username),
    usersEmailIdx: index('users_email_idx').on(table.email),
    usersSubscriptionIdx: index('users_subscription_idx').on(
      table.subscriptionTier
    ),
  })
);
